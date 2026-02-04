package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// ApiKeyValidator defines the interface for validating API keys
type ApiKeyValidator interface {
	ValidateKey(rawKey string) (*model.ApiKey, error)
	IsEmpty() (bool, error)
}

// AuthMiddleware handles API key authentication
type AuthMiddleware struct {
	validator     ApiKeyValidator
	masterKey     string
	publicPaths   map[string][]string // path -> allowed methods (empty slice or "*" means all methods)
	bootstrapPath string
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(validator ApiKeyValidator, masterKey string) *AuthMiddleware {
	return &AuthMiddleware{
		validator: validator,
		masterKey: masterKey,
		publicPaths: map[string][]string{
			"/health":           {"*"},   // All methods allowed
			"/providers":        {"GET"}, // Public providers listing page
			"/api/v1/providers": {"GET"}, // Only GET allowed without auth
		},
		bootstrapPath: "/api/v1/apikeys",
	}
}

// Middleware returns the HTTP middleware handler
func (m *AuthMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow public paths without authentication
		if m.isPublicPath(r.Method, r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		// Check for master key authentication (bypasses all other auth)
		if m.checkMasterKey(r) {
			ctx := m.setMasterKeyContext(r.Context())
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Check for bootstrap mode (first API key creation)
		if m.isBootstrapRequest(r) {
			isEmpty, err := m.validator.IsEmpty()
			if err == nil && isEmpty {
				// Allow first key creation without auth
				next.ServeHTTP(w, r)
				return
			}
		}

		// Extract API key from header
		apiKey := m.extractApiKey(r)
		if apiKey == "" {
			m.respondUnauthorized(w, "missing API key")
			return
		}

		// Validate the API key
		key, err := m.validator.ValidateKey(apiKey)
		if err != nil {
			m.respondUnauthorized(w, "invalid or inactive API key")
			return
		}

		// Add key info to context
		ctx := context.WithValue(r.Context(), ContextKeyApiKey, key)
		ctx = context.WithValue(ctx, ContextKeyKeyID, key.ID)
		ctx = context.WithValue(ctx, ContextKeyRole, key.Role)
		ctx = context.WithValue(ctx, ContextKeyRateLimit, key.RateLimit)
		ctx = context.WithValue(ctx, ContextKeyProviderID, key.ProviderID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// checkMasterKey validates the X-Master-Key header against the configured master key
func (m *AuthMiddleware) checkMasterKey(r *http.Request) bool {
	if m.masterKey == "" {
		return false // Master key not configured
	}
	providedKey := r.Header.Get("X-Master-Key")
	return providedKey != "" && providedKey == m.masterKey
}

// setMasterKeyContext sets the context for master key authenticated requests
func (m *AuthMiddleware) setMasterKeyContext(ctx context.Context) context.Context {
	// Create a synthetic master key identity
	masterApiKey := &model.ApiKey{
		ID:       "master-key",
		Prefix:   "master",
		Owner:    "System Master Key",
		Role:     model.ApiKeyRoleAdmin,
		IsActive: true,
	}
	ctx = context.WithValue(ctx, ContextKeyApiKey, masterApiKey)
	ctx = context.WithValue(ctx, ContextKeyKeyID, "master-key")
	ctx = context.WithValue(ctx, ContextKeyRole, model.ApiKeyRoleAdmin)
	ctx = context.WithValue(ctx, ContextKeyRateLimit, 0)   // No rate limit for master key
	ctx = context.WithValue(ctx, ContextKeyProviderID, "") // Admin has no provider restriction
	return ctx
}

// isPublicPath checks if the method and path should be accessible without authentication
func (m *AuthMiddleware) isPublicPath(method, path string) bool {
	allowedMethods, exists := m.publicPaths[path]
	if !exists {
		return false
	}

	// Check if any method is allowed ("*") or if the specific method is allowed
	for _, allowedMethod := range allowedMethods {
		if allowedMethod == "*" || allowedMethod == method {
			return true
		}
	}
	return false
}

// isBootstrapRequest checks if this is a request to create the first API key
func (m *AuthMiddleware) isBootstrapRequest(r *http.Request) bool {
	return r.Method == http.MethodPost && r.URL.Path == m.bootstrapPath
}

// extractApiKey extracts the API key from request headers
func (m *AuthMiddleware) extractApiKey(r *http.Request) string {
	// Check X-API-Key header first
	if key := r.Header.Get("X-API-Key"); key != "" {
		return key
	}

	// Check Authorization header (Bearer token)
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	return ""
}

// respondUnauthorized sends a 401 response
func (m *AuthMiddleware) respondUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   message,
	})
}

// RequireRole returns a middleware that checks for a specific role
func RequireRole(requiredRole model.ApiKeyRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(ContextKeyRole).(model.ApiKeyRole)
			if !ok {
				respondForbidden(w, "no role in context")
				return
			}

			// Admin can do everything
			if role == model.ApiKeyRoleAdmin {
				next.ServeHTTP(w, r)
				return
			}

			// Check if user has required role
			if role != requiredRole {
				respondForbidden(w, "insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// respondForbidden sends a 403 response
func respondForbidden(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   message,
	})
}

// GetKeyFromContext retrieves the API key from the request context
func GetKeyFromContext(ctx context.Context) *model.ApiKey {
	key, ok := ctx.Value(ContextKeyApiKey).(*model.ApiKey)
	if !ok {
		return nil
	}
	return key
}

// GetRoleFromContext retrieves the role from the request context
func GetRoleFromContext(ctx context.Context) model.ApiKeyRole {
	role, ok := ctx.Value(ContextKeyRole).(model.ApiKeyRole)
	if !ok {
		return ""
	}
	return role
}

// GetProviderIDFromContext retrieves the provider ID from the request context
func GetProviderIDFromContext(ctx context.Context) string {
	providerID, ok := ctx.Value(ContextKeyProviderID).(string)
	if !ok {
		return ""
	}
	return providerID
}
