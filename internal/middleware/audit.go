package middleware

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
)

// AuditMiddleware logs all HTTP requests to the file-based audit log with full details
type AuditMiddleware struct {
	logger *logger.FileLogger
}

// NewAuditMiddleware creates a new AuditMiddleware instance
func NewAuditMiddleware(l *logger.FileLogger) *AuditMiddleware {
	return &AuditMiddleware{
		logger: l,
	}
}

// Middleware returns the HTTP middleware handler
func (m *AuditMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		// Skip logging for excluded paths
		if m.shouldSkipLogging(req) {
			next.ServeHTTP(w, req)
			return
		}

		start := time.Now()

		// Generate unique request ID
		requestID := uuid.New().String()

		// Capture request body
		var requestBody []byte
		if req.Body != nil {
			requestBody, _ = io.ReadAll(req.Body)
			// Restore the body so handlers can read it
			req.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Clone request headers (to capture before any modification)
		requestHeaders := cloneHeaders(req.Header)

		// Wrap the response writer to capture status code, headers, and body
		wrapper := NewResponseWriterWrapper(w, logger.MaxBodySize)

		// Process the request
		next.ServeHTTP(wrapper, req)

		// Calculate duration
		duration := time.Since(start)

		// Extract client IP
		clientIP := m.getClientIP(req)

		// Extract user agent
		userAgent := req.UserAgent()
		if userAgent == "" {
			userAgent = "-"
		}

		// Get authentication context from request context
		keyID := getContextString(req, ContextKeyKeyID)
		role := getContextString(req, ContextKeyRole)
		providerID := getContextString(req, ContextKeyProviderID)

		// Process request body for logging
		reqBodyStr, reqBodySize, _ := logger.TruncateBody(requestBody)

		// Build full URL
		fullURL := req.URL.String()
		if req.URL.RawQuery != "" {
			fullURL = req.URL.Path + "?" + req.URL.RawQuery
		} else {
			fullURL = req.URL.Path
		}

		// Construct detailed log entry
		entry := logger.DetailedLogEntry{
			ID:        requestID,
			Timestamp: start,
			Duration:  duration,

			Method:     req.Method,
			URL:        fullURL,
			Host:       req.Host,
			RemoteAddr: clientIP,
			UserAgent:  userAgent,

			RequestHeaders:  requestHeaders,
			RequestBody:     reqBodyStr,
			RequestBodySize: reqBodySize,

			StatusCode:       wrapper.StatusCode(),
			ResponseHeaders:  cloneHeaders(wrapper.Header()),
			ResponseBody:     wrapper.GetBody(),
			ResponseBodySize: wrapper.GetBodySize(),

			KeyID:      keyID,
			Role:       role,
			ProviderID: providerID,
		}

		// Send to async logger
		m.logger.Log(entry)
	})
}

// shouldSkipLogging determines if a request should be excluded from audit logs
func (m *AuditMiddleware) shouldSkipLogging(req *http.Request) bool {
	path := req.URL.Path

	// Exclude OPTIONS requests (CORS preflight)
	if req.Method == http.MethodOptions {
		return true
	}

	// Exclude health checks - high volume, low value
	if path == "/health" {
		return true
	}

	// Exclude robots.txt (crawler noise)
	if path == "/robots.txt" {
		return true
	}

	// Exclude log management endpoints to prevent "observer effect" (reading logs creating logs)
	if strings.HasPrefix(path, "/api/v1/logs") {
		return true
	}

	// Exclude selected operational endpoints from audit logging
	if path == "/providers" ||
		path == "/api/v1/providers" ||
		strings.HasPrefix(path, "/api/v1/providers/") ||
		path == "/settings" ||
		path == "/api/v1/settings" ||
		path == "/api/v1/transactions" ||
		strings.HasPrefix(path, "/api/v1/transactions/") {
		return true
	}

	// Exclude static assets if served via this middleware
	if strings.HasPrefix(path, "/static/") || path == "/favicon.ico" {
		return true
	}
	return false
}

// getClientIP extracts the client IP from the request
func (m *AuditMiddleware) getClientIP(req *http.Request) string {
	// Check X-Forwarded-For header first (for proxied requests)
	forwarded := req.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// Take the first IP in the list
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}

	// Check X-Real-IP header
	realIP := req.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	// RemoteAddr is in format "IP:port", extract just the IP
	addr := req.RemoteAddr
	if colonIdx := strings.LastIndex(addr, ":"); colonIdx != -1 {
		return addr[:colonIdx]
	}
	return addr
}

// cloneHeaders creates a copy of the headers
func cloneHeaders(h http.Header) http.Header {
	clone := make(http.Header)
	for key, values := range h {
		clone[key] = append([]string{}, values...)
	}
	return clone
}

// getContextString safely extracts a string value from request context
func getContextString(req *http.Request, key ContextKey) string {
	if val, ok := req.Context().Value(key).(string); ok {
		return val
	}
	return ""
}
