package service

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

var (
	ErrProviderNotFound            = errors.New("provider not found")
	ErrProviderAlreadyExists       = errors.New("provider already exists")
	ErrDuplicateFacilityCode       = errors.New("facility code already exists")
	ErrInvalidProvider             = errors.New("invalid provider data")
	ErrMissingRequiredField        = errors.New("missing required provider field")
	ErrInvalidFacilityCode         = errors.New("invalid facility code")
	ErrProviderUpstreamUnavailable = errors.New("provider upstream unavailable")
	ErrInvalidUpstreamResponse     = errors.New("invalid upstream response")
)

// ProviderRepository defines the interface for provider data access
type ProviderRepository interface {
	GetAll() ([]model.Provider, error)
	GetByID(id string) (model.Provider, error)
	GetByFacilityCode(facilityCode string) (model.Provider, error)
	Create(provider model.Provider) error
	Update(provider model.Provider) error
	Delete(id string) error
	Exists(id string) (bool, error)
}

// ProviderService handles provider registration and lookup
type ProviderService struct {
	repo       ProviderRepository
	httpClient *http.Client
}

// NewProviderService creates a new provider service
func NewProviderService(repo ProviderRepository) *ProviderService {
	return &ProviderService{
		repo: repo,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// RegisterInput represents the input for registering a provider
type RegisterInput struct {
	Name           string
	Type           model.ProviderType
	FacilityCode   string
	Location       string
	BaseURL        string
	GatewayAuthKey string
}

// Register adds a new provider to the registry
func (s *ProviderService) Register(input RegisterInput) (*model.Provider, error) {
	name := strings.TrimSpace(input.Name)
	facilityCode := normalizeFacilityCode(input.FacilityCode)
	location := strings.TrimSpace(input.Location)
	gatewayAuthKey := strings.TrimSpace(input.GatewayAuthKey)

	normalizedBaseURL, err := normalizeProviderBaseURL(input.BaseURL)
	if name == "" || err != nil {
		return nil, ErrInvalidProvider
	}
	if facilityCode == "" || location == "" || gatewayAuthKey == "" || input.Type == "" {
		return nil, ErrMissingRequiredField
	}
	if err := s.ensureFacilityCodeUnique(facilityCode, ""); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	provider := model.Provider{
		ID:             uuid.New().String(),
		Name:           name,
		Type:           input.Type,
		FacilityCode:   facilityCode,
		Location:       location,
		BaseURL:        normalizedBaseURL,
		GatewayAuthKey: gatewayAuthKey,
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.repo.Create(provider); err != nil {
		if errors.Is(err, repository.ErrAlreadyExists) {
			return nil, ErrProviderAlreadyExists
		}
		return nil, err
	}

	return &provider, nil
}

// GetByID retrieves a provider by ID
func (s *ProviderService) GetByID(id string) (*model.Provider, error) {
	provider, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}
	return &provider, nil
}

// GetAll retrieves all registered providers
func (s *ProviderService) GetAll() ([]model.Provider, error) {
	return s.repo.GetAll()
}

// GetBaseURL retrieves the base URL for a provider (used for routing)
func (s *ProviderService) GetBaseURL(id string) (string, error) {
	provider, err := s.GetByID(id)
	if err != nil {
		return "", err
	}
	return provider.BaseURL, nil
}

// Update modifies an existing provider
func (s *ProviderService) Update(id string, input RegisterInput) (*model.Provider, error) {
	provider, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}

	if input.Name != "" {
		provider.Name = strings.TrimSpace(input.Name)
	}
	if input.Type != "" {
		provider.Type = input.Type
	}
	if input.BaseURL != "" {
		normalizedBaseURL, normalizeErr := normalizeProviderBaseURL(input.BaseURL)
		if normalizeErr != nil {
			return nil, ErrInvalidProvider
		}
		provider.BaseURL = normalizedBaseURL
	}
	if input.FacilityCode != "" {
		facilityCode := normalizeFacilityCode(input.FacilityCode)
		if facilityCode == "" {
			return nil, ErrMissingRequiredField
		}
		if err := s.ensureFacilityCodeUnique(facilityCode, provider.ID); err != nil {
			return nil, err
		}
		provider.FacilityCode = facilityCode
	}
	if input.Location != "" {
		location := strings.TrimSpace(input.Location)
		if location == "" {
			return nil, ErrMissingRequiredField
		}
		provider.Location = location
	}
	if input.GatewayAuthKey != "" {
		gatewayAuthKey := strings.TrimSpace(input.GatewayAuthKey)
		if gatewayAuthKey == "" {
			return nil, ErrMissingRequiredField
		}
		provider.GatewayAuthKey = gatewayAuthKey
	}
	provider.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(provider); err != nil {
		return nil, err
	}

	return &provider, nil
}

// Delete removes a provider from the registry
func (s *ProviderService) Delete(id string) error {
	if err := s.repo.Delete(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrProviderNotFound
		}
		return err
	}
	return nil
}

// SetActive toggles the active status of a provider
func (s *ProviderService) SetActive(id string, active bool) (*model.Provider, error) {
	provider, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}

	provider.IsActive = active
	provider.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(provider); err != nil {
		return nil, err
	}

	return &provider, nil
}

// Exists checks if a provider exists
func (s *ProviderService) Exists(id string) (bool, error) {
	return s.repo.Exists(id)
}

func (s *ProviderService) ensureFacilityCodeUnique(facilityCode string, currentProviderID string) error {
	existing, err := s.repo.GetByFacilityCode(facilityCode)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil
		}
		return err
	}
	if existing.ID != currentProviderID {
		return ErrDuplicateFacilityCode
	}
	return nil
}

func normalizeFacilityCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}
