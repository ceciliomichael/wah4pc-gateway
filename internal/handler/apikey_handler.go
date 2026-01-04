package handler

import (
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// ApiKeyServiceInterface defines the interface for API key operations
type ApiKeyServiceInterface interface {
	Create(req model.ApiKeyCreateRequest) (*model.ApiKeyResponse, error)
	GetAll() ([]model.ApiKeyListItem, error)
	GetByID(id string) (*model.ApiKeyListItem, error)
	Delete(id string) error
	Revoke(id string) error
	IsEmpty() (bool, error)
}

// ApiKeyHandler handles API key management endpoints
type ApiKeyHandler struct {
	service ApiKeyServiceInterface
}

// NewApiKeyHandler creates a new API key handler
func NewApiKeyHandler(service ApiKeyServiceInterface) *ApiKeyHandler {
	return &ApiKeyHandler{
		service: service,
	}
}

// Create handles POST /api/v1/apikeys
func (h *ApiKeyHandler) Create(w http.ResponseWriter, r *http.Request) {
	// Check if this is bootstrap mode (no keys exist)
	isEmpty, err := h.service.IsEmpty()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to check API keys")
		return
	}

	// If keys exist, require admin role
	if !isEmpty {
		role := middleware.GetRoleFromContext(r.Context())
		if role != model.ApiKeyRoleAdmin {
			respondError(w, http.StatusForbidden, "admin role required to create API keys")
			return
		}
	}

	var req model.ApiKeyCreateRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Owner == "" {
		respondError(w, http.StatusBadRequest, "owner is required")
		return
	}

	// If bootstrap mode (empty DB and not authenticated as admin), force admin role for first key
	// This allows Master Key authenticated admins to create user keys even as the first key
	currentRole := middleware.GetRoleFromContext(r.Context())
	if isEmpty && currentRole != model.ApiKeyRoleAdmin {
		req.Role = model.ApiKeyRoleAdmin
	}

	// Validate role if provided
	if req.Role != "" && req.Role != model.ApiKeyRoleAdmin && req.Role != model.ApiKeyRoleUser {
		respondError(w, http.StatusBadRequest, "role must be 'admin' or 'user'")
		return
	}

	response, err := h.service.Create(req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create API key")
		return
	}

	respondJSON(w, http.StatusCreated, response)
}

// GetAll handles GET /api/v1/apikeys
func (h *ApiKeyHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// Require admin role
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to list API keys")
		return
	}

	keys, err := h.service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to retrieve API keys")
		return
	}

	respondJSON(w, http.StatusOK, keys)
}

// GetByID handles GET /api/v1/apikeys/{id}
func (h *ApiKeyHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	// Require admin role
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to view API key details")
		return
	}

	id := extractIDFromPath(r.URL.Path, "/api/v1/apikeys/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "missing API key ID")
		return
	}

	key, err := h.service.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}

	respondJSON(w, http.StatusOK, key)
}

// Delete handles DELETE /api/v1/apikeys/{id}
func (h *ApiKeyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// Require admin role
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to delete API keys")
		return
	}

	id := extractIDFromPath(r.URL.Path, "/api/v1/apikeys/")
	if id == "" {
		respondError(w, http.StatusBadRequest, "missing API key ID")
		return
	}

	// Prevent deleting own key
	currentKey := middleware.GetKeyFromContext(r.Context())
	if currentKey != nil && currentKey.ID == id {
		respondError(w, http.StatusBadRequest, "cannot delete your own API key")
		return
	}

	if err := h.service.Delete(id); err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Revoke handles POST /api/v1/apikeys/{id}/revoke
func (h *ApiKeyHandler) Revoke(w http.ResponseWriter, r *http.Request) {
	// Require admin role
	role := middleware.GetRoleFromContext(r.Context())
	if role != model.ApiKeyRoleAdmin {
		respondError(w, http.StatusForbidden, "admin role required to revoke API keys")
		return
	}

	// Extract ID from path like /api/v1/apikeys/{id}/revoke
	path := r.URL.Path
	path = strings.TrimPrefix(path, "/api/v1/apikeys/")
	path = strings.TrimSuffix(path, "/revoke")
	id := path

	if id == "" {
		respondError(w, http.StatusBadRequest, "missing API key ID")
		return
	}

	// Prevent revoking own key
	currentKey := middleware.GetKeyFromContext(r.Context())
	if currentKey != nil && currentKey.ID == id {
		respondError(w, http.StatusBadRequest, "cannot revoke your own API key")
		return
	}

	if err := h.service.Revoke(id); err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "API key revoked"})
}

// extractIDFromPath extracts the ID from a URL path
func extractIDFromPath(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	id := strings.TrimPrefix(path, prefix)
	// Remove trailing slash and any sub-paths
	if idx := strings.Index(id, "/"); idx != -1 {
		id = id[:idx]
	}
	return id
}