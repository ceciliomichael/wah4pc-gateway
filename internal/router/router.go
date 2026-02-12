package router

import (
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/handler"
	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
)

// Router is the HTTP router for the gateway
type Router struct {
	mux                   *http.ServeMux
	providerHandler       *handler.ProviderHandler
	gatewayHandler        *handler.GatewayHandler
	apiKeyHandler         *handler.ApiKeyHandler
	logHandler            *handler.LogHandler
	settingsHandler       *handler.SettingsHandler
	webHandler            *handler.WebHandler
	authMiddleware        *middleware.AuthMiddleware
	rateLimitMiddleware   *middleware.RateLimitMiddleware
	auditMiddleware       *middleware.AuditMiddleware
	idempotencyMiddleware *middleware.IdempotencyMiddleware
}

// NewRouter creates a new router with all handlers
func NewRouter(
	providerHandler *handler.ProviderHandler,
	gatewayHandler *handler.GatewayHandler,
	apiKeyHandler *handler.ApiKeyHandler,
	logHandler *handler.LogHandler,
	settingsHandler *handler.SettingsHandler,
	apiKeyService *service.ApiKeyService,
	masterKey string,
	auditLogger *logger.FileLogger,
) *Router {
	// Create middleware instances
	authMW := middleware.NewAuthMiddleware(apiKeyService, masterKey)
	rateLimitMW := middleware.NewRateLimitMiddleware(apiKeyService)
	auditMW := middleware.NewAuditMiddleware(auditLogger)
	idempotencyMW := middleware.NewIdempotencyMiddleware()

	// Create web handler for static content
	webHandler := handler.NewWebHandler()

	r := &Router{
		mux:                   http.NewServeMux(),
		providerHandler:       providerHandler,
		gatewayHandler:        gatewayHandler,
		apiKeyHandler:         apiKeyHandler,
		logHandler:            logHandler,
		settingsHandler:       settingsHandler,
		webHandler:            webHandler,
		authMiddleware:        authMW,
		rateLimitMiddleware:   rateLimitMW,
		auditMiddleware:       auditMW,
		idempotencyMiddleware: idempotencyMW,
	}

	r.registerRoutes()
	return r
}

// registerRoutes sets up all API routes
func (r *Router) registerRoutes() {
	// Health check (public - no auth required)
	r.mux.HandleFunc("/health", r.healthCheck)

	// Public web pages
	r.mux.HandleFunc("/providers", r.webHandler.ServeProviders)

	// API Key routes
	r.mux.HandleFunc("/api/v1/apikeys", r.handleApiKeys)
	r.mux.HandleFunc("/api/v1/apikeys/", r.handleApiKeyByID)

	// Provider routes
	r.mux.HandleFunc("/api/v1/providers", r.handleProviders)
	r.mux.HandleFunc("/api/v1/providers/", r.handleProviderByID)

	// FHIR Gateway routes
	r.mux.HandleFunc("/api/v1/fhir/request/", r.handleFHIRRequest)
	r.mux.HandleFunc("/api/v1/fhir/push/", r.handleFHIRPush)
	r.mux.HandleFunc("/api/v1/fhir/receive/", r.handleFHIRReceive)

	// Transaction routes
	r.mux.HandleFunc("/api/v1/transactions", r.handleTransactions)
	r.mux.HandleFunc("/api/v1/transactions/", r.handleTransactionByID)

	// Log routes
	r.mux.HandleFunc("/api/v1/logs/dates", r.handleLogDates)
	r.mux.HandleFunc("/api/v1/logs/", r.handleLogs)

	// Settings routes
	r.mux.HandleFunc("/api/v1/settings", r.handleSettings)
}

// Handler returns the HTTP handler with middleware chain
// Order: Audit -> CORS -> Auth -> RateLimit -> Idempotency -> Handler
func (r *Router) Handler() http.Handler {
	return r.auditMiddleware.Middleware(
		r.corsMiddleware(
			r.authMiddleware.Middleware(
				r.rateLimitMiddleware.Middleware(
					r.idempotencyMiddleware.Middleware(r.mux),
				),
			),
		),
	)
}

