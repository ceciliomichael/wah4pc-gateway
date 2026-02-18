package config

import (
	"fmt"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

type Config struct {
	App       AppConfig       `yaml:"app"`
	Server    ServerConfig    `yaml:"server"`
	Security  SecurityConfig  `yaml:"security"`
	MongoDB   MongoDBConfig   `yaml:"mongodb"`
	Logging   LoggingConfig   `yaml:"logging"`
	Validator ValidatorConfig `yaml:"validator"`
}

type ValidatorConfig struct {
	URL      string `yaml:"url"`
	APIKey   string `yaml:"api_key"`
	Disabled bool   `yaml:"disabled"`
}

type AppConfig struct {
	Name    string `yaml:"name"`
	Version string `yaml:"version"`
}

type ServerConfig struct {
	Host    string `yaml:"host"`
	Port    int    `yaml:"port"`
	BaseURL string `yaml:"base_url"`
}

type MongoDBConfig struct {
	URI                    string `yaml:"uri"`
	Database               string `yaml:"database"`
	ProvidersCollection    string `yaml:"providers_collection"`
	TransactionsCollection string `yaml:"transactions_collection"`
	ApiKeysCollection      string `yaml:"api_keys_collection"`
	SettingsCollection     string `yaml:"settings_collection"`
	LogsCollection         string `yaml:"logs_collection"`
}

type LoggingConfig struct {
	Level string `yaml:"level"`
}

type SecurityConfig struct {
	MasterKey string `yaml:"master_key"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	setDefaults(&cfg)

	loadFromEnv(&cfg)

	return &cfg, nil
}

func loadFromEnv(cfg *Config) {
	if port := os.Getenv("SERVER_PORT"); port != "" {
		var p int
		if _, err := fmt.Sscanf(port, "%d", &p); err == nil {
			cfg.Server.Port = p
		}
	}
	if host := os.Getenv("SERVER_HOST"); host != "" {
		cfg.Server.Host = host
	}
	if baseURL := os.Getenv("SERVER_BASE_URL"); baseURL != "" {
		cfg.Server.BaseURL = baseURL
	}
	if masterKey := os.Getenv("SECURITY_MASTER_KEY"); masterKey != "" {
		cfg.Security.MasterKey = masterKey
	}
	if mongoURI := os.Getenv("MONGODB_URI"); mongoURI != "" {
		cfg.MongoDB.URI = mongoURI
	}
	if mongoDBName := os.Getenv("MONGODB_DATABASE"); mongoDBName != "" {
		cfg.MongoDB.Database = mongoDBName
	}
	if providersCollection := os.Getenv("MONGODB_PROVIDERS_COLLECTION"); providersCollection != "" {
		cfg.MongoDB.ProvidersCollection = providersCollection
	}
	if txCollection := os.Getenv("MONGODB_TRANSACTIONS_COLLECTION"); txCollection != "" {
		cfg.MongoDB.TransactionsCollection = txCollection
	}
	if apiKeyCollection := os.Getenv("MONGODB_API_KEYS_COLLECTION"); apiKeyCollection != "" {
		cfg.MongoDB.ApiKeysCollection = apiKeyCollection
	}
	if settingsCollection := os.Getenv("MONGODB_SETTINGS_COLLECTION"); settingsCollection != "" {
		cfg.MongoDB.SettingsCollection = settingsCollection
	}
	if logsCollection := os.Getenv("MONGODB_LOGS_COLLECTION"); logsCollection != "" {
		cfg.MongoDB.LogsCollection = logsCollection
	}
	if validatorURL := os.Getenv("VALIDATOR_URL"); validatorURL != "" {
		cfg.Validator.URL = validatorURL
	}
	if validatorAPIKey := os.Getenv("VALIDATOR_API_KEY"); validatorAPIKey != "" {
		cfg.Validator.APIKey = validatorAPIKey
	}
	if validatorDisabled := os.Getenv("VALIDATOR_DISABLED"); validatorDisabled != "" {
		if disabled, err := strconv.ParseBool(validatorDisabled); err == nil {
			cfg.Validator.Disabled = disabled
		}
	}
}

func setDefaults(cfg *Config) {
	if cfg.App.Name == "" {
		cfg.App.Name = "wah4pc-gateway"
	}
	if cfg.App.Version == "" {
		cfg.App.Version = "1.0.0"
	}
	if cfg.Server.Host == "" {
		cfg.Server.Host = "0.0.0.0"
	}
	if cfg.Server.Port == 0 {
		cfg.Server.Port = 3040
	}
	if cfg.Server.BaseURL == "" {
		cfg.Server.BaseURL = fmt.Sprintf("http://%s:%d", cfg.Server.Host, cfg.Server.Port)
	}
	if cfg.MongoDB.URI == "" {
		cfg.MongoDB.URI = "mongodb://mongodb:27017"
	}
	if cfg.MongoDB.Database == "" {
		cfg.MongoDB.Database = "wah4pc_gateway"
	}
	if cfg.MongoDB.ProvidersCollection == "" {
		cfg.MongoDB.ProvidersCollection = "providers"
	}
	if cfg.MongoDB.TransactionsCollection == "" {
		cfg.MongoDB.TransactionsCollection = "transactions"
	}
	if cfg.MongoDB.ApiKeysCollection == "" {
		cfg.MongoDB.ApiKeysCollection = "api_keys"
	}
	if cfg.MongoDB.SettingsCollection == "" {
		cfg.MongoDB.SettingsCollection = "settings"
	}
	if cfg.MongoDB.LogsCollection == "" {
		cfg.MongoDB.LogsCollection = "logs"
	}
	if cfg.Logging.Level == "" {
		cfg.Logging.Level = "info"
	}
	if cfg.Validator.URL == "" {
		cfg.Validator.URL = "http://localhost:8080"
	}
}

func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}
