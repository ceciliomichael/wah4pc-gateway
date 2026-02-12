package service

import (
	"errors"
	"sync"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

// SettingsRepository defines the interface for settings storage
type SettingsRepository interface {
	GetByID(id string) (model.SystemSettings, error)
	Create(settings model.SystemSettings) error
	Update(settings model.SystemSettings) error
}

// SettingsService handles system settings operations
type SettingsService struct {
	repo SettingsRepository
	mu   sync.RWMutex
}

// NewSettingsService creates a new settings service
func NewSettingsService(repo SettingsRepository) *SettingsService {
	return &SettingsService{
		repo: repo,
	}
}

// GetSettings returns the current system settings
// If settings don't exist yet, it creates default settings
func (s *SettingsService) GetSettings() (*model.SystemSettings, error) {
	s.mu.RLock()
	// Try to get existing settings
	settings, err := s.repo.GetByID(model.SettingsIDGlobal)
	s.mu.RUnlock()

	if err == nil {
		return &settings, nil
	}

	if !errors.Is(err, repository.ErrNotFound) {
		return nil, err
	}

	// Create default settings if not found
	defaultSettings := model.SystemSettings{
		ID:                model.SettingsIDGlobal,
		ValidatorDisabled: false, // Enabled by default
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	
	// Check again in case another goroutine created it
	if _, err := s.repo.GetByID(model.SettingsIDGlobal); err == nil {
		settings, _ = s.repo.GetByID(model.SettingsIDGlobal)
		return &settings, nil
	}

	if err := s.repo.Create(defaultSettings); err != nil {
		return nil, err
	}

	return &defaultSettings, nil
}

// UpdateSettings updates the system settings
func (s *SettingsService) UpdateSettings(updates model.SystemSettings) (*model.SystemSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	current, err := s.repo.GetByID(model.SettingsIDGlobal)
	if err != nil {
		// If not found, try to create it first
		if errors.Is(err, repository.ErrNotFound) {
			current = model.SystemSettings{
				ID: model.SettingsIDGlobal,
			}
			if err := s.repo.Create(current); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	// Apply updates
	current.ValidatorDisabled = updates.ValidatorDisabled

	if err := s.repo.Update(current); err != nil {
		return nil, err
	}

	return &current, nil
}

// IsValidatorDisabled checks if validation is currently disabled
func (s *SettingsService) IsValidatorDisabled() bool {
	settings, err := s.GetSettings()
	if err != nil {
		// Default to enabled (false) on error for safety
		return false
	}
	return settings.ValidatorDisabled
}