package service

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"golang.org/x/time/rate"
)

var (
	ErrInvalidApiKey      = errors.New("invalid or inactive API key")
	ErrInsufficientRole   = errors.New("insufficient permissions")
	ErrInvalidProviderKey = errors.New("invalid provider ID for API key")
	ErrProviderRequired   = errors.New("provider ID is required for user role")
)

// ApiKeyRepository defines the interface for API key storage
type ApiKeyRepository interface {
	GetAll() ([]model.ApiKey, error)
	GetByID(id string) (model.ApiKey, error)
	GetByHash(keyHash string) (model.ApiKey, error)
	Create(key model.ApiKey) error
	Update(key model.ApiKey) error
	Delete(id string) error
}

// ProviderValidator defines the interface for validating provider IDs
type ProviderValidator interface {
	Exists(id string) (bool, error)
}

// ApiKeyService handles API key operations and rate limiting
type ApiKeyService struct {
	repo              ApiKeyRepository
	providerValidator ProviderValidator
	apiKeyPepper      string
	limiters          map[string]*rate.Limiter
	mu                sync.RWMutex
}

// NewApiKeyService creates a new API key service
func NewApiKeyService(repo ApiKeyRepository, providerValidator ProviderValidator, apiKeyPepper string) *ApiKeyService {
	return &ApiKeyService{
		repo:              repo,
		providerValidator: providerValidator,
		apiKeyPepper:      apiKeyPepper,
		limiters:          make(map[string]*rate.Limiter),
	}
}

// Create generates a new API key and stores its hash
func (s *ApiKeyService) Create(req model.ApiKeyCreateRequest) (*model.ApiKeyResponse, error) {
	// Default role to user if not specified
	role := req.Role
	if role == "" {
		role = model.ApiKeyRoleUser
	}

	// Validate provider ID for user role
	if role == model.ApiKeyRoleUser {
		if req.ProviderID == "" {
			return nil, ErrProviderRequired
		}
		if s.providerValidator != nil {
			exists, err := s.providerValidator.Exists(req.ProviderID)
			if err != nil {
				return nil, err
			}
			if !exists {
				return nil, ErrInvalidProviderKey
			}
		}
	}

	// Generate a secure random key
	rawKey, err := generateSecureKey()
	if err != nil {
		return nil, err
	}

	// Create prefix for display (first 8 chars after "wah_")
	prefix := "wah_" + rawKey[:8]

	// Hash the key for storage
	keyHash := hashKey(rawKey, s.apiKeyPepper)

	// Default rate limit to 10 req/sec if not specified
	rateLimit := req.RateLimit
	if rateLimit <= 0 {
		rateLimit = 10
	}

	now := time.Now()
	apiKey := model.ApiKey{
		ID:         uuid.New().String(),
		Prefix:     prefix,
		KeyHash:    keyHash,
		Owner:      req.Owner,
		ProviderID: req.ProviderID,
		Role:       role,
		RateLimit:  rateLimit,
		IsActive:   true,
		CreatedAt:  now,
		LastUsedAt: now,
	}

	if err := s.repo.Create(apiKey); err != nil {
		return nil, err
	}

	// Initialize rate limiter for this key
	s.initLimiter(apiKey.ID, apiKey.RateLimit)

	return &model.ApiKeyResponse{
		ID:         apiKey.ID,
		Key:        "wah_" + rawKey, // Return full key only on creation
		Prefix:     apiKey.Prefix,
		Owner:      apiKey.Owner,
		ProviderID: apiKey.ProviderID,
		Role:       apiKey.Role,
		RateLimit:  apiKey.RateLimit,
		IsActive:   apiKey.IsActive,
		CreatedAt:  apiKey.CreatedAt,
	}, nil
}

