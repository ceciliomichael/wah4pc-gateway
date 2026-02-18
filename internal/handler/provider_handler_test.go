package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

type providerRepoStub struct {
	items map[string]model.Provider
}

func (r *providerRepoStub) GetAll() ([]model.Provider, error) {
	result := make([]model.Provider, 0, len(r.items))
	for _, p := range r.items {
		result = append(result, p)
	}
	return result, nil
}

func (r *providerRepoStub) GetByID(id string) (model.Provider, error) {
	item, ok := r.items[id]
	if !ok {
		return model.Provider{}, repository.ErrNotFound
	}
	return item, nil
}

func (r *providerRepoStub) GetByFacilityCode(facilityCode string) (model.Provider, error) {
	for _, item := range r.items {
		if item.FacilityCode == facilityCode {
			return item, nil
		}
	}
	return model.Provider{}, repository.ErrNotFound
}

func (r *providerRepoStub) Create(provider model.Provider) error {
	r.items[provider.ID] = provider
	return nil
}

func (r *providerRepoStub) Update(provider model.Provider) error {
	if _, exists := r.items[provider.ID]; !exists {
		return repository.ErrNotFound
	}
	r.items[provider.ID] = provider
	return nil
}

func (r *providerRepoStub) Delete(id string) error {
	delete(r.items, id)
	return nil
}

func (r *providerRepoStub) Exists(id string) (bool, error) {
	_, exists := r.items[id]
	return exists, nil
}

type providerListAPIResponse struct {
	Success bool                     `json:"success"`
	Data    []PublicProviderResponse `json:"data"`
	Error   string                   `json:"error,omitempty"`
}

func TestProviderHandlerGetAll_HidesPractitionerListForPublic(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:       "p1",
				Name:     "Provider One",
				Type:     model.ProviderTypeHospital,
				BaseURL:  "https://example.com",
				IsActive: true,
				PractitionerList: []model.ProviderPractitioner{
					{Code: "prac-1", Display: "Dr. One", Active: true},
				},
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	rr := httptest.NewRecorder()
	h.GetAll(rr, req)

	var response providerListAPIResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(response.Data) != 1 {
		t.Fatalf("expected one provider, got %d", len(response.Data))
	}
	if len(response.Data[0].PractitionerList) != 0 {
		t.Fatal("expected practitionerList to be hidden for unauthenticated request")
	}
}

func TestProviderHandlerGetAll_HidesPractitionerListForAPIKeyAuth(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:       "p1",
				Name:     "Provider One",
				Type:     model.ProviderTypeHospital,
				BaseURL:  "https://example.com",
				IsActive: true,
				PractitionerList: []model.ProviderPractitioner{
					{Code: "prac-1", Display: "Dr. One", Active: true},
				},
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyAuthSource, "api_key")
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	h.GetAll(rr, req)

	var response providerListAPIResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(response.Data) != 1 {
		t.Fatalf("expected one provider, got %d", len(response.Data))
	}
	if len(response.Data[0].PractitionerList) != 0 {
		t.Fatalf("expected practitionerList to be hidden for API key auth, got %d", len(response.Data[0].PractitionerList))
	}
}

func TestProviderHandlerGetAll_HidesPractitionerListForMasterKeyAuth(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:       "p1",
				Name:     "Provider One",
				Type:     model.ProviderTypeHospital,
				BaseURL:  "https://example.com",
				IsActive: true,
				PractitionerList: []model.ProviderPractitioner{
					{Code: "prac-1", Display: "Dr. One", Active: true},
				},
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyAuthSource, "master_key")
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	h.GetAll(rr, req)

	var response providerListAPIResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(response.Data) != 1 {
		t.Fatalf("expected one provider, got %d", len(response.Data))
	}
	if len(response.Data[0].PractitionerList) != 0 {
		t.Fatal("expected practitionerList to be hidden for master key auth")
	}
}

func TestProviderHandlerSyncPractitionerListWebhook_AdminAllowed(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:        "p1",
				Name:      "Provider One",
				Type:      model.ProviderTypeHospital,
				BaseURL:   "https://example.com",
				IsActive:  true,
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/providers/p1/practitioners/webhook", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyRole, model.ApiKeyRoleAdmin)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	h.SyncPractitionerListWebhook(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestProviderHandlerSyncPractitionerListWebhook_UserOwnProviderAllowed(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:        "p1",
				Name:      "Provider One",
				Type:      model.ProviderTypeHospital,
				BaseURL:   "https://example.com",
				IsActive:  true,
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/providers/p1/practitioners/webhook", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyRole, model.ApiKeyRoleUser)
	ctx = context.WithValue(ctx, middleware.ContextKeyProviderID, "p1")
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	h.SyncPractitionerListWebhook(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestProviderHandlerSyncPractitionerListWebhook_UserDifferentProviderForbidden(t *testing.T) {
	repo := &providerRepoStub{
		items: map[string]model.Provider{
			"p1": {
				ID:        "p1",
				Name:      "Provider One",
				Type:      model.ProviderTypeHospital,
				BaseURL:   "https://example.com",
				IsActive:  true,
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			},
		},
	}
	h := NewProviderHandler(service.NewProviderService(repo))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/providers/p1/practitioners/webhook", nil)
	ctx := context.WithValue(req.Context(), middleware.ContextKeyRole, model.ApiKeyRoleUser)
	ctx = context.WithValue(ctx, middleware.ContextKeyProviderID, "p2")
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	h.SyncPractitionerListWebhook(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}
