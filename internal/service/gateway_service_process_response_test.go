package service

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func TestGatewayServiceProcessResponse_ResourceTypeMismatch(t *testing.T) {
	t.Parallel()

	repo := newTxRepoStub()
	now := time.Now().UTC()
	repo.items["txn-1"] = model.Transaction{
		ID:           "txn-1",
		RequesterID:  "requester",
		TargetID:     "target",
		ResourceType: "Encounter",
		Status:       model.StatusPending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	svc := NewGatewayService(
		repo,
		nil,
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	err := svc.ProcessResponse(
		IncomingResultPayload{
			TransactionID: "txn-1",
			Status:        string(ResultStatusSuccess),
		},
		"target",
		"Patient",
	)
	if !errors.Is(err, ErrResourceTypeMismatch) {
		t.Fatalf("expected ErrResourceTypeMismatch, got: %v", err)
	}
}

func TestGatewayServiceProcessResponse_UnwrapsSingleItemArrayData(t *testing.T) {
	t.Parallel()

	requesterReceived := make(chan ReceiveResultPayload, 1)
	requester := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/receive-results" {
			http.NotFound(w, r)
			return
		}

		var payload ReceiveResultPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		requesterReceived <- payload
		w.WriteHeader(http.StatusOK)
	}))
	defer requester.Close()

	providerRepo := newProviderRepoStub()
	now := time.Now().UTC()
	_ = providerRepo.Create(model.Provider{
		ID:        "requester",
		Name:      "Requester",
		BaseURL:   requester.URL,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})
	_ = providerRepo.Create(model.Provider{
		ID:        "target",
		Name:      "Target",
		BaseURL:   "http://target.local",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	txRepo := newTxRepoStub()
	txRepo.items["txn-1"] = model.Transaction{
		ID:           "txn-1",
		RequesterID:  "requester",
		TargetID:     "target",
		ResourceType: "Observation",
		Status:       model.StatusPending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	svc := NewGatewayService(
		txRepo,
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	err := svc.ProcessResponse(
		IncomingResultPayload{
			TransactionID: "txn-1",
			Status:        string(ResultStatusSuccess),
			Data:          json.RawMessage(`[{"resourceType":"Observation","id":"obs-1"}]`),
		},
		"target",
		"Observation",
	)
	if err != nil {
		t.Fatalf("expected process response to succeed, got: %v", err)
	}

	select {
	case payload := <-requesterReceived:
		var obj map[string]interface{}
		if err := json.Unmarshal(payload.Data, &obj); err != nil {
			t.Fatalf("expected object payload in data, got invalid json: %v", err)
		}
		if got, _ := obj["resourceType"].(string); got != "Observation" {
			t.Fatalf("expected Observation payload, got %q", got)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected requester to receive relayed payload")
	}
}

func TestGatewayServiceProcessResponse_WrapsMultiItemArrayAsBundle(t *testing.T) {
	t.Parallel()

	requesterReceived := make(chan ReceiveResultPayload, 1)
	requester := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/receive-results" {
			http.NotFound(w, r)
			return
		}

		var payload ReceiveResultPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		requesterReceived <- payload
		w.WriteHeader(http.StatusOK)
	}))
	defer requester.Close()

	providerRepo := newProviderRepoStub()
	now := time.Now().UTC()
	_ = providerRepo.Create(model.Provider{
		ID:        "requester",
		Name:      "Requester",
		BaseURL:   requester.URL,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})
	_ = providerRepo.Create(model.Provider{
		ID:        "target",
		Name:      "Target",
		BaseURL:   "http://target.local",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	txRepo := newTxRepoStub()
	txRepo.items["txn-2"] = model.Transaction{
		ID:           "txn-2",
		RequesterID:  "requester",
		TargetID:     "target",
		ResourceType: "Observation",
		Status:       model.StatusPending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	svc := NewGatewayService(
		txRepo,
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	err := svc.ProcessResponse(
		IncomingResultPayload{
			TransactionID: "txn-2",
			Status:        string(ResultStatusSuccess),
			Data:          json.RawMessage(`[{"resourceType":"Observation","id":"obs-1"},{"resourceType":"Observation","id":"obs-2"}]`),
		},
		"target",
		"Observation",
	)
	if err != nil {
		t.Fatalf("expected process response to succeed, got: %v", err)
	}

	select {
	case payload := <-requesterReceived:
		var obj map[string]interface{}
		if err := json.Unmarshal(payload.Data, &obj); err != nil {
			t.Fatalf("expected object payload in data, got invalid json: %v", err)
		}
		if got, _ := obj["resourceType"].(string); got != "Bundle" {
			t.Fatalf("expected Bundle payload, got %q", got)
		}
		if got, _ := obj["type"].(string); got != "collection" {
			t.Fatalf("expected Bundle type collection, got %q", got)
		}
		entry, ok := obj["entry"].([]interface{})
		if !ok {
			t.Fatal("expected Bundle entry array")
		}
		if len(entry) != 2 {
			t.Fatalf("expected 2 bundle entries, got %d", len(entry))
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected requester to receive relayed payload")
	}
}

func TestGatewayServiceProcessResponse_TimesOutAfterTwentyFourHoursAndFailsTransaction(t *testing.T) {
	t.Parallel()

	requesterReceived := make(chan ReceiveResultPayload, 1)
	requester := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/receive-results" {
			http.NotFound(w, r)
			return
		}

		var payload ReceiveResultPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		requesterReceived <- payload
		w.WriteHeader(http.StatusOK)
	}))
	defer requester.Close()

	providerRepo := newProviderRepoStub()
	now := time.Now().UTC()
	_ = providerRepo.Create(model.Provider{
		ID:        "requester",
		Name:      "Requester",
		BaseURL:   requester.URL,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})
	_ = providerRepo.Create(model.Provider{
		ID:        "target",
		Name:      "Target",
		BaseURL:   "http://target.local",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	txRepo := newTxRepoStub()
	txRepo.items["txn-timeout"] = model.Transaction{
		ID:           "txn-timeout",
		RequesterID:  "requester",
		TargetID:     "target",
		ResourceType: "Observation",
		Status:       model.StatusPending,
		CreatedAt:    now.Add(-24*time.Hour - 1*time.Minute),
		UpdatedAt:    now.Add(-24*time.Hour - 1*time.Minute),
	}

	svc := NewGatewayService(
		txRepo,
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	err := svc.ProcessResponse(
		IncomingResultPayload{
			TransactionID: "txn-timeout",
			Status:        string(ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Observation","id":"obs-1"}`),
		},
		"target",
		"Observation",
	)
	if !errors.Is(err, ErrRequestTimedOut) {
		t.Fatalf("expected ErrRequestTimedOut, got: %v", err)
	}

	updated, getErr := txRepo.GetByID("txn-timeout")
	if getErr != nil {
		t.Fatalf("expected transaction to exist, got: %v", getErr)
	}
	if updated.Status != model.StatusFailed {
		t.Fatalf("expected transaction status %s, got %s", model.StatusFailed, updated.Status)
	}

	select {
	case payload := <-requesterReceived:
		if payload.Status != string(ResultStatusError) {
			t.Fatalf("expected requester timeout status %s, got %s", ResultStatusError, payload.Status)
		}
		if string(payload.Data) != `{"message":"request exceeded 24 hour timeout window"}` {
			t.Fatalf("unexpected timeout payload: %s", string(payload.Data))
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected requester to receive timeout payload")
	}
}
