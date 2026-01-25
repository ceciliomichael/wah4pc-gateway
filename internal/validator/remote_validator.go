package validator

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Validation errors for remote validation
var (
	ErrValidationFailed    = errors.New("FHIR validation failed")
	ErrValidatorUnavailable = errors.New("validator service unavailable")
)

// RemoteValidator validates FHIR resources by calling an external validation service
type RemoteValidator struct {
	httpClient *http.Client
	baseURL    string
	apiKey     string
}

// NewRemoteValidator creates a new remote validator instance
func NewRemoteValidator(baseURL, apiKey string) *RemoteValidator {
	return &RemoteValidator{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: baseURL,
		apiKey:  apiKey,
	}
}

// Validate sends the FHIR resource to the remote validation service
// Returns nil if valid, or an error with validation details if invalid
func (v *RemoteValidator) Validate(resourceType string, data json.RawMessage) error {
	// Construct the validation endpoint URL
	url := fmt.Sprintf("%s/validateResource", v.baseURL)

	// Create the HTTP request with the raw FHIR JSON data
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/fhir+json")
	if v.apiKey != "" {
		req.Header.Set("X-API-Key", v.apiKey)
	}

	// Execute the request
	resp, err := v.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrValidatorUnavailable, err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read validation response: %w", err)
	}

	// Check response status
	if resp.StatusCode == http.StatusOK {
		// Validation passed - but we should check the response body for actual validation result
		// The FHIR validator returns an OperationOutcome with issues
		var outcome ValidationOutcome
		if err := json.Unmarshal(body, &outcome); err == nil {
			// Check if there are any error-level issues
			for _, issue := range outcome.Issue {
				if issue.Severity == "error" || issue.Severity == "fatal" {
					return fmt.Errorf("%w: %s - %s", ErrValidationFailed, issue.Code, issue.Diagnostics)
				}
			}
		}
		return nil
	}

	// Handle error responses
	if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusBadGateway {
		return fmt.Errorf("%w: service returned %d", ErrValidatorUnavailable, resp.StatusCode)
	}

	// Parse error response for details
	var outcome ValidationOutcome
	if err := json.Unmarshal(body, &outcome); err == nil && len(outcome.Issue) > 0 {
		// Build error message from all issues
		var errorMsg string
		for _, issue := range outcome.Issue {
			if issue.Severity == "error" || issue.Severity == "fatal" {
				if errorMsg != "" {
					errorMsg += "; "
				}
				errorMsg += fmt.Sprintf("%s: %s", issue.Code, issue.Diagnostics)
			}
		}
		if errorMsg != "" {
			return fmt.Errorf("%w: %s", ErrValidationFailed, errorMsg)
		}
	}

	// Fallback: return raw error body
	return fmt.Errorf("%w: %s", ErrValidationFailed, string(body))
}

// ValidationOutcome represents the FHIR OperationOutcome response from the validator
type ValidationOutcome struct {
	ResourceType string            `json:"resourceType"`
	Issue        []ValidationIssue `json:"issue"`
}

// ValidationIssue represents a single issue in the OperationOutcome
type ValidationIssue struct {
	Severity    string `json:"severity"`    // fatal, error, warning, information
	Code        string `json:"code"`        // Issue type code
	Diagnostics string `json:"diagnostics"` // Human-readable description
	Location    []string `json:"location,omitempty"` // Path to the issue
}