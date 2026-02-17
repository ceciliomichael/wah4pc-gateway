package handler

import (
	"net/http"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

type IdentityResponse struct {
	Role       string `json:"role"`
	ProviderID string `json:"providerId,omitempty"`
	KeyID      string `json:"keyId,omitempty"`
	Owner      string `json:"owner,omitempty"`
}

// Identity handles GET /api/v1/auth/identity.
func (h *AuthHandler) Identity(w http.ResponseWriter, r *http.Request) {
	key := middleware.GetKeyFromContext(r.Context())
	if key == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	respondJSON(w, http.StatusOK, IdentityResponse{
		Role:       string(key.Role),
		ProviderID: key.ProviderID,
		KeyID:      key.ID,
		Owner:      key.Owner,
	})
}

