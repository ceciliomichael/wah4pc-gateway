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

type providerRepoStub struct {
	items map[string]model.Provider
}

func newProviderRepoStub() *providerRepoStub {
	return &providerRepoStub{items: make(map[string]model.Provider)}
}

func (r *providerRepoStub) GetAll() ([]model.Provider, error) {
	result := make([]model.Provider, 0, len(r.items))
	for _, p := range r.items {
		result = append(result, p)
	}
	return result, nil
}

func (r *providerRepoStub) GetByID(id string) (model.Provider, error) {
	p, ok := r.items[id]
	if !ok {
		return model.Provider{}, repository.ErrNotFound
	}
	return p, nil
}

func (r *providerRepoStub) GetByFacilityCode(facilityCode string) (model.Provider, error) {
	for _, provider := range r.items {
		if provider.FacilityCode == facilityCode {
			return provider, nil
		}
	}
	return model.Provider{}, repository.ErrNotFound
}

func (r *providerRepoStub) Create(provider model.Provider) error {
	if _, exists := r.items[provider.ID]; exists {
		return repository.ErrAlreadyExists
	}
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
	if _, exists := r.items[id]; !exists {
		return repository.ErrNotFound
	}
	delete(r.items, id)
	return nil
}

func (r *providerRepoStub) Exists(id string) (bool, error) {
	_, exists := r.items[id]
	return exists, nil
}

func TestProviderServiceRegister_NormalizesBaseURL(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	provider, err := svc.Register(RegisterInput{
		Name:           "Test Provider",
		Type:           model.ProviderTypeHospital,
		FacilityCode:   " hosp-001 ",
		Location:       "Quezon City",
		BaseURL:        " https://wah4clinic.echosphere.cfd/ ",
		GatewayAuthKey: "secret",
	})
	if err != nil {
		t.Fatalf("expected register to succeed, got error: %v", err)
	}

	if provider.BaseURL != "https://wah4clinic.echosphere.cfd" {
		t.Fatalf("expected normalized baseUrl, got %q", provider.BaseURL)
	}
	if provider.FacilityCode != "HOSP-001" {
		t.Fatalf("expected normalized facility code, got %q", provider.FacilityCode)
	}
}

func TestProviderServiceRegister_InvalidBaseURL(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	_, err := svc.Register(RegisterInput{
		Name:           "Test Provider",
		Type:           model.ProviderTypeHospital,
		FacilityCode:   "HOSP-001",
		Location:       "Quezon City",
		BaseURL:        "wah4clinic.echosphere.cfd/api",
		GatewayAuthKey: "secret",
	})
	if err == nil {
		t.Fatal("expected register to fail for invalid baseUrl")
	}
	if err != ErrInvalidProvider {
		t.Fatalf("expected ErrInvalidProvider, got %v", err)
	}
}

func TestProviderServiceRegister_RequiresFacilityCodeAndLocation(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	_, err := svc.Register(RegisterInput{
		Name:           "Test Provider",
		Type:           model.ProviderTypeHospital,
		BaseURL:        "https://wah4clinic.echosphere.cfd",
		GatewayAuthKey: "secret",
	})
	if err == nil {
		t.Fatal("expected register to fail for missing required fields")
	}
	if err != ErrMissingRequiredField {
		t.Fatalf("expected ErrMissingRequiredField, got %v", err)
	}
}

func TestProviderServiceRegister_DuplicateFacilityCode(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	_, err := svc.Register(RegisterInput{
		Name:           "Provider One",
		Type:           model.ProviderTypeHospital,
		FacilityCode:   "HOSP-001",
		Location:       "Quezon City",
		BaseURL:        "https://a.example",
		GatewayAuthKey: "secret1",
	})
	if err != nil {
		t.Fatalf("expected first register to succeed, got error: %v", err)
	}

	_, err = svc.Register(RegisterInput{
		Name:           "Provider Two",
		Type:           model.ProviderTypeClinic,
		FacilityCode:   "hosp-001",
		Location:       "Makati",
		BaseURL:        "https://b.example",
		GatewayAuthKey: "secret2",
	})
	if err == nil {
		t.Fatal("expected duplicate facility code error")
	}
	if err != ErrDuplicateFacilityCode {
		t.Fatalf("expected ErrDuplicateFacilityCode, got %v", err)
	}
}

