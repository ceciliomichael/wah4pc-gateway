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

func TestProviderHandlerGetPractitionersByFacility_Success(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"resourceType":"Bundle","entry":[{"resource":{"id":"prac-1","name":[{"text":"Dr. Demo"}]}}]}`))
	}))
	defer upstream.Close()

	repo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"provider-1": {
				ID:           "provider-1",
				FacilityCode: "HOSP-001",
				BaseURL:      upstream.URL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			},
		},
	}

	h := NewProviderHandler(service.NewProviderService(repo))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers/facilities/HOSP-001/practitioners", nil)
	rec := httptest.NewRecorder()

	h.GetPractitionersByFacility(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, rec.Code)
	}

	var resp APIResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !resp.Success {
		t.Fatalf("expected success response")
	}
}

func TestProviderHandlerGetPractitionersByFacility_EmptyFacilityCode(t *testing.T) {
	h := NewProviderHandler(service.NewProviderService(&testProviderRepoStub{items: map[string]model.Provider{}}))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers/facilities//practitioners", nil)
	rec := httptest.NewRecorder()

	h.GetPractitionersByFacility(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestProviderHandlerGetPractitionersByFacility_NotFound(t *testing.T) {
	h := NewProviderHandler(service.NewProviderService(&testProviderRepoStub{items: map[string]model.Provider{}}))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers/facilities/HOSP-404/practitioners", nil)
	rec := httptest.NewRecorder()

	h.GetPractitionersByFacility(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected %d, got %d", http.StatusNotFound, rec.Code)
	}
}

func TestProviderHandlerGetPractitionersByFacility_UpstreamError(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "down", http.StatusBadGateway)
	}))
	defer upstream.Close()

	repo := &testProviderRepoStub{
		items: map[string]model.Provider{
			"provider-1": {
				ID:           "provider-1",
				FacilityCode: "HOSP-001",
				BaseURL:      upstream.URL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			},
		},
	}

	h := NewProviderHandler(service.NewProviderService(repo))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers/facilities/HOSP-001/practitioners", nil)
	rec := httptest.NewRecorder()

	h.GetPractitionersByFacility(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected %d, got %d", http.StatusBadGateway, rec.Code)
	}

	if !strings.Contains(rec.Body.String(), "provider upstream unavailable") {
		t.Fatalf("expected upstream error message, got %s", rec.Body.String())
	}
}
