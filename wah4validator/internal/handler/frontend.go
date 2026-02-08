package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type FrontendHandler struct {
	staticPath string
	proxy      *ProxyHandler
}

func NewFrontendHandler(staticPath string, proxy *ProxyHandler) *FrontendHandler {
	return &FrontendHandler{
		staticPath: staticPath,
		proxy:      proxy,
	}
}

func (h *FrontendHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Handle API routes for frontend
	if strings.HasPrefix(r.URL.Path, "/api/validate") {
		// Rewrite path to match what the Java validator likely expects
		// We map /api/validate -> /validateResource to match the existing gateway pattern
		r.URL.Path = "/validateResource"
		// Ensure correct content type for the validator
		r.Header.Set("Content-Type", "application/fhir+json")
		h.proxy.ServeHTTP(w, r)
		return
	}

	// Serve static files
	path := filepath.Join(h.staticPath, r.URL.Path)

	// Check if file exists
	info, err := os.Stat(path)
	if os.IsNotExist(err) || (err == nil && info.IsDir()) {
		// Fallback to index.html for SPA routing or directory requests
		// Only if the request is not for a specific file extension (basic check)
		if filepath.Ext(r.URL.Path) == "" {
			path = filepath.Join(h.staticPath, "index.html")
		}
	}

	http.ServeFile(w, r, path)
}