// ValidateKey checks if a raw API key is valid and returns the associated ApiKey
func (s *ApiKeyService) ValidateKey(rawKey string) (*model.ApiKey, error) {
	keyToHash := normalizeRawAPIKey(rawKey)
	if keyToHash == "" {
		return nil, ErrInvalidApiKey
	}

	primaryHash := hashKey(keyToHash, s.apiKeyPepper)
	key, err := s.repo.GetByHash(primaryHash)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidApiKey
		}
		return nil, err
	}

	if !hashMatches(keyToHash, key.KeyHash, s.apiKeyPepper) || !key.IsActive {
		return nil, ErrInvalidApiKey
	}

	go s.updateLastUsed(key.ID)
	return &key, nil
}

// CheckRateLimit checks if the request should be allowed based on rate limiting
func (s *ApiKeyService) CheckRateLimit(keyID string, rateLimit int) bool {
	s.mu.RLock()
	limiter, exists := s.limiters[keyID]
	s.mu.RUnlock()

	if !exists {
		s.initLimiter(keyID, rateLimit)
		s.mu.RLock()
		limiter = s.limiters[keyID]
		s.mu.RUnlock()
	}

	return limiter.Allow()
}

// GetAll returns all API keys (without sensitive data)
func (s *ApiKeyService) GetAll() ([]model.ApiKeyListItem, error) {
	keys, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	items := make([]model.ApiKeyListItem, len(keys))
	for i, key := range keys {
		items[i] = key.ToListItem()
	}

	return items, nil
}

// GetByID returns a specific API key by ID
func (s *ApiKeyService) GetByID(id string) (*model.ApiKeyListItem, error) {
	key, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	item := key.ToListItem()
	return &item, nil
}

// Revoke deactivates an API key
func (s *ApiKeyService) Revoke(id string) error {
	key, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	key.IsActive = false
	if err := s.repo.Update(key); err != nil {
		return err
	}

	// Remove limiter
	s.mu.Lock()
	delete(s.limiters, id)
	s.mu.Unlock()

	return nil
}

// Delete permanently removes an API key
func (s *ApiKeyService) Delete(id string) error {
	if err := s.repo.Delete(id); err != nil {
		return err
	}

	// Remove limiter
	s.mu.Lock()
	delete(s.limiters, id)
	s.mu.Unlock()

	return nil
}

// IsEmpty checks if there are no API keys (for bootstrap)
func (s *ApiKeyService) IsEmpty() (bool, error) {
	keys, err := s.repo.GetAll()
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return true, nil
		}
		return false, err
	}
	return len(keys) == 0, nil
}

// initLimiter creates a rate limiter for a key
func (s *ApiKeyService) initLimiter(keyID string, rateLimit int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if rateLimit <= 0 {
		// Unlimited: set very high limit
		s.limiters[keyID] = rate.NewLimiter(rate.Limit(1000), 1000)
	} else {
		// Allow burst equal to rate limit
		s.limiters[keyID] = rate.NewLimiter(rate.Limit(rateLimit), rateLimit)
	}
}

// updateLastUsed updates the last used timestamp
func (s *ApiKeyService) updateLastUsed(keyID string) {
	key, err := s.repo.GetByID(keyID)
	if err != nil {
		return
	}
	key.LastUsedAt = time.Now()
	s.repo.Update(key)
}

// generateSecureKey generates a cryptographically secure random key
func generateSecureKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func normalizeRawAPIKey(rawKey string) string {
	if len(rawKey) > 4 && rawKey[:4] == "wah_" {
		return rawKey[4:]
	}
	return rawKey
}

// hashKey creates a SHA256 hash of the key, optionally salted with a server-side pepper.
func hashKey(key string, pepper string) string {
	payload := key
	if pepper != "" {
		payload = pepper + ":" + key
	}
	hash := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(hash[:])
}

func hashMatches(rawKey, storedHash, pepper string) bool {
	computedHash := hashKey(rawKey, pepper)

	computedBytes, err := hex.DecodeString(computedHash)
	if err != nil {
		return false
	}

	storedBytes, err := hex.DecodeString(storedHash)
	if err != nil {
		return false
	}

	if len(computedBytes) != len(storedBytes) {
		return false
	}

	return subtle.ConstantTimeCompare(computedBytes, storedBytes) == 1
}
