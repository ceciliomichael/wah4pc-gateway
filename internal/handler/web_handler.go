package handler

import (
	"io/fs"
	"net/http"

	"github.com/wah4pc/wah4pc-gateway/internal/ui"
)

// WebHandler serves static web content
type WebHandler struct {
	staticFS fs.FS
}

// NewWebHandler creates a new web handler for serving static content
func NewWebHandler() *WebHandler {
	// Get the static subdirectory from the embedded filesystem
	staticFS, err := fs.Sub(ui.StaticFS, "static")
	if err != nil {
		panic("failed to get static filesystem: " + err.Error())
	}

	return &WebHandler{
		staticFS: staticFS,
	}
}

// ServeProviders serves the providers listing page
func (h *WebHandler) ServeProviders(w http.ResponseWriter, r *http.Request) {
	// Serve the index.html file
	content, err := fs.ReadFile(h.staticFS, "index.html")
	if err != nil {
		http.Error(w, "Page not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.WriteHeader(http.StatusOK)
	w.Write(content)
}