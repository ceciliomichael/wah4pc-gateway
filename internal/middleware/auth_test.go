package middleware

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

type apiKeyValidatorStub struct {
	key     *model.ApiKey
	err     error
	isEmpty bool
}

func (s *apiKeyValidatorStub) ValidateKey(rawKey string) (*model.ApiKey, error) {
	if s.err != nil {
		return nil, s.err
	}
	return s.key, nil
}

func (s *apiKeyValidatorStub) IsEmpty() (bool, error) {
	return s.isEmpty, nil
}

func TestAuthMiddleware_PublicPathWithoutCredentialsAllowed(t *testing.T) {
	mw := NewAuthMiddleware(&apiKeyValidatorStub{}, "")
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	rr := httptest.NewRecorder()
	mw.Middleware(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
}

func TestAuthMiddleware_PublicPathWithValidAPIKeySetsContext(t *testing.T) {
	mw := NewAuthMiddleware(&apiKeyValidatorStub{
		key: &model.ApiKey{
			ID:         "key-1",
			Role:       model.ApiKeyRoleUser,
			ProviderID: "provider-1",
			RateLimit:  10,
			IsActive:   true,
		},
	}, "")

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		payload := map[string]string{
			"source": GetAuthSourceFromContext(r.Context()),
			"role":   string(GetRoleFromContext(r.Context())),
		}
		_ = json.NewEncoder(w).Encode(payload)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	req.Header.Set("X-API-Key", "wah_valid")
	rr := httptest.NewRecorder()
	mw.Middleware(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}
	if body["source"] != "api_key" {
		t.Fatalf("expected auth source api_key, got %q", body["source"])
	}
	if body["role"] != string(model.ApiKeyRoleUser) {
		t.Fatalf("expected role user, got %q", body["role"])
	}
}

func TestAuthMiddleware_PublicPathWithInvalidAPIKeyRejected(t *testing.T) {
	mw := NewAuthMiddleware(&apiKeyValidatorStub{
		err: errors.New("invalid"),
	}, "")
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/providers", nil)
	req.Header.Set("X-API-Key", "wah_invalid")
	rr := httptest.NewRecorder()
	mw.Middleware(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
