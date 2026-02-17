package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"github.com/wah4pc/wah4pc-gateway/internal/validator"
)

var (
	ErrTransactionNotFound  = errors.New("transaction not found")
	ErrInvalidRequest       = errors.New("invalid request data")
	ErrInvalidResourceType  = errors.New("invalid resource type")
	ErrResourceTypeMismatch = errors.New("resource type mismatch")
	ErrRequestTimedOut      = errors.New("request took too long")
	ErrTargetUnreachable    = errors.New("target provider unreachable")
	ErrRequesterUnreachable = errors.New("requester provider unreachable")
	ErrInvalidStatus        = errors.New("transaction not in pending status")
	ErrUnauthorizedProvider = errors.New("provider not authorized for this transaction")
	ErrDuplicateRequest     = errors.New("duplicate request: identical request was made recently")
	ErrSchemaValidation     = errors.New("schema validation failed")
	ErrInvalidResultPayload = errors.New("invalid result payload")
)

// duplicateWindow defines how long to check for duplicate requests
const duplicateWindow = 5 * time.Minute
const requestTimeoutWindow = 24 * time.Hour
const upstreamErrorBodyLimit = 512
const maxForwardAttempts = 3

var duplicateBlockingStatuses = []model.TransactionStatus{
	model.StatusPending,
	model.StatusReceived,
}

