package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

type testTxRepoStub struct {
	items map[string]model.Transaction
}

func (r *testTxRepoStub) GetAll() ([]model.Transaction, error) {
	result := make([]model.Transaction, 0, len(r.items))
	for _, tx := range r.items {
		result = append(result, tx)
	}
	return result, nil
}

func (r *testTxRepoStub) GetByID(id string) (model.Transaction, error) {
	tx, ok := r.items[id]
	if !ok {
		return model.Transaction{}, repository.ErrNotFound
	}
	return tx, nil
}

func (r *testTxRepoStub) Create(tx model.Transaction) error {
	r.items[tx.ID] = tx
	return nil
}

func (r *testTxRepoStub) Update(tx model.Transaction) error {
	r.items[tx.ID] = tx
	return nil
}

func (r *testTxRepoStub) FindPotentialDuplicates(_ string, _ string, _ string, _ []model.TransactionStatus, _ time.Time) ([]model.Transaction, error) {
	return []model.Transaction{}, nil
}

type testSettingsRepoStub struct{}

func (r *testSettingsRepoStub) GetByID(_ string) (model.SystemSettings, error) {
	return model.SystemSettings{}, repository.ErrNotFound
}

func (r *testSettingsRepoStub) Create(_ model.SystemSettings) error {
	return nil
}

func (r *testSettingsRepoStub) Update(_ model.SystemSettings) error {
	return nil
}

type testProviderRepoStub struct {
	items map[string]model.Provider
}

func (r *testProviderRepoStub) GetAll() ([]model.Provider, error) {
	result := make([]model.Provider, 0, len(r.items))
	for _, provider := range r.items {
		result = append(result, provider)
	}
	return result, nil
}

func (r *testProviderRepoStub) GetByID(id string) (model.Provider, error) {
	provider, ok := r.items[id]
	if !ok {
		return model.Provider{}, repository.ErrNotFound
	}
	return provider, nil
}

func (r *testProviderRepoStub) GetByFacilityCode(facilityCode string) (model.Provider, error) {
	for _, provider := range r.items {
		if provider.FacilityCode == facilityCode {
			return provider, nil
		}
	}
	return model.Provider{}, repository.ErrNotFound
}

func (r *testProviderRepoStub) Create(provider model.Provider) error {
	r.items[provider.ID] = provider
	return nil
}

func (r *testProviderRepoStub) Update(provider model.Provider) error {
	r.items[provider.ID] = provider
	return nil
}

func (r *testProviderRepoStub) Delete(id string) error {
	delete(r.items, id)
	return nil
}

func (r *testProviderRepoStub) Exists(id string) (bool, error) {
	_, ok := r.items[id]
	return ok, nil
}

