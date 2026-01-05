package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

// GatewayHandler handles FHIR transfer HTTP requests
type GatewayHandler struct {
	service *service.GatewayService
}

// NewGatewayHandler creates a new gateway handler
func NewGatewayHandler(svc *service.GatewayService) *GatewayHandler {
	return &GatewayHandler{service: svc}
}

// RequestQuery handles POST /api/v1/fhir/request/{resourceType}
// This is the entry point for requesters to initiate a FHIR query
func (h *GatewayHandler) RequestQuery(w http.ResponseWriter, r *http.Request) {
	// Extract resource type from path
	resourceType := extractResourceType(r.URL.Path, "/api/v1/fhir/request/")
	if resourceType == "" {
		resourceType = "Patient" // Default
	}

	var req service.QueryRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Set resource type from path
	req.ResourceType = resourceType

	tx, err := h.service.InitiateQuery(req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidRequest) {
			respondError(w, http.StatusBadRequest, "requesterId, targetId, and at least one identifier are required")
			return
		}
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found: "+err.Error())
			return
		}
		if errors.Is(err, service.ErrTargetUnreachable) {
			respondError(w, http.StatusBadGateway, "target provider unreachable")
			return
		}
		if errors.Is(err, service.ErrDuplicateRequest) {
			respondError(w, http.StatusTooManyRequests, "duplicate request: identical request was made recently, please wait before retrying")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to initiate query: "+err.Error())
		return
	}

	respondJSON(w, http.StatusAccepted, tx)
}

// ReceiveResult handles POST /api/v1/fhir/receive/{resourceType}
// This is where target providers send data back
func (h *GatewayHandler) ReceiveResult(w http.ResponseWriter, r *http.Request) {
	var result service.IncomingResultPayload
	if err := decodeJSON(r, &result); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Extract sender provider ID from header (optional, for security validation)
	senderProviderID := r.Header.Get("X-Provider-ID")

	if err := h.service.ProcessResponse(result, senderProviderID); err != nil {
		if errors.Is(err, service.ErrTransactionNotFound) {
			respondError(w, http.StatusNotFound, "transaction not found - no matching request exists")
			return
		}
		if errors.Is(err, service.ErrInvalidStatus) {
			respondError(w, http.StatusConflict, "transaction already processed or not in pending status")
			return
		}
		if errors.Is(err, service.ErrUnauthorizedProvider) {
			respondError(w, http.StatusForbidden, "provider not authorized for this transaction")
			return
		}
		if errors.Is(err, service.ErrRequesterUnreachable) {
			respondError(w, http.StatusBadGateway, "requester unreachable")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to process result: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "result received and forwarded"})
}

// GetTransaction handles GET /api/v1/transactions/{id}
func (h *GatewayHandler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/api/v1/transactions/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "transaction id required")
		return
	}

	// Get provider filter from context (empty for admins)
	filterProviderID := getProviderFilter(r)

	tx, err := h.service.GetTransaction(id, filterProviderID)
	if err != nil {
		if errors.Is(err, service.ErrTransactionNotFound) {
			respondError(w, http.StatusNotFound, "transaction not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorizedProvider) {
			respondError(w, http.StatusForbidden, "not authorized to view this transaction")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to fetch transaction")
		return
	}

	respondJSON(w, http.StatusOK, tx)
}

// GetAllTransactions handles GET /api/v1/transactions
func (h *GatewayHandler) GetAllTransactions(w http.ResponseWriter, r *http.Request) {
	// Get provider filter from context (empty for admins)
	filterProviderID := getProviderFilter(r)

	txs, err := h.service.GetAllTransactions(filterProviderID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch transactions")
		return
	}

	respondJSON(w, http.StatusOK, txs)
}

// getProviderFilter returns the provider ID filter based on role
// Admins get empty string (no filter), users get their provider ID
func getProviderFilter(r *http.Request) string {
	role := middleware.GetRoleFromContext(r.Context())
	if role == model.ApiKeyRoleAdmin {
		return "" // Admin sees all
	}
	return middleware.GetProviderIDFromContext(r.Context())
}

// extractResourceType extracts the resource type from path
func extractResourceType(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	resourceType := strings.TrimPrefix(path, prefix)
	resourceType = strings.TrimSuffix(resourceType, "/")
	return resourceType
}
