package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

// ProviderHandler handles provider-related HTTP requests
type ProviderHandler struct {
	service *service.ProviderService
}

// NewProviderHandler creates a new provider handler
func NewProviderHandler(svc *service.ProviderService) *ProviderHandler {
	return &ProviderHandler{service: svc}
}

// RegisterRequest is the request body for provider registration
type RegisterRequest struct {
	Name                          string `json:"name"`
	Type                          string `json:"type"`
	FacilityCode                  string `json:"facility_code"`
	FacilityCodeCamel             string `json:"facilityCode"`
	Location                      string `json:"location"`
	BaseURL                       string `json:"baseUrl"`
	GatewayAuthKey                string `json:"gatewayAuthKey"`
	PractitionerListEndpoint      string `json:"practitionerListEndpoint"`
	PractitionerListEndpointSnake string `json:"practitioner_list_endpoint"`
}

// PublicProviderResponse represents the public view of a provider
type PublicProviderResponse struct {
	ID           string             `json:"id"`
	Name         string             `json:"name"`
	Type         model.ProviderType `json:"type"`
	FacilityCode string             `json:"facility_code"`
	Location     string             `json:"location"`
	IsActive     bool               `json:"isActive"`
}

// Register handles POST /api/v1/providers
func (h *ProviderHandler) Register(w http.ResponseWriter, r *http.Request) {
	// Require admin role (includes master key)
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to register providers")
		return
	}

	var req RegisterRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	input := service.RegisterInput{
		Name:                     req.Name,
		Type:                     model.ProviderType(req.Type),
		FacilityCode:             firstNonEmpty(req.FacilityCode, req.FacilityCodeCamel),
		Location:                 req.Location,
		BaseURL:                  req.BaseURL,
		GatewayAuthKey:           req.GatewayAuthKey,
		PractitionerListEndpoint: firstNonEmpty(req.PractitionerListEndpoint, req.PractitionerListEndpointSnake),
	}

	provider, err := h.service.Register(input)
	if err != nil {
		if errors.Is(err, service.ErrInvalidProvider) {
			respondError(w, http.StatusBadRequest, "invalid provider data: name and a valid baseUrl are required")
			return
		}
		if errors.Is(err, service.ErrMissingRequiredField) {
			respondError(w, http.StatusBadRequest, "invalid provider data: type, facility_code, location, and gatewayAuthKey are required")
			return
		}
		if errors.Is(err, service.ErrProviderAlreadyExists) {
			respondError(w, http.StatusConflict, "provider already exists")
			return
		}
		if errors.Is(err, service.ErrDuplicateFacilityCode) {
			respondError(w, http.StatusConflict, "facility code already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to register provider")
		return
	}

	respondJSON(w, http.StatusCreated, provider)
}

// GetAll handles GET /api/v1/providers
func (h *ProviderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	providers, err := h.service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch providers")
		return
	}

	// Map to public response to hide sensitive/internal fields
	response := make([]PublicProviderResponse, len(providers))
	for i, p := range providers {
		response[i] = PublicProviderResponse{
			ID:           p.ID,
			Name:         p.Name,
			Type:         p.Type,
			FacilityCode: p.FacilityCode,
			Location:     p.Location,
			IsActive:     p.IsActive,
		}
	}

	respondJSON(w, http.StatusOK, response)
}

// GetByID handles GET /api/v1/providers/{id}
func (h *ProviderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/api/v1/providers/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "provider id required")
		return
	}

	provider, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to fetch provider")
		return
	}

	respondJSON(w, http.StatusOK, provider)
}

// Update handles PUT /api/v1/providers/{id}
func (h *ProviderHandler) Update(w http.ResponseWriter, r *http.Request) {
	// Require admin role (includes master key)
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to update providers")
		return
	}

	id := extractPathParam(r.URL.Path, "/api/v1/providers/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "provider id required")
		return
	}

	var req RegisterRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	input := service.RegisterInput{
		Name:                     req.Name,
		Type:                     model.ProviderType(req.Type),
		FacilityCode:             firstNonEmpty(req.FacilityCode, req.FacilityCodeCamel),
		Location:                 req.Location,
		BaseURL:                  req.BaseURL,
		GatewayAuthKey:           req.GatewayAuthKey,
		PractitionerListEndpoint: firstNonEmpty(req.PractitionerListEndpoint, req.PractitionerListEndpointSnake),
	}

	provider, err := h.service.Update(id, input)
	if err != nil {
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found")
			return
		}
		if errors.Is(err, service.ErrInvalidProvider) {
			respondError(w, http.StatusBadRequest, "invalid provider data: baseUrl must be a valid URL")
			return
		}
		if errors.Is(err, service.ErrMissingRequiredField) {
			respondError(w, http.StatusBadRequest, "invalid provider data: required fields cannot be empty")
			return
		}
		if errors.Is(err, service.ErrDuplicateFacilityCode) {
			respondError(w, http.StatusConflict, "facility code already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to update provider")
		return
	}

	respondJSON(w, http.StatusOK, provider)
}

// Delete handles DELETE /api/v1/providers/{id}
func (h *ProviderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// Require admin role (includes master key)
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to delete providers")
		return
	}

	id := extractPathParam(r.URL.Path, "/api/v1/providers/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "provider id required")
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to delete provider")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "provider deleted"})
}

// SetActiveRequest is the request body for setting provider active status
type SetActiveRequest struct {
	Active bool `json:"active"`
}

// SetActive handles POST /api/v1/providers/{id}/status
func (h *ProviderHandler) SetActive(w http.ResponseWriter, r *http.Request) {
	// Require admin role (includes master key)
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to update provider status")
		return
	}

	// Extract ID from path: /api/v1/providers/{id}/status
	path := r.URL.Path
	path = strings.TrimPrefix(path, "/api/v1/providers/")
	path = strings.TrimSuffix(path, "/status")
	id := path

	if id == "" {
		respondError(w, http.StatusBadRequest, "provider id required")
		return
	}

	var req SetActiveRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	provider, err := h.service.SetActive(id, req.Active)
	if err != nil {
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to update provider status")
		return
	}

	respondJSON(w, http.StatusOK, provider)
}

// SyncPractitionerListWebhook handles POST /api/v1/providers/{id}/practitioners/webhook
// Provider systems can ping this webhook after adding practitioners to refresh cached practitionerList.
func (h *ProviderHandler) SyncPractitionerListWebhook(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin && role != model.ApiKeyRoleUser {
		respondError(w, http.StatusForbidden, "admin or user role required to sync practitioner list")
		return
	}

	path := r.URL.Path
	path = strings.TrimPrefix(path, "/api/v1/providers/")
	path = strings.TrimSuffix(path, "/practitioners/webhook")
	id := strings.TrimSpace(path)
	if id == "" {
		respondError(w, http.StatusBadRequest, "provider id required")
		return
	}

	// User keys are provider-scoped: only allow syncing their own provider.
	if role == model.ApiKeyRoleUser {
		if middleware.GetProviderIDFromContext(r.Context()) != id {
			respondError(w, http.StatusForbidden, "not authorized to sync practitioner list for this provider")
			return
		}
	}

	provider, err := h.service.SyncPractitionerList(id)
	if err != nil {
		if errors.Is(err, service.ErrProviderNotFound) {
			respondError(w, http.StatusNotFound, "provider not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to sync practitioner list")
		return
	}

	respondJSON(w, http.StatusOK, provider)
}

// extractPathParam extracts a path parameter after a prefix
func extractPathParam(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	param := strings.TrimPrefix(path, prefix)
	// Remove trailing slash if present
	param = strings.TrimSuffix(param, "/")
	return param
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
