package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"time"
)

// IdempotencyStatus represents the state of an idempotent request
type IdempotencyStatus string

const (
	// StatusProcessing indicates the request is currently being processed
	StatusProcessing IdempotencyStatus = "PROCESSING"
	// StatusCompleted indicates the request has completed
	StatusCompleted IdempotencyStatus = "COMPLETED"
)

const (
	// IdempotencyKeyHeader is the header name for idempotency key
	IdempotencyKeyHeader = "Idempotency-Key"
	// DefaultIdempotencyTTL is the default time-to-live for cached responses
	DefaultIdempotencyTTL = 24 * time.Hour
	// DefaultMaxResponseSize is the maximum response body size to cache (1MB)
	DefaultMaxResponseSize = 1024 * 1024
	// CleanupInterval is how often to run the cleanup routine
	CleanupInterval = 1 * time.Hour
)

// IdempotencyRecord stores the cached response for an idempotent request
type IdempotencyRecord struct {
	Status      IdempotencyStatus
	StatusCode  int
	Headers     http.Header
	Body        []byte
	CreatedAt   time.Time
	CompletedAt time.Time
}

// IdempotencyMiddleware handles duplicate request detection using idempotency keys
// Strategy: First-In Wins - the first request with a given key is processed,
// subsequent requests with the same key receive the cached response or a conflict error
type IdempotencyMiddleware struct {
	store      sync.Map // map[string]*IdempotencyRecord
	ttl        time.Duration
	maxBodySize int
	stopCh     chan struct{}
}

// NewIdempotencyMiddleware creates a new idempotency middleware with default settings
func NewIdempotencyMiddleware() *IdempotencyMiddleware {
	m := &IdempotencyMiddleware{
		ttl:        DefaultIdempotencyTTL,
		maxBodySize: DefaultMaxResponseSize,
		stopCh:     make(chan struct{}),
	}

	// Start background cleanup routine
	go m.cleanupLoop()

	return m
}

// NewIdempotencyMiddlewareWithConfig creates a new idempotency middleware with custom settings
func NewIdempotencyMiddlewareWithConfig(ttl time.Duration, maxBodySize int) *IdempotencyMiddleware {
	m := &IdempotencyMiddleware{
		ttl:        ttl,
		maxBodySize: maxBodySize,
		stopCh:     make(chan struct{}),
	}

	// Start background cleanup routine
	go m.cleanupLoop()

	return m
}

// Stop gracefully stops the cleanup routine
func (m *IdempotencyMiddleware) Stop() {
	close(m.stopCh)
}

// cleanupLoop periodically removes expired entries from the store
func (m *IdempotencyMiddleware) cleanupLoop() {
	ticker := time.NewTicker(CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			m.cleanup()
		case <-m.stopCh:
			return
		}
	}
}

// cleanup removes expired entries
func (m *IdempotencyMiddleware) cleanup() {
	now := time.Now()
	m.store.Range(func(key, value interface{}) bool {
		record := value.(*IdempotencyRecord)
		if now.Sub(record.CreatedAt) > m.ttl {
			m.store.Delete(key)
		}
		return true
	})
}

// Middleware returns the HTTP middleware handler
func (m *IdempotencyMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only apply idempotency to mutating methods (POST, PUT, PATCH)
		if !isMutatingMethod(r.Method) {
			next.ServeHTTP(w, r)
			return
		}

		// Get idempotency key from header
		idempotencyKey := r.Header.Get(IdempotencyKeyHeader)
		if idempotencyKey == "" {
			// No idempotency key provided, process normally
			next.ServeHTTP(w, r)
			return
		}

		// Try to acquire the key (first-in wins)
		newRecord := &IdempotencyRecord{
			Status:    StatusProcessing,
			CreatedAt: time.Now(),
		}

		// LoadOrStore returns the existing value if present, or stores and returns the new value
		existingValue, loaded := m.store.LoadOrStore(idempotencyKey, newRecord)

		if loaded {
			// Key already exists - handle duplicate request
			existingRecord := existingValue.(*IdempotencyRecord)
			m.handleDuplicateRequest(w, existingRecord)
			return
		}

		// First request with this key - process it
		// Capture request body for potential replay logging
		var requestBody []byte
		if r.Body != nil {
			requestBody, _ = io.ReadAll(r.Body)
			r.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Wrap response writer to capture the response
		wrapper := NewResponseWriterWrapper(w, m.maxBodySize)

		// Process the request
		next.ServeHTTP(wrapper, r)

		// Store the completed response
		m.completeRecord(idempotencyKey, wrapper)
	})
}

// handleDuplicateRequest handles a request that has a duplicate idempotency key
func (m *IdempotencyMiddleware) handleDuplicateRequest(w http.ResponseWriter, record *IdempotencyRecord) {
	switch record.Status {
	case StatusProcessing:
		// Request is still being processed - return 409 Conflict
		m.respondConflict(w, "A request with this idempotency key is currently being processed")
		return

	case StatusCompleted:
		// Return the cached response
		m.replayResponse(w, record)
		return

	default:
		// Unknown status - return error
		m.respondConflict(w, "Invalid idempotency record state")
		return
	}
}

// completeRecord updates the record with the completed response
func (m *IdempotencyMiddleware) completeRecord(key string, wrapper *ResponseWriterWrapper) {
	record := &IdempotencyRecord{
		Status:      StatusCompleted,
		StatusCode:  wrapper.StatusCode(),
		Headers:     cloneHeaders(wrapper.Header()),
		Body:        wrapper.GetBodyBytes(),
		CreatedAt:   time.Now(),
		CompletedAt: time.Now(),
	}

	m.store.Store(key, record)
}

// replayResponse sends the cached response back to the client
func (m *IdempotencyMiddleware) replayResponse(w http.ResponseWriter, record *IdempotencyRecord) {
	// Add header to indicate this is a replayed response
	w.Header().Set("Idempotency-Replayed", "true")
	w.Header().Set("Idempotency-Original-Date", record.CompletedAt.Format(time.RFC3339))

	// Copy original response headers
	for key, values := range record.Headers {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Write status code and body
	w.WriteHeader(record.StatusCode)
	w.Write(record.Body)
}

// respondConflict sends a 409 Conflict response
func (m *IdempotencyMiddleware) respondConflict(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusConflict)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   "duplicate_request",
		"message": message,
	})
}

// isMutatingMethod returns true if the HTTP method can mutate state
func isMutatingMethod(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

// GetCacheStats returns statistics about the idempotency cache
func (m *IdempotencyMiddleware) GetCacheStats() map[string]int {
	var processing, completed, total int

	m.store.Range(func(_, value interface{}) bool {
		total++
		record := value.(*IdempotencyRecord)
		switch record.Status {
		case StatusProcessing:
			processing++
		case StatusCompleted:
			completed++
		}
		return true
	})

	return map[string]int{
		"total":      total,
		"processing": processing,
		"completed":  completed,
	}
}