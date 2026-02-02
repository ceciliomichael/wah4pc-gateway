package service

import (
	"encoding/json"
	"errors"
	"math/rand"
	"os"
	"path/filepath"
	"sync"
	"time"

	"wah4pc/internal/config"
	"wah4pc/pkg/logger"

	"golang.org/x/time/rate"
)

type ApiKey struct {
	Key       string    `json:"key"`
	CreatedAt time.Time `json:"created_at"`
	Name      string    `json:"name,omitempty"` // Optional: name/owner of the key
}

type AuthService interface {
	ValidateKey(key string) (bool, *ApiKey)
	CreateKey(name string) (*ApiKey, error)
	DeleteKey(key string) error
	Allow(key string) bool
	ListKeys() ([]ApiKey, error)
}

type AuthServiceImpl struct {
	keys     map[string]*ApiKey
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	dataPath string
	config   *config.Config
	logger   *logger.Logger
}

func NewAuthService(cfg *config.Config, log *logger.Logger) *AuthServiceImpl {
	svc := &AuthServiceImpl{
		keys:     make(map[string]*ApiKey),
		limiters: make(map[string]*rate.Limiter),
		dataPath: filepath.Join("data", "data.json"),
		config:   cfg,
		logger:   log,
	}

	// Ensure data directory exists
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Errorf("Failed to create data directory: %v", err)
	}

	svc.loadKeys()
	svc.ensureDevApiKey()
	return svc
}

// ensureDevApiKey registers the dev API key from config if not already present
func (s *AuthServiceImpl) ensureDevApiKey() {
	devKey := s.config.Security.DevApiKey
	if devKey == "" {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if dev key already exists
	if _, exists := s.keys[devKey]; exists {
		s.logger.Info("Dev API key already registered")
		return
	}

	// Register the dev key
	newKey := &ApiKey{
		Key:       devKey,
		CreatedAt: time.Now(),
		Name:      "Development Frontend Key",
	}

	s.keys[devKey] = newKey
	s.limiters[devKey] = rate.NewLimiter(rate.Limit(s.config.Security.RateLimit.RequestsPerSecond), s.config.Security.RateLimit.Burst)

	if err := s.saveKeys(); err != nil {
		s.logger.Errorf("Failed to save dev API key: %v", err)
		return
	}

	s.logger.Success("Dev API key registered successfully")
}

func (s *AuthServiceImpl) loadKeys() {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.dataPath)
	if err != nil {
		if !os.IsNotExist(err) {
			s.logger.Errorf("Failed to read api keys: %v", err)
		}
		return
	}

	var savedKeys []ApiKey
	if err := json.Unmarshal(data, &savedKeys); err != nil {
		s.logger.Errorf("Failed to parse api keys: %v", err)
		return
	}

	for _, k := range savedKeys {
		// Create a copy of the loop variable
		key := k
		s.keys[key.Key] = &key
		// Initialize limiter for existing keys
		s.limiters[key.Key] = rate.NewLimiter(rate.Limit(s.config.Security.RateLimit.RequestsPerSecond), s.config.Security.RateLimit.Burst)
	}
	s.logger.Infof("Loaded %d API keys", len(s.keys))
}

func (s *AuthServiceImpl) saveKeys() error {
	var keysList []ApiKey
	for _, k := range s.keys {
		keysList = append(keysList, *k)
	}

	data, err := json.MarshalIndent(keysList, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.dataPath, data, 0644)
}

func (s *AuthServiceImpl) ValidateKey(key string) (bool, *ApiKey) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	apiKey, exists := s.keys[key]
	return exists, apiKey
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

func generateRandomKey(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func (s *AuthServiceImpl) CreateKey(name string) (*ApiKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Generate a simple random key
	key := generateRandomKey(32)

	newKey := &ApiKey{
		Key:       key,
		CreatedAt: time.Now(),
		Name:      name,
	}

	s.keys[key] = newKey
	s.limiters[key] = rate.NewLimiter(rate.Limit(s.config.Security.RateLimit.RequestsPerSecond), s.config.Security.RateLimit.Burst)

	if err := s.saveKeys(); err != nil {
		delete(s.keys, key)
		delete(s.limiters, key)
		return nil, err
	}

	return newKey, nil
}

func (s *AuthServiceImpl) DeleteKey(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.keys[key]; !exists {
		return errors.New("key not found")
	}

	delete(s.keys, key)
	delete(s.limiters, key)

	return s.saveKeys()
}

func (s *AuthServiceImpl) ListKeys() ([]ApiKey, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []ApiKey
	for _, k := range s.keys {
		list = append(list, *k)
	}
	return list, nil
}

func (s *AuthServiceImpl) Allow(key string) bool {
	s.mu.RLock()
	limiter, exists := s.limiters[key]
	s.mu.RUnlock()

	if !exists {
		return false
	}
	return limiter.Allow()
}