// TransactionRepository defines the interface for transaction data access
type TransactionRepository interface {
	GetAll() ([]model.Transaction, error)
	GetByID(id string) (model.Transaction, error)
	Create(tx model.Transaction) error
	Update(tx model.Transaction) error
	FindPotentialDuplicates(requesterID, targetID, resourceType string, statuses []model.TransactionStatus, cutoff time.Time) ([]model.Transaction, error)
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
	if req.ResourceType == "" {
		req.ResourceType = "Patient" // Default
	}
	if err := normalizeAndValidateQuerySelector(&req); err != nil {
		return nil, err
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
	candidates, err := s.txRepo.FindPotentialDuplicates(
		req.RequesterID,
		req.TargetID,
		req.ResourceType,
		duplicateBlockingStatuses,
		cutoff,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to check for duplicates: %w", err)
	}

	duplicates := make([]model.Transaction, 0)
	for _, tx := range candidates {
		if model.QuerySelectorsMatch(effectiveSelectorFromTransaction(tx), req.Selector) {
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
		Identifiers:  req.Identifiers, // Legacy mirror of selector.patientIdentifiers
		Selector:     req.Selector,
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
		Identifiers:      req.Identifiers, // Legacy mirror of selector.patientIdentifiers
		Selector:         req.Selector,
		ResourceType:     req.ResourceType,
		Filters:          req.Filters,
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
func (s *GatewayService) ProcessResponse(result IncomingResultPayload, senderProviderID string, pathResourceType string) error {
	if !IsAllowedResourceType(pathResourceType) {
		return fmt.Errorf("%w: unsupported resourceType %q", ErrInvalidResourceType, pathResourceType)
	}

	// Look up the transaction
	tx, err := s.txRepo.GetByID(result.TransactionID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrTransactionNotFound
		}
		return err
	}

	if tx.ResourceType != pathResourceType {
		return fmt.Errorf("%w: expected %s, got %s", ErrResourceTypeMismatch, tx.ResourceType, pathResourceType)
	}

	// Validate transaction is in PENDING status (reject orphan/duplicate receives)
	if tx.Status != model.StatusPending {
		return fmt.Errorf("%w: current status is %s", ErrInvalidStatus, tx.Status)
	}

	// Requests that exceed the timeout window are failed and requester is notified.
	if time.Since(tx.CreatedAt) > requestTimeoutWindow {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		_ = s.txRepo.Update(tx)

		requesterProvider, err := s.providerService.GetByID(tx.RequesterID)
		if err == nil {
			requesterURL, urlErr := buildProviderEndpointURL(requesterProvider.BaseURL, "/fhir/receive-results")
			if urlErr == nil {
				timeoutPayload := ReceiveResultPayload{
					TransactionID: tx.ID,
					Status:        string(ResultStatusError),
					Data:          json.RawMessage(`{"message":"request exceeded 24 hour timeout window"}`),
				}
				_ = s.forwardToRequester(requesterURL, timeoutPayload, requesterProvider.GatewayAuthKey)
			}
		}

		return ErrRequestTimedOut
	}

	// Validate the sender is the expected target provider (security check)
	if senderProviderID != "" && senderProviderID != tx.TargetID {
		return ErrUnauthorizedProvider
	}

	if result.Status == string(ResultStatusRejected) || result.Status == string(ResultStatusError) {
		if err := validateOperationOutcomeData(result.Data); err != nil {
			return fmt.Errorf("%w: %v", ErrInvalidResultPayload, err)
		}
	}

	profileAudit := profileNormalizationAudit{}

	// Standardize successful query results to a FHIR Bundle for requester consistency.
	if result.Status == string(ResultStatusSuccess) {
		result.Data = normalizeSuccessResultDataAsBundle(result.Data)
		result.Data, profileAudit = normalizeCanonicalProfiles(result.Data)
		if profileAudit.Applied {
			tx.Metadata.OriginalProfiles = profileAudit.OriginalProfiles
			tx.Metadata.NormalizedProfiles = profileAudit.NormalizedProfiles
			tx.Metadata.ProfileNormalizationApplied = true
		}
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

	// Policy: REJECTED results are logged in transaction state but not relayed to requester.
	if result.Status == string(ResultStatusRejected) {
		tx.Status = model.StatusFailed
		tx.UpdatedAt = time.Now().UTC()
		if err := s.txRepo.Update(tx); err != nil {
			return fmt.Errorf("failed to update rejected transaction: %w", err)
		}
		return nil
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
	return s.forwardJSONWithRetry(url, body, authKey, "target provider", ErrTargetUnreachable)
}

// forwardPushToTarget sends the push payload to the target provider
func (s *GatewayService) forwardPushToTarget(url string, payload ProcessPushPayload, authKey string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}
	return s.forwardJSONWithRetry(url, body, authKey, "target provider", ErrTargetUnreachable)
}

// forwardToRequester sends the result data to the requester
func (s *GatewayService) forwardToRequester(url string, payload ReceiveResultPayload, authKey string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}
	return s.forwardJSONWithRetry(url, body, authKey, "requester provider", ErrRequesterUnreachable)
}

func (s *GatewayService) forwardJSONWithRetry(url string, body []byte, authKey string, upstream string, sentinel error) error {
	var lastTransportErr error

	for attempt := 1; attempt <= maxForwardAttempts; attempt++ {
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
			lastTransportErr = err
			if attempt == maxForwardAttempts {
				return errors.Join(sentinel, &UpstreamForwardingError{
					Upstream:   upstream,
					Attempts:   attempt,
					TargetURL:  url,
					LastReason: err.Error(),
				})
			}
			continue
		}

		detail := extractUpstreamErrorDetail(resp.Body)
		resp.Body.Close()

		if resp.StatusCode < 400 {
			return nil
		}

		if !isRetryableUpstreamStatus(resp.StatusCode) || attempt == maxForwardAttempts {
			return &UpstreamHTTPError{
				Upstream:     upstream,
				StatusCode:   resp.StatusCode,
				ResponseBody: detail,
				Attempts:     attempt,
				TargetURL:    url,
			}
		}
	}

	if lastTransportErr != nil {
		return errors.Join(sentinel, &UpstreamForwardingError{
			Upstream:   upstream,
			Attempts:   maxForwardAttempts,
			TargetURL:  url,
			LastReason: lastTransportErr.Error(),
		})
	}

	return errors.Join(sentinel, &UpstreamForwardingError{
		Upstream:   upstream,
		Attempts:   maxForwardAttempts,
		TargetURL:  url,
		LastReason: "unknown transport failure",
	})
}

func isRetryableUpstreamStatus(statusCode int) bool {
	if statusCode == http.StatusRequestTimeout || statusCode == http.StatusTooManyRequests {
		return true
	}
	return statusCode >= http.StatusInternalServerError
}

// extractUpstreamErrorDetail returns a compact, bounded upstream response body for diagnostics.
func extractUpstreamErrorDetail(body io.Reader) string {
	if body == nil {
		return ""
	}

	limited := io.LimitReader(body, upstreamErrorBodyLimit+1)
	raw, err := io.ReadAll(limited)
	if err != nil || len(raw) == 0 {
		return ""
	}

	if len(raw) > upstreamErrorBodyLimit {
		raw = raw[:upstreamErrorBodyLimit]
	}

	compact := strings.Join(strings.Fields(string(raw)), " ")
	return strings.TrimSpace(compact)
}

// normalizeSuccessResultDataAsBundle converts successful result payloads into a FHIR Bundle.
// - Bundle object: unchanged
// - Any other object: wrapped into single-entry collection Bundle
// - Array: wrapped into collection Bundle entries
// For invalid or unsupported JSON shapes, data is returned unchanged.
func normalizeSuccessResultDataAsBundle(data json.RawMessage) json.RawMessage {
	trimmed := bytes.TrimSpace(data)
	if len(trimmed) == 0 {
		return data
	}

	type bundleEntry struct {
		Resource json.RawMessage `json:"resource"`
	}
	type bundle struct {
		ResourceType string        `json:"resourceType"`
		Type         string        `json:"type"`
		Entry        []bundleEntry `json:"entry"`
	}

	switch trimmed[0] {
	case '{':
		var obj map[string]json.RawMessage
		if err := json.Unmarshal(trimmed, &obj); err != nil {
			return data
		}
		if rtRaw, ok := obj["resourceType"]; ok {
			var rt string
			if err := json.Unmarshal(rtRaw, &rt); err == nil && rt == "Bundle" {
				return data
			}
		}

		normalized, err := json.Marshal(bundle{
			ResourceType: "Bundle",
			Type:         "collection",
			Entry:        []bundleEntry{{Resource: trimmed}},
		})
		if err != nil {
			return data
		}
		return normalized
	case '[':
		var resources []json.RawMessage
		if err := json.Unmarshal(trimmed, &resources); err != nil {
			return data
		}
		resultBundle := bundle{
			ResourceType: "Bundle",
			Type:         "collection",
			Entry:        make([]bundleEntry, 0, len(resources)),
		}

		for _, resource := range resources {
			resultBundle.Entry = append(resultBundle.Entry, bundleEntry{Resource: resource})
		}

		normalized, err := json.Marshal(resultBundle)
		if err != nil {
			return data
		}
		return normalized
	default:
		return data
	}
}