func TestGatewayHandlerRequestQuery_InvalidResourceTypePath(t *testing.T) {
	h := &GatewayHandler{}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/request/encoutner23n32jnsd", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestQuery(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerRequestPush_ExtraPathSegmentRejected(t *testing.T) {
	h := &GatewayHandler{}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/push/Patient/extra", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestPush(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerRequestPush_MissingResourceRejected(t *testing.T) {
	h := &GatewayHandler{}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/push/Patient", strings.NewReader(`{"senderId":"a","targetId":"b"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestPush(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerRequestPush_ResourceTypeMismatchRejected(t *testing.T) {
	h := &GatewayHandler{}

	body := `{"senderId":"a","targetId":"b","resource":{"resourceType":"Observation"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/push/Patient", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestPush(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerRequestQuery_BodyPathResourceTypeMismatch(t *testing.T) {
	h := &GatewayHandler{}

	body := `{"requesterId":"a","targetId":"b","identifiers":[{"system":"s","value":"v"}],"resourceType":"Observation"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/request/Patient", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestQuery(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerReceiveResult_InvalidResourceTypePath(t *testing.T) {
	h := &GatewayHandler{}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/receive/encoutner23n32jnsd", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.ReceiveResult(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerReceiveResult_ResourceTypeMismatchReturnsConflict(t *testing.T) {
	now := time.Now().UTC()
	txRepo := &testTxRepoStub{
		items: map[string]model.Transaction{
			"txn-1": {
				ID:           "txn-1",
				RequesterID:  "requester",
				TargetID:     "target",
				ResourceType: "Encounter",
				Status:       model.StatusPending,
				CreatedAt:    now,
				UpdatedAt:    now,
			},
		},
	}

	gwService := service.NewGatewayService(
		txRepo,
		nil,
		service.NewSettingsService(&testSettingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
	h := NewGatewayHandler(gwService)

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/fhir/receive/Patient",
		strings.NewReader(`{"transactionId":"txn-1","status":"SUCCESS","data":{"resourceType":"Encounter"}}`),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.ReceiveResult(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected %d, got %d", http.StatusConflict, rec.Code)
	}
}

func TestGatewayHandlerReceiveResult_TimedOutReturnsRequestTimeout(t *testing.T) {
	now := time.Now().UTC()
	txRepo := &testTxRepoStub{
		items: map[string]model.Transaction{
			"txn-timeout": {
				ID:           "txn-timeout",
				RequesterID:  "requester",
				TargetID:     "target",
				ResourceType: "Observation",
				Status:       model.StatusPending,
				CreatedAt:    now.Add(-24*time.Hour - 2*time.Minute),
				UpdatedAt:    now.Add(-24*time.Hour - 2*time.Minute),
			},
		},
	}
	providerRepo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"requester": {
				ID:             "requester",
				Name:           "Requester",
				BaseURL:        "http://requester.local",
				GatewayAuthKey: "requester-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
			"target": {
				ID:             "target",
				Name:           "Target",
				BaseURL:        "http://target.local",
				GatewayAuthKey: "target-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
		},
	}

	gwService := service.NewGatewayService(
		txRepo,
		service.NewProviderService(providerRepo),
		service.NewSettingsService(&testSettingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
	h := NewGatewayHandler(gwService)

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/fhir/receive/Observation",
		strings.NewReader(`{"transactionId":"txn-timeout","status":"SUCCESS","data":{"resourceType":"Observation"}}`),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Provider-ID", "target")
	rec := httptest.NewRecorder()

	h.ReceiveResult(rec, req)

	if rec.Code != http.StatusRequestTimeout {
		t.Fatalf("expected %d, got %d", http.StatusRequestTimeout, rec.Code)
	}

	updated, err := txRepo.GetByID("txn-timeout")
	if err != nil {
		t.Fatalf("expected transaction to exist, got %v", err)
	}
	if updated.Status != model.StatusFailed {
		t.Fatalf("expected status %s, got %s", model.StatusFailed, updated.Status)
	}
}

func TestGatewayHandlerReceiveResult_RejectedRequiresOperationOutcome(t *testing.T) {
	now := time.Now().UTC()
	txRepo := &testTxRepoStub{
		items: map[string]model.Transaction{
			"txn-rej-invalid": {
				ID:           "txn-rej-invalid",
				RequesterID:  "requester",
				TargetID:     "target",
				ResourceType: "Observation",
				Status:       model.StatusPending,
				CreatedAt:    now,
				UpdatedAt:    now,
			},
		},
	}
	providerRepo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"requester": {
				ID:             "requester",
				Name:           "Requester",
				BaseURL:        "http://requester.local",
				GatewayAuthKey: "requester-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
			"target": {
				ID:             "target",
				Name:           "Target",
				BaseURL:        "http://target.local",
				GatewayAuthKey: "target-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
		},
	}

	gwService := service.NewGatewayService(
		txRepo,
		service.NewProviderService(providerRepo),
		service.NewSettingsService(&testSettingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
	h := NewGatewayHandler(gwService)

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/fhir/receive/Observation",
		strings.NewReader(`{"transactionId":"txn-rej-invalid","status":"REJECTED","data":{"message":"not found"}}`),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Provider-ID", "target")
	rec := httptest.NewRecorder()

	h.ReceiveResult(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestGatewayHandlerRequestQuery_TargetForwardingFailureReturnsRetrySummary(t *testing.T) {
	now := time.Now().UTC()
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	targetURL := target.URL
	target.Close()

	txRepo := &testTxRepoStub{
		items: map[string]model.Transaction{},
	}
	providerRepo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"requester": {
				ID:             "requester",
				Name:           "Requester",
				BaseURL:        "http://requester.local",
				GatewayAuthKey: "requester-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
			"target": {
				ID:             "target",
				Name:           "Target",
				BaseURL:        targetURL,
				GatewayAuthKey: "target-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
		},
	}

	gwService := service.NewGatewayService(
		txRepo,
		service.NewProviderService(providerRepo),
		service.NewSettingsService(&testSettingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
	h := NewGatewayHandler(gwService)

	body := `{"requesterId":"requester","targetId":"target","identifiers":[{"system":"sys","value":"123"}]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/request/Patient", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.RequestQuery(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected %d, got %d", http.StatusBadGateway, rec.Code)
	}

	var response APIResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("expected json response body, got error: %v", err)
	}

	msg := strings.ToLower(response.Error)
	if !strings.Contains(msg, "after 3 attempt") {
		t.Fatalf("expected retry summary in error response, got: %q", response.Error)
	}
}
