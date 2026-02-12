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
	Data      DataConfig      `yaml:"data"`
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

type DataConfig struct {
	ProvidersPath    string `yaml:"providers_path"`
	TransactionsPath string `yaml:"transactions_path"`
	ApiKeysPath      string `yaml:"api_keys_path"`
	SettingsPath     string `yaml:"settings_path"`
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
	if providersPath := os.Getenv("DATA_PROVIDERS_PATH"); providersPath != "" {
		cfg.Data.ProvidersPath = providersPath
	}
	if txPath := os.Getenv("DATA_TRANSACTIONS_PATH"); txPath != "" {
		cfg.Data.TransactionsPath = txPath
	}
	if apiKeysPath := os.Getenv("DATA_API_KEYS_PATH"); apiKeysPath != "" {
		cfg.Data.ApiKeysPath = apiKeysPath
	}
	if settingsPath := os.Getenv("DATA_SETTINGS_PATH"); settingsPath != "" {
		cfg.Data.SettingsPath = settingsPath
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
	if cfg.Data.ProvidersPath == "" {
		cfg.Data.ProvidersPath = "data/providers.json"
	}
	if cfg.Data.TransactionsPath == "" {
		cfg.Data.TransactionsPath = "data/transactions.json"
	}
	if cfg.Data.ApiKeysPath == "" {
		cfg.Data.ApiKeysPath = "data/apikeys.json"
	}
	if cfg.Data.SettingsPath == "" {
		cfg.Data.SettingsPath = "data/settings.json"
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
