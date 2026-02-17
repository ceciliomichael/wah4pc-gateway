package test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/handler"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	mongoRepo "github.com/wah4pc/wah4pc-gateway/internal/repository/mongo"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

func TestPushEndpoint_Success(t *testing.T) {
	receivedPush := make(chan service.ProcessPushPayload, 1)

	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if r.URL.Path != "/fhir/receive-push" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("X-Gateway-Auth") != "target-auth-key" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var payload service.ProcessPushPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}

		receivedPush <- payload
		w.WriteHeader(http.StatusOK)
	}))
	defer targetServer.Close()

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	mongoClient, err := mongoRepo.Connect(mongoURI)
	if err != nil {
		t.Skipf("skipping test: mongodb not reachable at %s: %v", mongoURI, err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(ctx)
	})

	dbName := "wah4pc_gateway_test_push_endpoint"
	db := mongoClient.Database(dbName)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = db.Drop(ctx)
	})

	providerRepo, err := mongoRepo.NewProviderRepository(db, "providers")
	if err != nil {
		t.Fatalf("failed to create provider repository: %v", err)
	}
	txRepo, err := mongoRepo.NewTransactionRepository(db, "transactions")
	if err != nil {
		t.Fatalf("failed to create transaction repository: %v", err)
	}
	settingsRepo, err := mongoRepo.NewSettingsRepository(db, "settings")
	if err != nil {
		t.Fatalf("failed to create settings repository: %v", err)
	}

	now := time.Now().UTC()
	if err := providerRepo.Create(model.Provider{
		ID:             "sender-provider",
		Name:           "Sender Provider",
		Type:           model.ProviderTypeClinic,
		BaseURL:        "http://sender.local",
		GatewayAuthKey: "sender-auth-key",
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}); err != nil {
		t.Fatalf("failed to create sender provider: %v", err)
	}

	if err := providerRepo.Create(model.Provider{
		ID:             "target-provider",
		Name:           "Target Provider",
		Type:           model.ProviderTypeHospital,
		BaseURL:        targetServer.URL,
		GatewayAuthKey: "target-auth-key",
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}); err != nil {
		t.Fatalf("failed to create target provider: %v", err)
	}

	providerService := service.NewProviderService(providerRepo)
	settingsService := service.NewSettingsService(settingsRepo)
	gatewayService := service.NewGatewayService(txRepo, providerService, settingsService, "http://gateway.local", nil)
	gatewayHandler := handler.NewGatewayHandler(gatewayService)

	requestBody := `{
		"senderId":"sender-provider",
		"targetId":"target-provider",
		"resource":{
			"resourceType":"Patient",
			"id":"patient-001"
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/push/Patient", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	gatewayHandler.RequestPush(recorder, req)

	response := recorder.Result()
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}

	var apiResp handler.APIResponse
	if err := json.NewDecoder(response.Body).Decode(&apiResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !apiResp.Success {
		t.Fatalf("expected success response, got error: %s", apiResp.Error)
	}

	dataBytes, err := json.Marshal(apiResp.Data)
	if err != nil {
		t.Fatalf("failed to marshal response data: %v", err)
	}

	var tx model.Transaction
	if err := json.Unmarshal(dataBytes, &tx); err != nil {
		t.Fatalf("failed to unmarshal transaction response: %v", err)
	}

	if tx.RequesterID != "sender-provider" {
		t.Fatalf("expected requesterId sender-provider, got %s", tx.RequesterID)
	}
	if tx.TargetID != "target-provider" {
		t.Fatalf("expected targetId target-provider, got %s", tx.TargetID)
	}
	if tx.ResourceType != "Patient" {
		t.Fatalf("expected resourceType Patient, got %s", tx.ResourceType)
	}
	if tx.Status != model.StatusCompleted {
		t.Fatalf("expected status %s, got %s", model.StatusCompleted, tx.Status)
	}

	select {
	case pushed := <-receivedPush:
		if pushed.SenderID != "sender-provider" {
			t.Fatalf("expected senderId sender-provider, got %s", pushed.SenderID)
		}
		if pushed.ResourceType != "Patient" {
			t.Fatalf("expected pushed resourceType Patient, got %s", pushed.ResourceType)
		}
		if len(pushed.Resource) == 0 {
			t.Fatal("expected pushed resource to be present")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("did not receive push payload at target endpoint")
	}
}

func TestRequestQuery_Target404ReturnsBadGateway(t *testing.T) {
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer targetServer.Close()

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	mongoClient, err := mongoRepo.Connect(mongoURI)
	if err != nil {
		t.Skipf("skipping test: mongodb not reachable at %s: %v", mongoURI, err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(ctx)
	})

	dbName := "wah4pc_gateway_test_query_target_404"
	db := mongoClient.Database(dbName)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = db.Drop(ctx)
	})

	providerRepo, err := mongoRepo.NewProviderRepository(db, "providers")
	if err != nil {
		t.Fatalf("failed to create provider repository: %v", err)
	}
	txRepo, err := mongoRepo.NewTransactionRepository(db, "transactions")
	if err != nil {
		t.Fatalf("failed to create transaction repository: %v", err)
	}
	settingsRepo, err := mongoRepo.NewSettingsRepository(db, "settings")
	if err != nil {
		t.Fatalf("failed to create settings repository: %v", err)
	}

	now := time.Now().UTC()
	if err := providerRepo.Create(model.Provider{
		ID:             "requester-provider",
		Name:           "Requester Provider",
		Type:           model.ProviderTypeClinic,
		BaseURL:        "http://requester.local",
		GatewayAuthKey: "requester-auth-key",
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}); err != nil {
		t.Fatalf("failed to create requester provider: %v", err)
	}

	if err := providerRepo.Create(model.Provider{
		ID:             "target-provider",
		Name:           "Target Provider",
		Type:           model.ProviderTypeHospital,
		BaseURL:        targetServer.URL,
		GatewayAuthKey: "target-auth-key",
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}); err != nil {
		t.Fatalf("failed to create target provider: %v", err)
	}

	providerService := service.NewProviderService(providerRepo)
	settingsService := service.NewSettingsService(settingsRepo)
	gatewayService := service.NewGatewayService(txRepo, providerService, settingsService, "http://gateway.local", nil)
	gatewayHandler := handler.NewGatewayHandler(gatewayService)

	requestBody := `{
		"requesterId":"requester-provider",
		"targetId":"target-provider",
		"identifiers":[{"system":"http://philhealth.gov.ph","value":"12-345678901-1"}]
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/request/Observation", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	gatewayHandler.RequestQuery(recorder, req)

	response := recorder.Result()
	defer response.Body.Close()

	if response.StatusCode != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, response.StatusCode)
	}

	var apiResp handler.APIResponse
	if err := json.NewDecoder(response.Body).Decode(&apiResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if apiResp.Success {
		t.Fatal("expected error response")
	}

	if !strings.Contains(apiResp.Error, "target provider returned HTTP Not Found (404)") {
		t.Fatalf("unexpected error message: %s", apiResp.Error)
	}
	if strings.Contains(apiResp.Error, "<!DOCTYPE") {
		t.Fatalf("error message should not include HTML body: %s", apiResp.Error)
	}
}
