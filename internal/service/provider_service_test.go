package service

import (
	"net/http"
	"net/http/httptest"
	"testing"

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

func TestProviderServiceRegister_SyncsPractitionerList(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/practitioners" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.Header.Get("X-Gateway-Auth") != "sync-secret" {
			t.Fatalf("missing gateway auth header")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"resourceType": "Bundle",
			"entry": [
				{
					"resource": {
						"resourceType": "Practitioner",
						"id": "prac-001",
						"active": true,
						"name": [{"given": ["Maria"], "family": "Santos"}]
					}
				}
			]
		}`))
	}))
	defer server.Close()

	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	provider, err := svc.Register(RegisterInput{
		Name:                     "Test Provider",
		Type:                     model.ProviderTypeHospital,
		FacilityCode:             "HOSP-001",
		Location:                 "Quezon City",
		BaseURL:                  server.URL,
		GatewayAuthKey:           "sync-secret",
		PractitionerListEndpoint: "/fhir/practitioners",
	})
	if err != nil {
		t.Fatalf("expected register to succeed, got error: %v", err)
	}

	if len(provider.PractitionerList) != 1 {
		t.Fatalf("expected 1 practitioner, got %d", len(provider.PractitionerList))
	}
	if provider.PractitionerList[0].Code != "prac-001" {
		t.Fatalf("expected code prac-001, got %s", provider.PractitionerList[0].Code)
	}
	if provider.PractitionerListSyncError != "" {
		t.Fatalf("expected empty sync error, got %s", provider.PractitionerListSyncError)
	}
	if provider.PractitionerListLastSyncedAt.IsZero() {
		t.Fatal("expected PractitionerListLastSyncedAt to be set")
	}
}

func TestProviderServiceRegister_PersistsSyncErrorWithoutFailing(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	provider, err := svc.Register(RegisterInput{
		Name:                     "Test Provider",
		Type:                     model.ProviderTypeHospital,
		FacilityCode:             "HOSP-001",
		Location:                 "Quezon City",
		BaseURL:                  server.URL,
		GatewayAuthKey:           "sync-secret",
		PractitionerListEndpoint: "/fhir/practitioners",
	})
	if err != nil {
		t.Fatalf("expected register to succeed despite sync error, got: %v", err)
	}
	if provider.PractitionerListSyncError == "" {
		t.Fatal("expected sync error to be populated")
	}
	if len(provider.PractitionerList) != 0 {
		t.Fatalf("expected empty practitioner list on sync failure, got %d", len(provider.PractitionerList))
	}
}

func TestProviderServiceRegister_RejectsAbsolutePractitionerEndpoint(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	_, err := svc.Register(RegisterInput{
		Name:                     "Test Provider",
		Type:                     model.ProviderTypeHospital,
		FacilityCode:             "HOSP-001",
		Location:                 "Quezon City",
		BaseURL:                  "https://wah4clinic.echosphere.cfd",
		GatewayAuthKey:           "secret",
		PractitionerListEndpoint: "https://other.example/fhir/practitioners",
	})
	if err == nil {
		t.Fatal("expected register to fail for absolute practitioner endpoint")
	}
	if err != ErrInvalidProvider {
		t.Fatalf("expected ErrInvalidProvider, got %v", err)
	}
}

func TestProviderServiceSyncPractitionerList(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[
			{"code":"prac-001","display":"Dr. One","active":true},
			{"id":"prac-002","name":"Dr. Two","active":false}
		]`))
	}))
	defer server.Close()

	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	err := repo.Create(model.Provider{
		ID:                       "provider-1",
		Name:                     "Provider One",
		Type:                     model.ProviderTypeClinic,
		FacilityCode:             "CLINIC-001",
		Location:                 "Makati",
		BaseURL:                  server.URL,
		GatewayAuthKey:           "secret",
		PractitionerListEndpoint: "/fhir/practitioners",
		IsActive:                 true,
	})
	if err != nil {
		t.Fatalf("failed to seed provider: %v", err)
	}

	provider, err := svc.SyncPractitionerList("provider-1")
	if err != nil {
		t.Fatalf("expected sync to succeed, got: %v", err)
	}
	if len(provider.PractitionerList) != 2 {
		t.Fatalf("expected 2 practitioners, got %d", len(provider.PractitionerList))
	}
	if provider.PractitionerList[0].Code != "prac-001" {
		t.Fatalf("unexpected first practitioner code: %s", provider.PractitionerList[0].Code)
	}
}

func TestProviderServiceSyncPractitionerList_NotFound(t *testing.T) {
	repo := newProviderRepoStub()
	svc := NewProviderService(repo)

	_, err := svc.SyncPractitionerList("missing-provider")
	if err == nil {
		t.Fatal("expected not found error")
	}
	if err != ErrProviderNotFound {
		t.Fatalf("expected ErrProviderNotFound, got %v", err)
	}
}
