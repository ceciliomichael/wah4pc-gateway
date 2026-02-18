package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/config"
	"github.com/wah4pc/wah4pc-gateway/internal/handler"
	mongoRepo "github.com/wah4pc/wah4pc-gateway/internal/repository/mongo"
	"github.com/wah4pc/wah4pc-gateway/internal/router"
	"github.com/wah4pc/wah4pc-gateway/internal/service"
	"github.com/wah4pc/wah4pc-gateway/internal/validator"
	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
	"github.com/wah4pc/wah4pc-gateway/pkg/realtime"
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

	// Initialize MongoDB client
	mongoClient, err := mongoRepo.Connect(cfg.MongoDB.URI)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := mongoClient.Disconnect(ctx); err != nil {
			log.Printf("Failed to disconnect MongoDB client: %v", err)
		}
	}()

	db := mongoClient.Database(cfg.MongoDB.Database)

	// Initialize repositories
	providerRepo, err := mongoRepo.NewProviderRepository(db, cfg.MongoDB.ProvidersCollection)
	if err != nil {
		log.Fatalf("Failed to initialize provider repository: %v", err)
	}

	txRepo, err := mongoRepo.NewTransactionRepository(db, cfg.MongoDB.TransactionsCollection)
	if err != nil {
		log.Fatalf("Failed to initialize transaction repository: %v", err)
	}

	apiKeyRepo, err := mongoRepo.NewApiKeyRepository(db, cfg.MongoDB.ApiKeysCollection)
	if err != nil {
		log.Fatalf("Failed to initialize API key repository: %v", err)
	}

	settingsRepo, err := mongoRepo.NewSettingsRepository(db, cfg.MongoDB.SettingsCollection)
	if err != nil {
		log.Fatalf("Failed to initialize settings repository: %v", err)
	}

	// Initialize remote FHIR validator
	var remoteValidator validator.Validator
	if cfg.Validator.Disabled {
		log.Printf("Remote Validator: Disabled by configuration")
	} else {
		remoteValidator = validator.NewRemoteValidator(cfg.Validator.URL, cfg.Validator.APIKey)
		log.Printf("Remote Validator: Configured to use %s", cfg.Validator.URL)
	}

	logRepo, err := mongoRepo.NewLogRepository(db, cfg.MongoDB.LogsCollection)
	if err != nil {
		log.Fatalf("Failed to initialize log repository: %v", err)
	}

	eventBroker := realtime.NewBroker()

	// Initialize audit logger (persists entries to MongoDB)
	auditLogger := logger.NewFileLogger(logRepo, eventBroker)
	defer auditLogger.Close()

	if err := service.MigrateLegacyLogs("log", "logs.txt", logRepo); err != nil {
		log.Printf("Legacy log migration warning: %v", err)
	}

	// Initialize services
	providerService := service.NewProviderService(providerRepo)
	settingsService := service.NewSettingsService(settingsRepo)
	gatewayService := service.NewGatewayService(txRepo, providerService, settingsService, cfg.Server.BaseURL, remoteValidator, auditLogger)
	apiKeyService := service.NewApiKeyService(apiKeyRepo, providerService)
	logService := service.NewLogService(logRepo, txRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler()
	providerHandler := handler.NewProviderHandler(providerService)
	gatewayHandler := handler.NewGatewayHandler(gatewayService)
	apiKeyHandler := handler.NewApiKeyHandler(apiKeyService)
	logHandler := handler.NewLogHandler(logService)
	settingsHandler := handler.NewSettingsHandler(settingsService)
	eventsHandler := handler.NewEventsHandler(eventBroker)

	// Initialize router with middleware
	r := router.NewRouter(authHandler, providerHandler, gatewayHandler, apiKeyHandler, logHandler, settingsHandler, eventsHandler, apiKeyService, cfg.Security.MasterKey, auditLogger)

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
