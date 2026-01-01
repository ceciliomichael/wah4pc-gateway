package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	App      AppConfig      `yaml:"app"`
	Server   ServerConfig   `yaml:"server"`
	Security SecurityConfig `yaml:"security"`
	Data     DataConfig     `yaml:"data"`
	Logging  LoggingConfig  `yaml:"logging"`
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

	return &cfg, nil
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
		cfg.Server.Port = 8080
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
	if cfg.Logging.Level == "" {
		cfg.Logging.Level = "info"
	}
}

func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}
