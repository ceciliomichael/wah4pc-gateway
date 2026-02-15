package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"github.com/wah4pc/wah4pc-gateway/internal/validator"
)

var (
	ErrTransactionNotFound  = errors.New("transaction not found")
	ErrInvalidRequest       = errors.New("invalid request data")
	ErrTargetUnreachable    = errors.New("target provider unreachable")
	ErrRequesterUnreachable = errors.New("requester provider unreachable")
	ErrInvalidStatus        = errors.New("transaction not in pending status")
	ErrUnauthorizedProvider = errors.New("provider not authorized for this transaction")
	ErrDuplicateRequest     = errors.New("duplicate request: identical request was made recently")
	ErrSchemaValidation     = errors.New("schema validation failed")
)

// duplicateWindow defines how long to check for duplicate requests
const duplicateWindow = 5 * time.Minute

// TransactionRepository defines the interface for transaction data access
type TransactionRepository interface {
	GetAll() ([]model.Transaction, error)
	GetByID(id string) (model.Transaction, error)
	Create(tx model.Transaction) error
	Update(tx model.Transaction) error
	FindPotentialDuplicates(requesterID, targetID, resourceType string, cutoff time.Time) ([]model.Transaction, error)
}

// GatewayService handles FHIR resource transfer orchestration
type GatewayService struct {
	txRepo          TransactionRepository
	providerService *ProviderService
	settingsService *SettingsService
	gatewayBaseURL  string
	httpClient      *http.Client
	validator       validator.Validator
}

// NewGatewayService creates a new gateway service
func NewGatewayService(
	txRepo TransactionRepository,
	providerService *ProviderService,
	settingsService *SettingsService,
	gatewayBaseURL string,
	resourceValidator validator.Validator,
) *GatewayService {
	return &GatewayService{
		txRepo:          txRepo,
		providerService: providerService,
		settingsService: settingsService,
		gatewayBaseURL:  gatewayBaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		validator: resourceValidator,
	}
}

