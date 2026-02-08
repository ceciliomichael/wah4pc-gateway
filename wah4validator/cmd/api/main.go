package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"wah4pc/internal/config"
	"wah4pc/internal/handler"
	"wah4pc/internal/middleware"
	"wah4pc/internal/service"
	"wah4pc/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.New("WAH4PC")

	// Display banner
	log.Banner("WAH4PC FHIR VALIDATOR GATEWAY", "Healthcare Interoperability Platform")

	// 1. Load Configuration
	log.Start("Loading configuration...")
	cfg := config.Load()

	log.Separator()
	log.Infof("Server Port: %s", cfg.Server.Port)
	log.Infof("Java Validator Port: %s", cfg.JavaValidator.Port)
	log.Infof("FHIR Version: %s", cfg.Fhir.Version)
	log.Infof("Validator JAR: %s", cfg.JavaValidator.JarPath)
	log.Separator()

	// 2. Initialize Validator Service
	log.Start("Initializing validator service...")
	validator := service.NewValidatorService(cfg, log)

	// Initialize Auth Service
	log.Start("Initializing auth service...")
	authService := service.NewAuthService(cfg, log)

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 3. Start Validator Service
	log.Start("Starting FHIR validator service...")
	if err := validator.Start(ctx); err != nil {
		log.Errorf("Failed to start validator service: %v", err)
		os.Exit(1)
	}

	// Ensure we stop the validator on exit
	defer func() {
		log.Warn("Shutting down validator service...")
		if err := validator.Stop(); err != nil {
			log.Errorf("Error stopping validator: %v", err)
		}
	}()

	// 4. Setup Handlers & Middleware
	proxyHandler := handler.NewProxyHandler(validator)
	authHandler := handler.NewAuthHandler(authService, cfg)
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// 5. Setup Router
	mux := http.NewServeMux()

	// Protected Routes
	mux.Handle("/validateResource", authMiddleware.RequireApiKey(proxyHandler))

	// Admin Routes (Key Management)
	mux.HandleFunc("POST /api/keys", authHandler.HandleCreateKey)
	mux.HandleFunc("DELETE /api/keys", authHandler.HandleDeleteKey)
	mux.HandleFunc("GET /api/keys", authHandler.HandleListKeys)

	// Public Routes
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if validator.IsReady() {
			w.WriteHeader(http.StatusOK)
			fmt.Fprint(w, "OK")
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprint(w, "Starting up")
		}
	})

	// 6. Start HTTP Server
	srv := &http.Server{
		Addr:    cfg.GetServerAddr(),
		Handler: mux,
	}

	// Server run loop
	go func() {
		log.Separator()
		log.Successf("HTTP server listening on %s", cfg.GetServerAddr())
		log.Infof("Proxying requests to Java validator at %s", cfg.GetJavaInternalAddr())
		log.Separator()
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Errorf("HTTP server failed: %v", err)
			os.Exit(1)
		}
	}()

	// 7. Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop
	log.Warn("Received shutdown signal")

	// Shutdown HTTP server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Errorf("HTTP server forced to shutdown: %v", err)
	}

	// The deferred validator.Stop() will run after this function exits
	log.Success("Server exited gracefully")
}
