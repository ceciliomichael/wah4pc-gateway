package handler

import (
	"encoding/json"
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
	resourceType, err := service.ParseAndValidateResourceType(r.URL.Path, "/api/v1/fhir/request/")
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid resource type in URL path")
		return
	}

	var payload service.QueryRequestPayload
	if err := decodeJSON(r, &payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if payload.ResourceType != "" && payload.ResourceType != resourceType {
		respondError(w, http.StatusBadRequest, "resourceType in body must match URL path")
		return
	}

	req, err := payload.ToQueryRequest(resourceType)
	if err != nil {
		if errors.Is(err, service.ErrInvalidRequest) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := h.service.InitiateQuery(req)
	if err != nil {
		var upstreamErr *service.UpstreamHTTPError
		if errors.As(err, &upstreamErr) && upstreamErr.Upstream == "target provider" {
			respondError(w, http.StatusBadGateway, upstreamErr.Summary())
			return
		}
		var upstreamForwardErr *service.UpstreamForwardingError
		if errors.As(err, &upstreamForwardErr) && upstreamForwardErr.Upstream == "target provider" {
			respondError(w, http.StatusBadGateway, upstreamForwardErr.Summary())
			return
		}
		if errors.Is(err, service.ErrInvalidRequest) {
			respondError(w, http.StatusBadRequest, err.Error())
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

// RequestPush handles POST /api/v1/fhir/push/{resourceType}
// This allows providers to push data to another provider without a request
func (h *GatewayHandler) RequestPush(w http.ResponseWriter, r *http.Request) {
	resourceType, err := service.ParseAndValidateResourceType(r.URL.Path, "/api/v1/fhir/push/")
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid resource type in URL path")
		return
	}

	var req service.PushRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resourceBodyType, err := extractResourceType(req.Resource)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if resourceBodyType != resourceType {
		respondError(w, http.StatusBadRequest, "resource.resourceType in body must match URL path")
		return
	}

	// Set resource type from path
	req.ResourceType = resourceType

	tx, err := h.service.InitiatePush(req)
	if err != nil {
		var upstreamErr *service.UpstreamHTTPError
		if errors.As(err, &upstreamErr) && upstreamErr.Upstream == "target provider" {
			respondError(w, http.StatusBadGateway, upstreamErr.Summary())
			return
		}
		var upstreamForwardErr *service.UpstreamForwardingError
		if errors.As(err, &upstreamForwardErr) && upstreamForwardErr.Upstream == "target provider" {
			respondError(w, http.StatusBadGateway, upstreamForwardErr.Summary())
			return
		}
		if errors.Is(err, service.ErrInvalidRequest) {
			// Pass through the actual validation error message
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrTargetUnreachable) {
			respondError(w, http.StatusBadGateway, "target provider unreachable")
			return
		}
		if errors.Is(err, service.ErrSchemaValidation) {
			respondError(w, http.StatusUnprocessableEntity, "FHIR schema validation failed: "+err.Error())
			return
		}
		// Check for provider not found error which wraps the underlying error
		if strings.Contains(err.Error(), "provider not found") {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "failed to push resource: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, tx)
}

func extractResourceType(resource json.RawMessage) (string, error) {
	if len(resource) == 0 {
		return "", errors.New("resource is required")
	}

	var payload struct {
		ResourceType string `json:"resourceType"`
	}
	if err := json.Unmarshal(resource, &payload); err != nil {
		return "", errors.New("resource must be a valid FHIR JSON object")
	}
	if strings.TrimSpace(payload.ResourceType) == "" {
		return "", errors.New("resource.resourceType is required")
	}

	return strings.TrimSpace(payload.ResourceType), nil
}

// ReceiveResult handles POST /api/v1/fhir/receive/{resourceType}
// This is where target providers send data back
func (h *GatewayHandler) ReceiveResult(w http.ResponseWriter, r *http.Request) {
	resourceType, err := service.ParseAndValidateResourceType(r.URL.Path, "/api/v1/fhir/receive/")
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid resource type in URL path")
		return
	}

	var result service.IncomingResultPayload
	if err := decodeJSON(r, &result); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Extract sender provider ID from header (optional, for security validation)
	senderProviderID := r.Header.Get("X-Provider-ID")

	if err := h.service.ProcessResponse(result, senderProviderID, resourceType); err != nil {
		var upstreamErr *service.UpstreamHTTPError
		if errors.As(err, &upstreamErr) && upstreamErr.Upstream == "requester provider" {
			respondError(w, http.StatusBadGateway, upstreamErr.Summary())
			return
		}
		var upstreamForwardErr *service.UpstreamForwardingError
		if errors.As(err, &upstreamForwardErr) && upstreamForwardErr.Upstream == "requester provider" {
			respondError(w, http.StatusBadGateway, upstreamForwardErr.Summary())
			return
		}
		if errors.Is(err, service.ErrInvalidResourceType) {
			respondError(w, http.StatusBadRequest, "invalid resource type in URL path")
			return
		}
		if errors.Is(err, service.ErrResourceTypeMismatch) {
			respondError(w, http.StatusConflict, "resource type in URL does not match transaction resource type")
			return
		}
		if errors.Is(err, service.ErrTransactionNotFound) {
			respondError(w, http.StatusNotFound, "transaction not found - no matching request exists")
			return
		}
		if errors.Is(err, service.ErrInvalidStatus) {
			respondError(w, http.StatusConflict, "transaction already processed or not in pending status")
			return
		}
		if errors.Is(err, service.ErrRequestTimedOut) {
			respondError(w, http.StatusRequestTimeout, "request took too long; transaction marked failed")
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
		if errors.Is(err, service.ErrSchemaValidation) {
			// 422 Unprocessable Entity - resource doesn't conform to required FHIR profile
			respondError(w, http.StatusUnprocessableEntity, "FHIR schema validation failed: "+err.Error())
			return
		}
		if errors.Is(err, service.ErrSchemaBuildFailed) {
			respondError(w, http.StatusUnprocessableEntity, "FHIR schema build failed: "+err.Error())
			return
		}
		if errors.Is(err, service.ErrInvalidResultPayload) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to process result: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "result received and processed"})
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
