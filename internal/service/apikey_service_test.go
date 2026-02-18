package service

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

type apiKeyRepoStub struct {
	mu             sync.RWMutex
	byID           map[string]model.ApiKey
	byHash         map[string]model.ApiKey
	getAllCalls    int
	getByHashCalls int
}

func newAPIKeyRepoStub() *apiKeyRepoStub {
	return &apiKeyRepoStub{
		byID:   make(map[string]model.ApiKey),
		byHash: make(map[string]model.ApiKey),
	}
}

func (r *apiKeyRepoStub) GetAll() ([]model.ApiKey, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.getAllCalls++

	result := make([]model.ApiKey, 0, len(r.byID))
	for _, key := range r.byID {
		result = append(result, key)
	}
	return result, nil
}

func (r *apiKeyRepoStub) GetByID(id string) (model.ApiKey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	key, ok := r.byID[id]
	if !ok {
		return model.ApiKey{}, repository.ErrNotFound
	}
	return key, nil
}

func (r *apiKeyRepoStub) GetByHash(keyHash string) (model.ApiKey, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.getByHashCalls++

	key, ok := r.byHash[keyHash]
	if !ok {
		return model.ApiKey{}, repository.ErrNotFound
	}
	return key, nil
}

func (r *apiKeyRepoStub) Create(key model.ApiKey) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byID[key.ID] = key
	r.byHash[key.KeyHash] = key
	return nil
}

func (r *apiKeyRepoStub) Update(key model.ApiKey) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byID[key.ID] = key
	r.byHash[key.KeyHash] = key
	return nil
}

func (r *apiKeyRepoStub) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key, ok := r.byID[id]
	if !ok {
		return repository.ErrNotFound
	}
	delete(r.byID, id)
	delete(r.byHash, key.KeyHash)
	return nil
}

func TestValidateKey_UsesHashLookupAndAvoidsGetAllScan(t *testing.T) {
	repo := newAPIKeyRepoStub()
	svc := NewApiKeyService(repo, nil, "pepper")

	raw := "aabbccddeeff"
	keyHash := hashKey(raw, "pepper")
	key := model.ApiKey{
		ID:         "key-1",
		KeyHash:    keyHash,
		IsActive:   true,
		LastUsedAt: time.Now().UTC(),
	}
	repo.byID[key.ID] = key
	repo.byHash[keyHash] = key

	found, err := svc.ValidateKey("wah_" + raw)
	if err != nil {
		t.Fatalf("expected valid key, got error: %v", err)
	}
	if found == nil || found.ID != key.ID {
		t.Fatalf("expected key ID %q, got %+v", key.ID, found)
	}
	if repo.getAllCalls != 0 {
		t.Fatalf("expected ValidateKey to avoid GetAll, got %d GetAll calls", repo.getAllCalls)
	}
	if repo.getByHashCalls == 0 {
		t.Fatal("expected ValidateKey to call GetByHash")
	}
}

func TestValidateKey_RejectsLegacyHashWhenPepperConfigured(t *testing.T) {
	repo := newAPIKeyRepoStub()
	svc := NewApiKeyService(repo, nil, "pepper")

	raw := "112233445566"
	legacyHash := hashKey(raw, "")
	key := model.ApiKey{
		ID:         "key-legacy",
		KeyHash:    legacyHash,
		IsActive:   true,
		LastUsedAt: time.Now().UTC(),
	}
	repo.byID[key.ID] = key
	repo.byHash[legacyHash] = key

	_, err := svc.ValidateKey("wah_" + raw)
	if !errors.Is(err, ErrInvalidApiKey) {
		t.Fatalf("expected ErrInvalidApiKey for legacy hash, got: %v", err)
	}
}

func TestValidateKey_RejectsInactiveKey(t *testing.T) {
	repo := newAPIKeyRepoStub()
	svc := NewApiKeyService(repo, nil, "pepper")

	raw := "deadbeef"
	keyHash := hashKey(raw, "pepper")
	key := model.ApiKey{
		ID:       "key-inactive",
		KeyHash:  keyHash,
		IsActive: false,
	}
	repo.byID[key.ID] = key
	repo.byHash[keyHash] = key

	_, err := svc.ValidateKey("wah_" + raw)
	if !errors.Is(err, ErrInvalidApiKey) {
		t.Fatalf("expected ErrInvalidApiKey, got: %v", err)
	}
}