func TestProviderServiceGetPractitionersByFacilityCode_Success(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Gateway-Auth") != "secret-key" {
			t.Fatalf("expected X-Gateway-Auth header to be set")
		}

		response := map[string]interface{}{
			"resourceType": "Bundle",
			"type":         "searchset",
			"entry": []map[string]interface{}{
				{
					"resource": map[string]interface{}{
						"id": "prac-123",
						"name": []map[string]interface{}{
							{
								"given":  []string{"Juan"},
								"family": "Dela Cruz",
							},
						},
						"identifier": []map[string]interface{}{
							{"system": "http://prc.gov.ph/license", "value": "PRC-001"},
						},
					},
				},
			},
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			t.Fatalf("failed to encode response: %v", err)
		}
	}))
	defer upstream.Close()

	repo := newProviderRepoStub()
	repo.items["provider-1"] = model.Provider{
		ID:             "provider-1",
		FacilityCode:   "HOSP-001",
		BaseURL:        upstream.URL,
		GatewayAuthKey: "secret-key",
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
	}

	svc := NewProviderService(repo)
	svc.httpClient = upstream.Client()

	practitioners, err := svc.GetPractitionersByFacilityCode("hosp-001")
	if err != nil {
		t.Fatalf("expected lookup to succeed, got %v", err)
	}
	if len(practitioners) != 1 {
		t.Fatalf("expected 1 practitioner, got %d", len(practitioners))
	}
	if practitioners[0].Reference != "Practitioner/prac-123" {
		t.Fatalf("expected practitioner reference, got %q", practitioners[0].Reference)
	}
	if practitioners[0].Display != "Juan Dela Cruz" {
		t.Fatalf("expected display name, got %q", practitioners[0].Display)
	}
	if len(practitioners[0].Identifiers) != 1 {
		t.Fatalf("expected identifiers to be mapped")
	}
}

func TestProviderServiceGetPractitionersByFacilityCode_EnvelopeResponse(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"success":true,"data":{"resourceType":"Bundle","entry":[{"resource":{"id":"prac-900","name":[{"text":"Dr. Test User"}]}}]}}`))
	}))
	defer upstream.Close()

	repo := newProviderRepoStub()
	repo.items["provider-1"] = model.Provider{
		ID:           "provider-1",
		FacilityCode: "HOSP-001",
		BaseURL:      upstream.URL,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	svc := NewProviderService(repo)
	svc.httpClient = upstream.Client()

	practitioners, err := svc.GetPractitionersByFacilityCode("HOSP-001")
	if err != nil {
		t.Fatalf("expected lookup to succeed, got %v", err)
	}
	if len(practitioners) != 1 {
		t.Fatalf("expected 1 practitioner, got %d", len(practitioners))
	}
	if practitioners[0].Display != "Dr. Test User" {
		t.Fatalf("expected display to use name.text, got %q", practitioners[0].Display)
	}
}

func TestProviderServiceGetPractitionersByFacilityCode_FacilityNotFound(t *testing.T) {
	svc := NewProviderService(newProviderRepoStub())

	_, err := svc.GetPractitionersByFacilityCode("missing")
	if !errors.Is(err, ErrProviderNotFound) {
		t.Fatalf("expected ErrProviderNotFound, got %v", err)
	}
}

func TestProviderServiceGetPractitionersByFacilityCode_UpstreamError(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "unavailable", http.StatusServiceUnavailable)
	}))
	defer upstream.Close()

	repo := newProviderRepoStub()
	repo.items["provider-1"] = model.Provider{
		ID:           "provider-1",
		FacilityCode: "HOSP-001",
		BaseURL:      upstream.URL,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	svc := NewProviderService(repo)
	svc.httpClient = upstream.Client()

	_, err := svc.GetPractitionersByFacilityCode("HOSP-001")
	if !errors.Is(err, ErrProviderUpstreamUnavailable) {
		t.Fatalf("expected ErrProviderUpstreamUnavailable, got %v", err)
	}
}

func TestProviderServiceGetPractitionersByFacilityCode_InvalidPayload(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"hello":"world"}`))
	}))
	defer upstream.Close()

	repo := newProviderRepoStub()
	repo.items["provider-1"] = model.Provider{
		ID:           "provider-1",
		FacilityCode: "HOSP-001",
		BaseURL:      upstream.URL,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	svc := NewProviderService(repo)
	svc.httpClient = upstream.Client()

	_, err := svc.GetPractitionersByFacilityCode("HOSP-001")
	if !errors.Is(err, ErrInvalidUpstreamResponse) {
		t.Fatalf("expected ErrInvalidUpstreamResponse, got %v", err)
	}
}
