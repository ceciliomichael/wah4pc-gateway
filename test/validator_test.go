package test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wah4pc/wah4pc-gateway/internal/validator"
)

// TestRemoteValidator_ValidResource tests successful validation of a valid FHIR resource
func TestRemoteValidator_ValidResource(t *testing.T) {
	// Mock validator server that returns success
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST method, got %s", r.Method)
		}
		if r.URL.Path != "/validateResource" {
			t.Errorf("Expected /validateResource path, got %s", r.URL.Path)
		}
		if r.Header.Get("X-API-Key") != "test-api-key" {
			t.Errorf("Expected X-API-Key header to be 'test-api-key', got %s", r.Header.Get("X-API-Key"))
		}
		if r.Header.Get("Content-Type") != "application/fhir+json" {
			t.Errorf("Expected Content-Type 'application/fhir+json', got %s", r.Header.Get("Content-Type"))
		}

		// Return valid OperationOutcome with no errors
		w.Header().Set("Content-Type", "application/fhir+json")
		w.WriteHeader(http.StatusOK)
		response := map[string]interface{}{
			"resourceType": "OperationOutcome",
			"issue": []map[string]interface{}{
				{
					"severity":    "information",
					"code":        "informational",
					"diagnostics": "Validation passed",
				},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Create validator with mock server URL
	v := validator.NewRemoteValidator(server.URL, "test-api-key")

	// Test valid Patient resource
	patientData := json.RawMessage(`{
		"resourceType": "Patient",
		"id": "test-patient-1",
		"meta": {
			"profile": ["http://hl7.org/fhir/StructureDefinition/Patient"]
		},
		"name": [{"family": "Test", "given": ["John"]}]
	}`)

	err := v.Validate("Patient", patientData)
	if err != nil {
		t.Errorf("Expected no error for valid resource, got: %v", err)
	}
}

// TestRemoteValidator_InvalidResource tests validation failure for an invalid FHIR resource
func TestRemoteValidator_InvalidResource(t *testing.T) {
	// Mock validator server that returns validation error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/fhir+json")
		w.WriteHeader(http.StatusOK)
		response := map[string]interface{}{
			"resourceType": "OperationOutcome",
			"issue": []map[string]interface{}{
				{
					"severity":    "error",
					"code":        "invalid",
					"diagnostics": "Patient.name: minimum required = 1, but only found 0",
				},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	v := validator.NewRemoteValidator(server.URL, "test-api-key")

	// Test invalid Patient resource (missing required name)
	invalidPatient := json.RawMessage(`{
		"resourceType": "Patient",
		"id": "invalid-patient"
	}`)

	err := v.Validate("Patient", invalidPatient)
	if err == nil {
		t.Error("Expected error for invalid resource, got nil")
	}
}

// TestRemoteValidator_ServiceUnavailable tests handling of validator service unavailability
func TestRemoteValidator_ServiceUnavailable(t *testing.T) {
	// Mock validator server that returns 503
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("Service temporarily unavailable"))
	}))
	defer server.Close()

	v := validator.NewRemoteValidator(server.URL, "test-api-key")

	patientData := json.RawMessage(`{"resourceType": "Patient"}`)

	err := v.Validate("Patient", patientData)
	if err == nil {
		t.Error("Expected error when service is unavailable, got nil")
	}
}

// TestRemoteValidator_BadRequest tests handling of 400 responses
func TestRemoteValidator_BadRequest(t *testing.T) {
	// Mock validator server that returns 400 with error details
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/fhir+json")
		w.WriteHeader(http.StatusBadRequest)
		response := map[string]interface{}{
			"resourceType": "OperationOutcome",
			"issue": []map[string]interface{}{
				{
					"severity":    "error",
					"code":        "structure",
					"diagnostics": "Invalid JSON structure",
				},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	v := validator.NewRemoteValidator(server.URL, "test-api-key")

	malformedData := json.RawMessage(`{"resourceType": "Patient"`)

	err := v.Validate("Patient", malformedData)
	if err == nil {
		t.Error("Expected error for bad request, got nil")
	}
}

// TestRemoteValidator_NoAPIKey tests validator without API key
func TestRemoteValidator_NoAPIKey(t *testing.T) {
	var receivedAPIKey string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedAPIKey = r.Header.Get("X-API-Key")
		w.WriteHeader(http.StatusOK)
		response := map[string]interface{}{
			"resourceType": "OperationOutcome",
			"issue":        []map[string]interface{}{},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Create validator without API key
	v := validator.NewRemoteValidator(server.URL, "")

	patientData := json.RawMessage(`{"resourceType": "Patient"}`)
	_ = v.Validate("Patient", patientData)

	if receivedAPIKey != "" {
		t.Errorf("Expected empty X-API-Key header when no key configured, got: %s", receivedAPIKey)
	}
}

// TestRemoteValidator_ConnectionError tests handling when validator server is unreachable
func TestRemoteValidator_ConnectionError(t *testing.T) {
	// Use an invalid URL that will fail to connect
	v := validator.NewRemoteValidator("http://localhost:99999", "test-api-key")

	patientData := json.RawMessage(`{"resourceType": "Patient"}`)

	err := v.Validate("Patient", patientData)
	if err == nil {
		t.Error("Expected error when connection fails, got nil")
	}
}

// TestRemoteValidator_MultipleErrorIssues tests handling of multiple validation errors
func TestRemoteValidator_MultipleErrorIssues(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/fhir+json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		response := map[string]interface{}{
			"resourceType": "OperationOutcome",
			"issue": []map[string]interface{}{
				{
					"severity":    "error",
					"code":        "required",
					"diagnostics": "Patient.name: minimum required = 1",
				},
				{
					"severity":    "error",
					"code":        "required",
					"diagnostics": "Patient.identifier: minimum required = 1",
				},
				{
					"severity":    "warning",
					"code":        "informational",
					"diagnostics": "Consider adding contact information",
				},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	v := validator.NewRemoteValidator(server.URL, "test-api-key")

	invalidPatient := json.RawMessage(`{"resourceType": "Patient"}`)

	err := v.Validate("Patient", invalidPatient)
	if err == nil {
		t.Error("Expected error for multiple validation issues, got nil")
	}
}