// InitiateQuery starts a new FHIR resource transfer
// Flow: Requester -> Gateway -> Target
func (s *GatewayService) InitiateQuery(req QueryRequest) (*model.Transaction, error) {
	// Validate required fields
	if req.RequesterID == "" || req.TargetID == "" || len(req.Identifiers) == 0 {
		return nil, ErrInvalidRequest
	}
	if req.ResourceType == "" {
		req.ResourceType = "Patient" // Default
	}

	// Validate both providers exist
	if _, err := s.providerService.GetByID(req.RequesterID); err != nil {
		return nil, fmt.Errorf("requester: %w", err)
	}

	targetProvider, err := s.providerService.GetByID(req.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target: %w", err)
	}

	// Check for duplicate requests within the time window
	cutoff := time.Now().UTC().Add(-duplicateWindow)
	candidates, err := s.txRepo.FindPotentialDuplicates(req.RequesterID, req.TargetID, req.ResourceType, cutoff)
	if err != nil {
		return nil, fmt.Errorf("failed to check for duplicates: %w", err)
	}

	duplicates := make([]model.Transaction, 0)
	for _, tx := range candidates {
		if model.IdentifiersMatch(tx.Identifiers, req.Identifiers) {
			duplicates = append(duplicates, tx)
		}
	}
	if len(duplicates) > 0 {
		return nil, ErrDuplicateRequest
	}

	// Create transaction record
	now := time.Now().UTC()
	tx := model.Transaction{
		ID:           "txn_" + uuid.New().String(),
		RequesterID:  req.RequesterID,
		TargetID:     req.TargetID,
		Identifiers:  req.Identifiers,
		ResourceType: req.ResourceType,
		Status:       model.StatusPending,
		Metadata: model.TransactionMetadata{
			Reason: req.Reason,
			Notes:  req.Notes,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.txRepo.Create(tx); err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Build the return URL for the target to send data back
	gatewayReturnURL := fmt.Sprintf("%s/api/v1/fhir/receive/%s", s.gatewayBaseURL, req.ResourceType)

	// Forward request to target provider
	payload := ProcessQueryPayload{
		TransactionID:    tx.ID,
		RequesterID:      req.RequesterID,
		Identifiers:      req.Identifiers,
		ResourceType:     req.ResourceType,
		GatewayReturnURL: gatewayReturnURL,
		Reason:           req.Reason,
		Notes:            req.Notes,
	}

	targetURL, err := buildProviderEndpointURL(targetProvider.BaseURL, "/fhir/process-query")
	if err != nil {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return &tx, fmt.Errorf("invalid target provider baseUrl: %w", err)
	}
	if err := s.forwardToTarget(targetURL, payload, targetProvider.GatewayAuthKey); err != nil {
		// Update transaction status to failed
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return &tx, fmt.Errorf("failed to forward to target: %w", err)
	}

	return &tx, nil
}

// InitiatePush starts a new unsolicited FHIR resource transfer
// Flow: Sender -> Gateway -> Target
func (s *GatewayService) InitiatePush(req PushRequest) (*model.Transaction, error) {
	// Validate required fields
	if req.SenderID == "" || req.TargetID == "" {
		return nil, ErrInvalidRequest
	}
	if req.ResourceType == "" {
		req.ResourceType = "Patient" // Default
	}
	if len(req.Data) == 0 {
		return nil, ErrInvalidRequest
	}

	// Validate both providers exist
	if _, err := s.providerService.GetByID(req.SenderID); err != nil {
		return nil, fmt.Errorf("sender: %w", err)
	}

	targetProvider, err := s.providerService.GetByID(req.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target: %w", err)
	}

	// Perform business rule validation (e.g., logical identifiers for Appointments)
	if err := s.validatePushData(req.ResourceType, req.Data); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidRequest, err)
	}

	// Validate the data using the remote FHIR validator
	if s.validator != nil && !s.settingsService.IsValidatorDisabled() {
		if err := s.validator.Validate(req.ResourceType, req.Data); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrSchemaValidation, err)
		}
	}

	// Create transaction record
	now := time.Now().UTC()
	tx := model.Transaction{
		ID:           "txn_" + uuid.New().String(),
		RequesterID:  req.SenderID, // In a push, the sender is the "requester" (initiator)
		TargetID:     req.TargetID,
		Identifiers:  []model.Identifier{}, // Push might not have identifiers extracted yet
		ResourceType: req.ResourceType,
		Status:       model.StatusPending,
		Metadata: model.TransactionMetadata{
			Reason: req.Reason,
			Notes:  req.Notes,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.txRepo.Create(tx); err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Forward data to target provider
	payload := ProcessPushPayload{
		TransactionID: tx.ID,
		SenderID:      req.SenderID,
		ResourceType:  req.ResourceType,
		Data:          req.Data,
		Reason:        req.Reason,
		Notes:         req.Notes,
	}

	targetURL, err := buildProviderEndpointURL(targetProvider.BaseURL, "/fhir/receive-push")
	if err != nil {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return &tx, fmt.Errorf("invalid target provider baseUrl: %w", err)
	}
	if err := s.forwardPushToTarget(targetURL, payload, targetProvider.GatewayAuthKey); err != nil {
		// Update transaction status to failed
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return &tx, fmt.Errorf("failed to push to target: %w", err)
	}

	// If successful, mark as completed immediately
	tx.Status = model.StatusCompleted
	tx.UpdatedAt = time.Now().UTC()
	if err := s.txRepo.Update(tx); err != nil {
		return &tx, fmt.Errorf("failed to complete transaction: %w", err)
	}

	return &tx, nil
}

// ProcessResponse handles incoming data from a target provider
// Flow: Target -> Gateway -> Requester
func (s *GatewayService) ProcessResponse(result IncomingResultPayload, senderProviderID string) error {
	// Look up the transaction
	tx, err := s.txRepo.GetByID(result.TransactionID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrTransactionNotFound
		}
		return err
	}

	// Validate transaction is in PENDING status (reject orphan/duplicate receives)
	if tx.Status != model.StatusPending {
		return fmt.Errorf("%w: current status is %s", ErrInvalidStatus, tx.Status)
	}

	// Validate the sender is the expected target provider (security check)
	if senderProviderID != "" && senderProviderID != tx.TargetID {
		return ErrUnauthorizedProvider
	}

	// Validate the incoming data using the remote FHIR validator
	// Only validate if we have a validator and the status is SUCCESS
	if s.validator != nil && result.Status == string(ResultStatusSuccess) && !s.settingsService.IsValidatorDisabled() {
		if err := s.validator.Validate(tx.ResourceType, result.Data); err != nil {
			// Update transaction status to REJECTED due to validation failure
			tx.Status = model.StatusFailed
			tx.UpdatedAt = time.Now().UTC()
			_ = s.txRepo.Update(tx)
			return fmt.Errorf("%w: %v", ErrSchemaValidation, err)
		}
	}

	// Update transaction status to RECEIVED
	tx.Status = model.StatusReceived
	tx.UpdatedAt = time.Now().UTC()
	if err := s.txRepo.Update(tx); err != nil {
		return fmt.Errorf("failed to update transaction: %w", err)
	}

	// Look up the requester's URL
	requesterProvider, err := s.providerService.GetByID(tx.RequesterID)
	if err != nil {
		return fmt.Errorf("requester lookup failed: %w", err)
	}

	// Forward data to requester
	requesterURL, err := buildProviderEndpointURL(requesterProvider.BaseURL, "/fhir/receive-results")
	if err != nil {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return fmt.Errorf("invalid requester provider baseUrl: %w", err)
	}
	relayPayload := ReceiveResultPayload{
		TransactionID: tx.ID,
		Status:        result.Status,
		Data:          result.Data,
	}

	if err := s.forwardToRequester(requesterURL, relayPayload, requesterProvider.GatewayAuthKey); err != nil {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)
		return fmt.Errorf("failed to relay to requester: %w", err)
	}

	// Mark transaction as completed
	tx.Status = model.StatusCompleted
	tx.UpdatedAt = time.Now().UTC()
	if err := s.txRepo.Update(tx); err != nil {
		return fmt.Errorf("failed to complete transaction: %w", err)
	}

	return nil
}

