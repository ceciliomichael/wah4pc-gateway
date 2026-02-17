package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

type simulationFlowHarness struct {
	handler           *GatewayHandler
	txRepo            *testTxRepoStub
	targetReceived    chan service.ProcessQueryPayload
	requesterReceived chan service.ReceiveResultPayload
}

func newSimulationFlowHarness(t *testing.T) *simulationFlowHarness {
	t.Helper()

	targetReceived := make(chan service.ProcessQueryPayload, 4)
	requesterReceived := make(chan service.ReceiveResultPayload, 4)

	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/process-query" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("X-Gateway-Auth") != "target-auth-key" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var payload service.ProcessQueryPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		targetReceived <- payload
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(targetServer.Close)

	requesterServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/receive-results" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("X-Gateway-Auth") != "requester-auth-key" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var payload service.ReceiveResultPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		requesterReceived <- payload
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(requesterServer.Close)

	now := time.Now().UTC()
	providerRepo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"requester": {
				ID:             "requester",
				Name:           "Requester",
				Type:           model.ProviderTypeClinic,
				BaseURL:        requesterServer.URL,
				GatewayAuthKey: "requester-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
			"target": {
				ID:             "target",
				Name:           "Target",
				Type:           model.ProviderTypeHospital,
				BaseURL:        targetServer.URL,
				GatewayAuthKey: "target-auth-key",
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			},
		},
	}

	txRepo := &testTxRepoStub{items: map[string]model.Transaction{}}
	gatewayService := service.NewGatewayService(
		txRepo,
		service.NewProviderService(providerRepo),
		service.NewSettingsService(&testSettingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	return &simulationFlowHarness{
		handler:           NewGatewayHandler(gatewayService),
		txRepo:            txRepo,
		targetReceived:    targetReceived,
		requesterReceived: requesterReceived,
	}
}

func TestSimulationFlow_RequesterGatewayProviderGatewayRequester(t *testing.T) {
	t.Run("success_phcore_observation", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-001"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		status := h.sendProviderResult(t, "Observation", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Observation","id":"obs-1","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"8480-6"}]},"meta":{"profile":["http://provider.local/StructureDefinition/custom-observation"]}}`),
		})
		if status != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, status)
		}

		relay := h.waitForRequesterRelay(t, tx.ID, string(service.ResultStatusSuccess))
		profile := firstProfileFromRelayBundle(t, relay.Data)
		wantProfile := "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"
		if profile != wantProfile {
			t.Fatalf("expected profile %q, got %q", wantProfile, profile)
		}

		updated := h.txRepo.items[tx.ID]
		if updated.Status != model.StatusCompleted {
			t.Fatalf("expected status %s, got %s", model.StatusCompleted, updated.Status)
		}
		if !updated.Metadata.ProfileNormalizationApplied {
			t.Fatal("expected profile normalization metadata to be applied")
		}
	})

	t.Run("success_base_r4_condition", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Condition", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-002"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		status := h.sendProviderResult(t, "Condition", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Condition","id":"cond-1","meta":{"profile":["http://provider.local/StructureDefinition/custom-condition"]}}`),
		})
		if status != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, status)
		}

		relay := h.waitForRequesterRelay(t, tx.ID, string(service.ResultStatusSuccess))
		profile := firstProfileFromRelayBundle(t, relay.Data)
		wantProfile := "http://hl7.org/fhir/StructureDefinition/Condition"
		if profile != wantProfile {
			t.Fatalf("expected profile %q, got %q", wantProfile, profile)
		}
	})

	t.Run("rejected_not_relayed_marked_failed", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-003"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		raw := `{"resourceType":"OperationOutcome","issue":[{"severity":"error","code":"not-found","details":{"text":"not found"}}]}`
		status := h.sendProviderResult(t, "Observation", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusRejected),
			Data:          json.RawMessage(raw),
		})
		if status != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, status)
		}

		select {
		case msg := <-h.requesterReceived:
			t.Fatalf("expected no relay to requester for rejected result, got %#v", msg)
		case <-time.After(250 * time.Millisecond):
		}

		updated := h.txRepo.items[tx.ID]
		if updated.Status != model.StatusFailed {
			t.Fatalf("expected status %s, got %s", model.StatusFailed, updated.Status)
		}
	})

	t.Run("error_passthrough", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-004"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		raw := `{"resourceType":"OperationOutcome","issue":[{"severity":"error","code":"exception","details":{"text":"provider failed"}}]}`
		status := h.sendProviderResult(t, "Observation", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusError),
			Data:          json.RawMessage(raw),
		})
		if status != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, status)
		}

		relay := h.waitForRequesterRelay(t, tx.ID, string(service.ResultStatusError))
		if normalizeJSON(t, relay.Data) != normalizeJSON(t, json.RawMessage(raw)) {
			t.Fatalf("expected error payload passthrough, got %s", string(relay.Data))
		}
	})

	t.Run("unauthorized_sender_blocked", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-005"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		status := h.sendProviderResult(t, "Observation", "other-provider", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Observation","id":"obs-2","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"8462-4"}]}}`),
		})
		if status != http.StatusForbidden {
			t.Fatalf("expected %d, got %d", http.StatusForbidden, status)
		}

		select {
		case msg := <-h.requesterReceived:
			t.Fatalf("expected no relay to requester, got %#v", msg)
		case <-time.After(250 * time.Millisecond):
		}
	})

	t.Run("resource_type_mismatch_blocked", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-006"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		status := h.sendProviderResult(t, "Patient", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Observation","id":"obs-3","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"85354-9"}]}}`),
		})
		if status != http.StatusConflict {
			t.Fatalf("expected %d, got %d", http.StatusConflict, status)
		}

		select {
		case msg := <-h.requesterReceived:
			t.Fatalf("expected no relay to requester, got %#v", msg)
		case <-time.After(250 * time.Millisecond):
		}
	})

	t.Run("timeout_marks_failed_and_notifies_requester", func(t *testing.T) {
		h := newSimulationFlowHarness(t)
		tx := h.initiateQuery(t, "Observation", `{
			"requesterId":"requester",
			"targetId":"target",
			"identifiers":[{"system":"http://example.org/patient-id","value":"PAT-007"}]
		}`)
		h.waitForTargetQuery(t, tx.ID)

		stale := h.txRepo.items[tx.ID]
		stale.CreatedAt = time.Now().UTC().Add(-24*time.Hour - 2*time.Minute)
		h.txRepo.items[tx.ID] = stale

		status := h.sendProviderResult(t, "Observation", "target", service.IncomingResultPayload{
			TransactionID: tx.ID,
			Status:        string(service.ResultStatusSuccess),
			Data:          json.RawMessage(`{"resourceType":"Observation","id":"obs-timeout","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"8310-5"}]}}`),
		})
		if status != http.StatusRequestTimeout {
			t.Fatalf("expected %d, got %d", http.StatusRequestTimeout, status)
		}

		relay := h.waitForRequesterRelay(t, tx.ID, string(service.ResultStatusError))
		if normalizeJSON(t, relay.Data) != normalizeJSON(t, json.RawMessage(`{"message":"request exceeded 24 hour timeout window"}`)) {
			t.Fatalf("unexpected timeout payload: %s", string(relay.Data))
		}

		updated := h.txRepo.items[tx.ID]
		if updated.Status != model.StatusFailed {
			t.Fatalf("expected status %s, got %s", model.StatusFailed, updated.Status)
		}
	})
}

