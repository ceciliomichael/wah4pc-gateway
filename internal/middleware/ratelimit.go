package middleware

import (
	"encoding/json"
	"net/http"
)

// RateLimitChecker defines the interface for checking rate limits
type RateLimitChecker interface {
	CheckRateLimit(keyID string, rateLimit int) bool
}

// RateLimitMiddleware handles per-key rate limiting
type RateLimitMiddleware struct {
	checker RateLimitChecker
}

// NewRateLimitMiddleware creates a new rate limiting middleware
func NewRateLimitMiddleware(checker RateLimitChecker) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		checker: checker,
	}
}

// Middleware returns the HTTP middleware handler
func (m *RateLimitMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get key ID from context (set by auth middleware)
		keyID, ok := r.Context().Value(ContextKeyKeyID).(string)
		if !ok || keyID == "" {
			// No authenticated user, skip rate limiting (auth middleware will handle)
			next.ServeHTTP(w, r)
			return
		}

		// Get rate limit from context
		rateLimit, ok := r.Context().Value(ContextKeyRateLimit).(int)
		if !ok {
			rateLimit = 10 // Default
		}

		// Check rate limit
		if !m.checker.CheckRateLimit(keyID, rateLimit) {
			m.respondTooManyRequests(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// respondTooManyRequests sends a 429 response
func (m *RateLimitMiddleware) respondTooManyRequests(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Retry-After", "1")
	w.WriteHeader(http.StatusTooManyRequests)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   "rate limit exceeded",
	})
}