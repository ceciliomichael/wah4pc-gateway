package service

import (
	"fmt"
	"net/url"
	"strings"
)

// normalizeProviderBaseURL trims and validates provider base URLs.
func normalizeProviderBaseURL(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", fmt.Errorf("baseUrl is required")
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return "", fmt.Errorf("invalid baseUrl: %w", err)
	}
	if parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid baseUrl: scheme and host are required")
	}

	normalized := strings.TrimRight(parsed.String(), "/")
	return normalized, nil
}

// buildProviderEndpointURL safely builds a full endpoint URL from a provider base URL.
func buildProviderEndpointURL(baseURL, endpointPath string) (string, error) {
	normalizedBaseURL, err := normalizeProviderBaseURL(baseURL)
	if err != nil {
		return "", err
	}

	cleanPath := "/" + strings.TrimLeft(endpointPath, "/")
	return normalizedBaseURL + cleanPath, nil
}
