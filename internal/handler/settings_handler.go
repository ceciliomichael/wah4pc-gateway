package handler

import (
	"net/http"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

// SettingsHandler handles settings HTTP requests
type SettingsHandler struct {
	service *service.SettingsService
}

// NewSettingsHandler creates a new settings handler
func NewSettingsHandler(svc *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{service: svc}
}

// Get handles GET /api/v1/settings
func (h *SettingsHandler) Get(w http.ResponseWriter, r *http.Request) {
	settings, err := h.service.GetSettings()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch settings")
		return
	}

	respondJSON(w, http.StatusOK, settings)
}

// Update handles PUT /api/v1/settings
func (h *SettingsHandler) Update(w http.ResponseWriter, r *http.Request) {
	var req model.SystemSettings
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Force ID to match singleton
	req.ID = model.SettingsIDGlobal

	updated, err := h.service.UpdateSettings(req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update settings")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}