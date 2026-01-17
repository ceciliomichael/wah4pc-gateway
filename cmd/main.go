package main

import (
	"log"
	"net/http"
	"os"

	"github.com/wah4pc/wah4pc-gateway/internal/config"
	"github.com/wah4pc/wah4pc-gateway/internal/handler"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"github.com/wah4pc/wah4pc-gateway/internal/router"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
	"github.com/wah4pc/wah4pc-gateway/internal/validator"
	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
)

func main() {
	// Load configuration
	configPath := "config.yaml"
	if envPath := os.Getenv("CONFIG_PATH"); envPath != "" {
		configPath = envPath
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Starting %s v%s", cfg.App.Name, cfg.App.Version)

	// Initialize repositories
	providerRepo, err := repository.NewJsonRepository[model.Provider](cfg.Data.ProvidersPath)
	if err != nil {
		log.Fatalf("Failed to initialize provider repository: %v", err)
	}

	txRepo, err := repository.NewJsonRepository[model.Transaction](cfg.Data.TransactionsPath)
	if err != nil {
		log.Fatalf("Failed to initialize transaction repository: %v", err)
	}

	apiKeyRepo, err := repository.NewJsonRepository[model.ApiKey](cfg.Data.ApiKeysPath)
	if err != nil {
		log.Fatalf("Failed to initialize API key repository: %v", err)
	}

	// Initialize schema validator for FHIR resource validation
	resourceDir := "resources"
	if envResourceDir := os.Getenv("RESOURCE_DIR"); envResourceDir != "" {
		resourceDir = envResourceDir
	}
	schemaValidator, err := validator.NewSchemaValidator(resourceDir)
	if err != nil {
		log.Fatalf("Failed to initialize schema validator: %v", err)
	}
	log.Printf("Schema Validator: Loaded %d resource type definitions", len(schemaValidator.GetSupportedResourceTypes()))

	// Initialize services
	providerService := service.NewProviderService(providerRepo)
	gatewayService := service.NewGatewayService(txRepo, providerService, cfg.Server.BaseURL, schemaValidator)
	apiKeyService := service.NewApiKeyService(apiKeyRepo, providerService)

	// Initialize handlers
	providerHandler := handler.NewProviderHandler(providerService)
	gatewayHandler := handler.NewGatewayHandler(gatewayService)
	apiKeyHandler := handler.NewApiKeyHandler(apiKeyService)

	// Initialize audit logger (writes to log/YYYY-MM-DD/audit.log)
	auditLogger := logger.NewFileLogger("log")
	defer auditLogger.Close()

	// Initialize router with middleware
	r := router.NewRouter(providerHandler, gatewayHandler, apiKeyHandler, apiKeyService, cfg.Security.MasterKey, auditLogger)

	// Start server
	addr := cfg.Address()
	log.Printf("Server listening on %s", addr)
	log.Printf("Gateway Base URL: %s", cfg.Server.BaseURL)
	log.Printf("API Authentication: Enabled (use X-API-Key header)")
	if cfg.Security.MasterKey != "" {
		log.Printf("Master Key: Configured (use X-Master-Key header for admin access)")
	}

	if err := http.ListenAndServe(addr, r.Handler()); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