// healthCheck returns a simple health status
func (r *Router) healthCheck(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"healthy","service":"wah4pc-gateway"}`))
}

// handleApiKeys routes /api/v1/apikeys
func (r *Router) handleApiKeys(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		r.apiKeyHandler.GetAll(w, req)
	case http.MethodPost:
		r.apiKeyHandler.Create(w, req)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleApiKeyByID routes /api/v1/apikeys/{id} and /api/v1/apikeys/{id}/revoke
func (r *Router) handleApiKeyByID(w http.ResponseWriter, req *http.Request) {
	// Check if this is a revoke request
	if strings.HasSuffix(req.URL.Path, "/revoke") {
		if req.Method == http.MethodPost {
			r.apiKeyHandler.Revoke(w, req)
			return
		}
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	switch req.Method {
	case http.MethodGet:
		r.apiKeyHandler.GetByID(w, req)
	case http.MethodDelete:
		r.apiKeyHandler.Delete(w, req)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleProviders routes /api/v1/providers
func (r *Router) handleProviders(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		r.providerHandler.GetAll(w, req)
	case http.MethodPost:
		r.providerHandler.Register(w, req)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleProviderByID routes /api/v1/providers/{id} and /api/v1/providers/{id}/status
func (r *Router) handleProviderByID(w http.ResponseWriter, req *http.Request) {
	// Check if this is a status update request
	if strings.HasSuffix(req.URL.Path, "/status") {
		if req.Method == http.MethodPost {
			r.providerHandler.SetActive(w, req)
			return
		}
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	switch req.Method {
	case http.MethodGet:
		r.providerHandler.GetByID(w, req)
	case http.MethodPut:
		r.providerHandler.Update(w, req)
	case http.MethodDelete:
		r.providerHandler.Delete(w, req)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleFHIRRequest routes /api/v1/fhir/request/{resourceType}
func (r *Router) handleFHIRRequest(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.gatewayHandler.RequestQuery(w, req)
}

// handleFHIRPush routes /api/v1/fhir/push/{resourceType}
func (r *Router) handleFHIRPush(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.gatewayHandler.RequestPush(w, req)
}

// handleFHIRReceive routes /api/v1/fhir/receive/{resourceType}
func (r *Router) handleFHIRReceive(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.gatewayHandler.ReceiveResult(w, req)
}

// handleTransactions routes /api/v1/transactions
func (r *Router) handleTransactions(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.gatewayHandler.GetAllTransactions(w, req)
}

// handleTransactionByID routes /api/v1/transactions/{id}
func (r *Router) handleTransactionByID(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.gatewayHandler.GetTransaction(w, req)
}

// handleSettings routes /api/v1/settings
func (r *Router) handleSettings(w http.ResponseWriter, req *http.Request) {
	// Verify admin role
	if middleware.GetRoleFromContext(req.Context()) != "admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	switch req.Method {
	case http.MethodGet:
		r.settingsHandler.Get(w, req)
	case http.MethodPut:
		r.settingsHandler.Update(w, req)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleLogDates routes /api/v1/logs/dates
func (r *Router) handleLogDates(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Verify admin role (logs contain sensitive info)
	if middleware.GetRoleFromContext(req.Context()) != "admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	r.logHandler.GetDates(w, req)
}

// handleLogs routes /api/v1/logs/{date} and /api/v1/logs/{date}/{id}
func (r *Router) handleLogs(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Verify admin role
	if middleware.GetRoleFromContext(req.Context()) != "admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	parts := strings.Split(req.URL.Path, "/")
	// Expected: /api/v1/logs/{date} (len 5) or /api/v1/logs/{date}/{id} (len 6)
	
	if len(parts) == 5 {
		r.logHandler.GetLogs(w, req)
	} else if len(parts) == 6 {
		r.logHandler.GetLogDetail(w, req)
	} else {
		http.NotFound(w, req)
	}
}

// corsMiddleware adds CORS headers for development
func (r *Router) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Provider-ID, Idempotency-Key")
		w.Header().Set("Access-Control-Expose-Headers", "Idempotency-Replayed, Idempotency-Original-Date")

		if req.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, req)
	})
}
