package handler

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"wah4pc/internal/service"
)

type ProxyHandler struct {
	validator service.ValidatorService
	proxy     *httputil.ReverseProxy
}

func NewProxyHandler(validator service.ValidatorService) *ProxyHandler {
	target, _ := url.Parse(validator.GetTargetURL())

	proxy := httputil.NewSingleHostReverseProxy(target)
	
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// Reset the host header to match the target
		req.Host = target.Host
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("Proxy error: %v", err)
		http.Error(w, "Validator service unavailable", http.StatusBadGateway)
	}

	return &ProxyHandler{
		validator: validator,
		proxy:     proxy,
	}
}

func (h *ProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !h.validator.IsReady() {
		http.Error(w, "Validator service starting up, please wait...", http.StatusServiceUnavailable)
		return
	}
	h.proxy.ServeHTTP(w, r)
}