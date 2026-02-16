package service

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

type duplicateTxRepoStub struct {
	items                map[string]model.Transaction
	potentialDuplicates  []model.Transaction
	createdTransactions  []model.Transaction
	recordedStatusFilter []model.TransactionStatus
}

func newDuplicateTxRepoStub() *duplicateTxRepoStub {
	return &duplicateTxRepoStub{
		items:               make(map[string]model.Transaction),
		potentialDuplicates: make([]model.Transaction, 0),
		createdTransactions: make([]model.Transaction, 0),
	}
}

func (r *duplicateTxRepoStub) GetAll() ([]model.Transaction, error) {
	result := make([]model.Transaction, 0, len(r.items))
	for _, tx := range r.items {
		result = append(result, tx)
	}
	return result, nil
}

func (r *duplicateTxRepoStub) GetByID(id string) (model.Transaction, error) {
	tx, ok := r.items[id]
	if !ok {
		return model.Transaction{}, repository.ErrNotFound
	}
	return tx, nil
}

func (r *duplicateTxRepoStub) Create(tx model.Transaction) error {
	r.items[tx.ID] = tx
	r.createdTransactions = append(r.createdTransactions, tx)
	return nil
}

func (r *duplicateTxRepoStub) Update(tx model.Transaction) error {
	r.items[tx.ID] = tx
	return nil
}

func (r *duplicateTxRepoStub) FindPotentialDuplicates(requesterID, targetID, resourceType string, statuses []model.TransactionStatus, cutoff time.Time) ([]model.Transaction, error) {
	r.recordedStatusFilter = append([]model.TransactionStatus(nil), statuses...)

	statusAllowed := make(map[model.TransactionStatus]struct{}, len(statuses))
	for _, status := range statuses {
		statusAllowed[status] = struct{}{}
	}

	matches := make([]model.Transaction, 0)
	for _, tx := range r.potentialDuplicates {
		if tx.RequesterID != requesterID || tx.TargetID != targetID || tx.ResourceType != resourceType {
			continue
		}
		if tx.CreatedAt.Before(cutoff) {
			continue
		}
		if _, ok := statusAllowed[tx.Status]; !ok {
			continue
		}
		matches = append(matches, tx)
	}
	return matches, nil
}

func newGatewayForDuplicateTests(t *testing.T, txRepo *duplicateTxRepoStub, targetURL string) *GatewayService {
	t.Helper()

	providerRepo := newProviderRepoStub()
	now := time.Now().UTC()

	_ = providerRepo.Create(model.Provider{
		ID:        "requester",
		Name:      "Requester",
		BaseURL:   "https://requester.example",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})
	_ = providerRepo.Create(model.Provider{
		ID:        "target",
		Name:      "Target",
		BaseURL:   targetURL,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	return NewGatewayService(
		txRepo,
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
}

func newProcessQueryTargetServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/process-query" {
			http.NotFound(w, r)
			return
		}

		var payload ProcessQueryPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "invalid payload", http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusOK)
	}))
}

func newDuplicateQueryRequest(resourceType string) QueryRequest {
	return QueryRequest{
		RequesterID: "requester",
		TargetID:    "target",
		Identifiers: []model.Identifier{
			{System: "http://philhealth.gov.ph", Value: "12-345678901-1"},
		},
		ResourceType: resourceType,
	}
}

func TestInitiateQuery_AllowsRetryWhenPreviousMatchCompleted(t *testing.T) {
	target := newProcessQueryTargetServer()
	defer target.Close()

	txRepo := newDuplicateTxRepoStub()
	txRepo.potentialDuplicates = []model.Transaction{
		{
			ID:           "txn-prev-completed",
			RequesterID:  "requester",
			TargetID:     "target",
			Identifiers:  newDuplicateQueryRequest("Patient").Identifiers,
			ResourceType: "Patient",
			Status:       model.StatusCompleted,
			CreatedAt:    time.Now().UTC(),
		},
	}

	svc := newGatewayForDuplicateTests(t, txRepo, target.URL)

	tx, err := svc.InitiateQuery(newDuplicateQueryRequest("Patient"))
	if err != nil {
		t.Fatalf("expected retry to be accepted, got error: %v", err)
	}
	if tx == nil {
		t.Fatal("expected created transaction")
	}
	if len(txRepo.createdTransactions) != 1 {
		t.Fatalf("expected 1 created transaction, got %d", len(txRepo.createdTransactions))
	}
}

