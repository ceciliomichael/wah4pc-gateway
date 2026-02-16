package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

type txRepoStub struct {
	items map[string]model.Transaction
}

func newTxRepoStub() *txRepoStub {
	return &txRepoStub{items: make(map[string]model.Transaction)}
}

func (r *txRepoStub) GetAll() ([]model.Transaction, error) {
	result := make([]model.Transaction, 0, len(r.items))
	for _, tx := range r.items {
		result = append(result, tx)
	}
	return result, nil
}

func (r *txRepoStub) GetByID(id string) (model.Transaction, error) {
	tx, ok := r.items[id]
	if !ok {
		return model.Transaction{}, repository.ErrNotFound
	}
	return tx, nil
}

func (r *txRepoStub) Create(tx model.Transaction) error {
	r.items[tx.ID] = tx
	return nil
}

func (r *txRepoStub) Update(tx model.Transaction) error {
	r.items[tx.ID] = tx
	return nil
}

func (r *txRepoStub) FindPotentialDuplicates(_ string, _ string, _ string, _ []model.TransactionStatus, _ time.Time) ([]model.Transaction, error) {
	return []model.Transaction{}, nil
}

type settingsRepoStub struct {
	settings model.SystemSettings
	exists   bool
}

func (r *settingsRepoStub) GetByID(_ string) (model.SystemSettings, error) {
	if !r.exists {
		return model.SystemSettings{}, repository.ErrNotFound
	}
	return r.settings, nil
}

func (r *settingsRepoStub) Create(settings model.SystemSettings) error {
	r.settings = settings
	r.exists = true
	return nil
}

func (r *settingsRepoStub) Update(settings model.SystemSettings) error {
	r.settings = settings
	r.exists = true
	return nil
}

func TestGatewayServiceInitiateQuery_HandlesWhitespaceInStoredBaseURL(t *testing.T) {
	received := make(chan ProcessQueryPayload, 1)
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/process-query" {
			http.NotFound(w, r)
			return
		}

		var payload ProcessQueryPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		received <- payload
		w.WriteHeader(http.StatusOK)
	}))
	defer target.Close()

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
		BaseURL:   " " + target.URL + " ",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	gateway := NewGatewayService(
		newTxRepoStub(),
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"https://gateway.example",
		nil,
	)

	tx, err := gateway.InitiateQuery(QueryRequest{
		RequesterID: "requester",
		TargetID:    "target",
		Identifiers: []model.Identifier{
			{System: "http://philhealth.gov.ph", Value: "12-345678901-1"},
		},
		ResourceType: "Observation",
	})
	if err != nil {
		t.Fatalf("expected initiate query to succeed, got error: %v", err)
	}
	if tx == nil {
		t.Fatal("expected transaction")
	}

	select {
	case payload := <-received:
		if payload.ResourceType != "Observation" {
			t.Fatalf("expected Observation payload, got %s", payload.ResourceType)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected request to reach target /fhir/process-query endpoint")
	}
}