// GetTransaction retrieves a transaction by ID
// If filterProviderID is non-empty, validates the provider is part of the transaction
func (s *GatewayService) GetTransaction(id string, filterProviderID string) (*model.Transaction, error) {
	tx, err := s.txRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrTransactionNotFound
		}
		return nil, err
	}

	// If a filter is applied, check the provider is involved in the transaction
	if filterProviderID != "" {
		if tx.RequesterID != filterProviderID && tx.TargetID != filterProviderID {
			return nil, ErrUnauthorizedProvider
		}
	}

	return &tx, nil
}

// GetAllTransactions retrieves all transactions
// If filterProviderID is non-empty, returns only transactions where the provider is requester or target
func (s *GatewayService) GetAllTransactions(filterProviderID string) ([]model.Transaction, error) {
	allTx, err := s.txRepo.GetAll()
	if err != nil {
		return nil, err
	}

	var result []model.Transaction

	// If no filter, use all transactions (admin access)
	if filterProviderID == "" {
		result = allTx
	} else {
		// Filter transactions where the provider is involved
		result = make([]model.Transaction, 0)
		for _, tx := range allTx {
			if tx.RequesterID == filterProviderID || tx.TargetID == filterProviderID {
				result = append(result, tx)
			}
		}
	}

	// Sort by CreatedAt descending (newest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})

	return result, nil
}

// forwardToTarget sends the query request to the target provider
func (s *GatewayService) forwardToTarget(url string, payload ProcessQueryPayload, authKey string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if authKey != "" {
		req.Header.Set("X-Gateway-Auth", authKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return ErrTargetUnreachable
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("target returned error %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// forwardPushToTarget sends the push payload to the target provider
func (s *GatewayService) forwardPushToTarget(url string, payload ProcessPushPayload, authKey string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if authKey != "" {
		req.Header.Set("X-Gateway-Auth", authKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return ErrTargetUnreachable
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("target returned error %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// forwardToRequester sends the result data to the requester
func (s *GatewayService) forwardToRequester(url string, payload ReceiveResultPayload, authKey string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if authKey != "" {
		req.Header.Set("X-Gateway-Auth", authKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return ErrRequesterUnreachable
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("requester returned error %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