func (h *simulationFlowHarness) initiateQuery(t *testing.T, resourceType, body string) model.Transaction {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/request/"+resourceType, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.handler.RequestQuery(rec, req)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected %d, got %d, body=%s", http.StatusAccepted, rec.Code, rec.Body.String())
	}

	var apiResp APIResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &apiResp); err != nil {
		t.Fatalf("failed to decode api response: %v", err)
	}

	rawData, err := json.Marshal(apiResp.Data)
	if err != nil {
		t.Fatalf("failed to re-marshal api response data: %v", err)
	}

	var tx model.Transaction
	if err := json.Unmarshal(rawData, &tx); err != nil {
		t.Fatalf("failed to decode transaction data: %v", err)
	}
	if tx.ID == "" {
		t.Fatal("expected transaction id")
	}
	return tx
}

func (h *simulationFlowHarness) waitForTargetQuery(t *testing.T, txID string) service.ProcessQueryPayload {
	t.Helper()

	select {
	case payload := <-h.targetReceived:
		if payload.TransactionID != txID {
			t.Fatalf("expected target payload tx %q, got %q", txID, payload.TransactionID)
		}
		return payload
	case <-time.After(2 * time.Second):
		t.Fatal("did not receive forwarded query at target provider")
		return service.ProcessQueryPayload{}
	}
}

func (h *simulationFlowHarness) sendProviderResult(t *testing.T, pathResourceType, senderProviderID string, payload service.IncomingResultPayload) int {
	t.Helper()

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/fhir/receive/"+pathResourceType, strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Provider-ID", senderProviderID)
	rec := httptest.NewRecorder()
	h.handler.ReceiveResult(rec, req)
	return rec.Code
}

func (h *simulationFlowHarness) waitForRequesterRelay(t *testing.T, txID, status string) service.ReceiveResultPayload {
	t.Helper()

	select {
	case payload := <-h.requesterReceived:
		if payload.TransactionID != txID {
			t.Fatalf("expected requester payload tx %q, got %q", txID, payload.TransactionID)
		}
		if payload.Status != status {
			t.Fatalf("expected requester status %q, got %q", status, payload.Status)
		}
		return payload
	case <-time.After(2 * time.Second):
		t.Fatal("did not receive relayed payload at requester provider")
		return service.ReceiveResultPayload{}
	}
}

func firstProfileFromRelayBundle(t *testing.T, raw json.RawMessage) string {
	t.Helper()

	var bundle map[string]interface{}
	if err := json.Unmarshal(raw, &bundle); err != nil {
		t.Fatalf("failed to decode relay bundle: %v", err)
	}
	entry, ok := bundle["entry"].([]interface{})
	if !ok || len(entry) == 0 {
		t.Fatalf("invalid bundle entry: %#v", bundle["entry"])
	}
	entryObj, ok := entry[0].(map[string]interface{})
	if !ok {
		t.Fatalf("bundle entry is not object: %#v", entry[0])
	}
	resource, ok := entryObj["resource"].(map[string]interface{})
	if !ok {
		t.Fatalf("bundle entry resource is not object: %#v", entryObj["resource"])
	}
	meta, ok := resource["meta"].(map[string]interface{})
	if !ok {
		t.Fatalf("resource meta is not object: %#v", resource["meta"])
	}
	profiles, ok := meta["profile"].([]interface{})
	if !ok || len(profiles) == 0 {
		t.Fatalf("meta.profile is invalid: %#v", meta["profile"])
	}
	profile, ok := profiles[0].(string)
	if !ok {
		t.Fatalf("profile is not a string: %#v", profiles[0])
	}
	return profile
}

func normalizeJSON(t *testing.T, raw json.RawMessage) string {
	t.Helper()
	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatalf("failed to unmarshal json for comparison: %v", err)
	}
	normalized, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("failed to marshal json for comparison: %v", err)
	}
	return string(normalized)
}
