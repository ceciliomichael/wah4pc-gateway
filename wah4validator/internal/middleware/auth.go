package middleware

import (
	"net/http"
	"strings"

	"wah4pc/internal/service"
)

type AuthMiddleware struct {
	authService service.AuthService
}

func NewAuthMiddleware(authService service.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

func (m *AuthMiddleware) RequireApiKey(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract API Key from Header
		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			// Also check Bearer token as fallback
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				apiKey = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if apiKey == "" {
			http.Error(w, "Unauthorized: Missing API Key", http.StatusUnauthorized)
			return
		}

		// 2. Validate Key
		valid, _ := m.authService.ValidateKey(apiKey)
		if !valid {
			http.Error(w, "Unauthorized: Invalid API Key", http.StatusUnauthorized)
			return
		}

		// 3. Rate Limiting
		if !m.authService.Allow(apiKey) {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}

		// 4. Proceed
		next.ServeHTTP(w, r)
	})
}