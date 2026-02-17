package service

import (
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
