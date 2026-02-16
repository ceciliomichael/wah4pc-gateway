package handler

import (
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
