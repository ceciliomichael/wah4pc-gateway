package handler

import (
	"encoding/json"
	"net/http"

	"wah4pc/internal/config"
	"wah4pc/internal/service"
)

type AuthHandler struct {
	authService service.AuthService
	config      *config.Config
}

func NewAuthHandler(authService service.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		config:      cfg,
	}
}

type CreateKeyRequest struct {
	Name string `json:"name"`
}

func (h *AuthHandler) HandleCreateKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Verify Admin Secret
	if !h.isAdmin(r) {
		http.Error(w, "Unauthorized: Invalid Admin Secret", http.StatusUnauthorized)
		return
	}

	var req CreateKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Name is optional, so ignore error if body is empty or malformed, just use default
		req.Name = "Unnamed Key"
	}

	apiKey, err := h.authService.CreateKey(req.Name)
	if err != nil {
		http.Error(w, "Failed to create key", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apiKey)
}

func (h *AuthHandler) HandleDeleteKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !h.isAdmin(r) {
		http.Error(w, "Unauthorized: Invalid Admin Secret", http.StatusUnauthorized)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, "Missing 'key' query parameter", http.StatusBadRequest)
		return
	}

	if err := h.authService.DeleteKey(key); err != nil {
		http.Error(w, "Failed to delete key: "+err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Key deleted successfully"))
}

func (h *AuthHandler) HandleListKeys(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !h.isAdmin(r) {
		http.Error(w, "Unauthorized: Invalid Admin Secret", http.StatusUnauthorized)
		return
	}

	keys, err := h.authService.ListKeys()
	if err != nil {
		http.Error(w, "Failed to list keys", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keys)
}

func (h *AuthHandler) isAdmin(r *http.Request) bool {
	secret := r.Header.Get("X-Admin-Secret")
	return secret == h.config.Security.AdminSecret
}