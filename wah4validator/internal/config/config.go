package config

import (
	"log"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server        ServerConfig        `yaml:"server"`
	JavaValidator JavaValidatorConfig `yaml:"java_validator"`
	Fhir          FhirConfig          `yaml:"fhir"`
	Security      SecurityConfig      `yaml:"security"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type JavaValidatorConfig struct {
	Host     string `yaml:"host"`
	Port     string `yaml:"port"`
	JarPath  string `yaml:"jar_path"`
	JavaPath string `yaml:"java_path"`
	IgPath   string `yaml:"ig_path"`
}

type FhirConfig struct {
	Version string `yaml:"version"`
}

type SecurityConfig struct {
	AdminSecret string          `yaml:"admin_secret"`
	DevApiKey   string          `yaml:"dev_api_key"`
	RateLimit   RateLimitConfig `yaml:"rate_limit"`
}

type RateLimitConfig struct {
	RequestsPerSecond float64 `yaml:"requests_per_second"`
	Burst             int     `yaml:"burst"`
}

func Load() *Config {
	// Default configuration
	cfg := &Config{
		Server: ServerConfig{
			Port: "8080",
		},
		JavaValidator: JavaValidatorConfig{
			Host:     "localhost",
			Port:     "9090",
			JarPath:  "validator_cli.jar",
			JavaPath: "java",
			IgPath:   "resources",
		},
		Fhir: FhirConfig{
			Version: "4.0.1",
		},
		Security: SecurityConfig{
			AdminSecret: "admin-secret",
			DevApiKey:   "dev-api-key-for-frontend",
			RateLimit: RateLimitConfig{
				RequestsPerSecond: 10,
				Burst:             20,
			},
		},
	}

	// Load from config.yaml if it exists
	if _, err := os.Stat("config.yaml"); err == nil {
		data, err := os.ReadFile("config.yaml")
		if err != nil {
			log.Printf("Error reading config.yaml: %v", err)
		} else {
			if err := yaml.Unmarshal(data, cfg); err != nil {
				log.Printf("Error parsing config.yaml: %v", err)
			}
		}
	} else {
		// Fallback to Env if config.yaml is missing (legacy support)
		cfg.Server.Port = getEnv("SERVER_PORT", cfg.Server.Port)
		cfg.JavaValidator.Port = getEnv("JAVA_INTERNAL_PORT", cfg.JavaValidator.Port)
		cfg.JavaValidator.JarPath = getEnv("VALIDATOR_JAR_PATH", cfg.JavaValidator.JarPath)
		cfg.Fhir.Version = getEnv("FHIR_VERSION", cfg.Fhir.Version)
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Helper methods for backward compatibility or ease of use

func (c *Config) GetServerAddr() string {
	return ":" + c.Server.Port
}

func (c *Config) GetJavaInternalAddr() string {
	return "http://" + c.JavaValidator.Host + ":" + c.JavaValidator.Port
}

func (c *Config) GetJavaInternalPortInt() int {
	port, _ := strconv.Atoi(c.JavaValidator.Port)
	return port
}
