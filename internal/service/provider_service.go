package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

var (
	ErrProviderNotFound      = errors.New("provider not found")
	ErrProviderAlreadyExists = errors.New("provider already exists")
	ErrInvalidProvider       = errors.New("invalid provider data")
)

// ProviderRepository defines the interface for provider data access
type ProviderRepository interface {
	GetAll() ([]model.Provider, error)
	GetByID(id string) (model.Provider, error)
	Create(provider model.Provider) error
	Update(provider model.Provider) error
	Delete(id string) error
	Exists(id string) (bool, error)
}

// ProviderService handles provider registration and lookup
type ProviderService struct {
	repo ProviderRepository
}

// NewProviderService creates a new provider service
func NewProviderService(repo ProviderRepository) *ProviderService {
	return &ProviderService{repo: repo}
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
	normalizedBaseURL, err := normalizeProviderBaseURL(input.BaseURL)
	if input.Name == "" || err != nil {
		return nil, ErrInvalidProvider
	}

	now := time.Now().UTC()
	provider := model.Provider{
		ID:             uuid.New().String(),
		Name:           input.Name,
		Type:           input.Type,
		FacilityCode:   input.FacilityCode,
		Location:       input.Location,
		BaseURL:        normalizedBaseURL,
		GatewayAuthKey: input.GatewayAuthKey,
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
		provider.Name = input.Name
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
		provider.FacilityCode = input.FacilityCode
	}
	if input.Location != "" {
		provider.Location = input.Location
	}
	if input.GatewayAuthKey != "" {
		provider.GatewayAuthKey = input.GatewayAuthKey
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