func TestInitiateQuery_AllowsRetryWhenPreviousMatchFailed(t *testing.T) {
	target := newProcessQueryTargetServer()
	defer target.Close()

	txRepo := newDuplicateTxRepoStub()
	txRepo.potentialDuplicates = []model.Transaction{
		{
			ID:           "txn-prev-failed",
			RequesterID:  "requester",
			TargetID:     "target",
			Identifiers:  newDuplicateQueryRequest("Patient").Identifiers,
			ResourceType: "Patient",
			Status:       model.StatusFailed,
			CreatedAt:    time.Now().UTC(),
		},
	}

	svc := newGatewayForDuplicateTests(t, txRepo, target.URL)

	tx, err := svc.InitiateQuery(newDuplicateQueryRequest("Patient"))
	if err != nil {
		t.Fatalf("expected retry to be accepted, got error: %v", err)
	}
	if tx == nil {
		t.Fatal("expected created transaction")
	}
}

func TestInitiateQuery_BlocksDuplicateWhenPreviousMatchPending(t *testing.T) {
	txRepo := newDuplicateTxRepoStub()
	txRepo.potentialDuplicates = []model.Transaction{
		{
			ID:           "txn-prev-pending",
			RequesterID:  "requester",
			TargetID:     "target",
			Identifiers:  newDuplicateQueryRequest("Patient").Identifiers,
			ResourceType: "Patient",
			Status:       model.StatusPending,
			CreatedAt:    time.Now().UTC(),
		},
	}

	svc := newGatewayForDuplicateTests(t, txRepo, "http://target.local")

	_, err := svc.InitiateQuery(newDuplicateQueryRequest("Patient"))
	if !errors.Is(err, ErrDuplicateRequest) {
		t.Fatalf("expected ErrDuplicateRequest, got: %v", err)
	}
}

func TestInitiateQuery_BlocksDuplicateWhenPreviousMatchReceived(t *testing.T) {
	txRepo := newDuplicateTxRepoStub()
	txRepo.potentialDuplicates = []model.Transaction{
		{
			ID:           "txn-prev-received",
			RequesterID:  "requester",
			TargetID:     "target",
			Identifiers:  newDuplicateQueryRequest("Patient").Identifiers,
			ResourceType: "Patient",
			Status:       model.StatusReceived,
			CreatedAt:    time.Now().UTC(),
		},
	}

	svc := newGatewayForDuplicateTests(t, txRepo, "http://target.local")

	_, err := svc.InitiateQuery(newDuplicateQueryRequest("Patient"))
	if !errors.Is(err, ErrDuplicateRequest) {
		t.Fatalf("expected ErrDuplicateRequest, got: %v", err)
	}
}

func TestInitiateQuery_AcceptsSameIdentifierWhenResourceTypeDiffers(t *testing.T) {
	target := newProcessQueryTargetServer()
	defer target.Close()

	txRepo := newDuplicateTxRepoStub()
	txRepo.potentialDuplicates = []model.Transaction{
		{
			ID:           "txn-prev-patient",
			RequesterID:  "requester",
			TargetID:     "target",
			Identifiers:  newDuplicateQueryRequest("Observation").Identifiers,
			ResourceType: "Patient",
			Status:       model.StatusPending,
			CreatedAt:    time.Now().UTC(),
		},
	}

	svc := newGatewayForDuplicateTests(t, txRepo, target.URL)

	tx, err := svc.InitiateQuery(newDuplicateQueryRequest("Observation"))
	if err != nil {
		t.Fatalf("expected request to be accepted for different resource type, got: %v", err)
	}
	if tx == nil {
		t.Fatal("expected created transaction")
	}
}
