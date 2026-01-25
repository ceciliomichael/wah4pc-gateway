package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/validator"
)

// Integration tests require the wah4pc-validator service to be running
// Run with: VALIDATOR_URL=http://localhost:8080 VALIDATOR_API_KEY=your-key go test -v ./test/... -run Integration

const (
	defaultValidatorURL = "http://localhost:8080"
)

func getValidatorURL() string {
	if url := os.Getenv("VALIDATOR_URL"); url != "" {
		return url
	}
	return defaultValidatorURL
}

func getValidatorAPIKey() string {
	return os.Getenv("VALIDATOR_API_KEY")
}

// checkValidatorHealth verifies the validator service is running
func checkValidatorHealth(url string) error {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url + "/health")
	if err != nil {
		return fmt.Errorf("validator not reachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("validator not ready: status=%d, body=%s", resp.StatusCode, string(body))
	}
	return nil
}

// TestIntegration_ValidatorHealth checks if the validator service is running
func TestIntegration_ValidatorHealth(t *testing.T) {
	url := getValidatorURL()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	t.Logf("✓ Validator service is healthy at %s", url)
}

// TestIntegration_ValidPatient tests validation of a valid PH Core Patient resource
func TestIntegration_ValidPatient(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	v := validator.NewRemoteValidator(url, apiKey)

	// Valid PH Core Patient with required fields
	validPatient := json.RawMessage(`{
		"resourceType": "Patient",
		"id": "integration-test-patient",
		"meta": {
			"profile": ["http://example.org/fhir/StructureDefinition/ph-core-patient"]
		},
		"identifier": [
			{
				"system": "http://philhealth.gov.ph/id",
				"value": "123456789012"
			}
		],
		"name": [
			{
				"use": "official",
				"family": "Dela Cruz",
				"given": ["Juan", "Santos"]
			}
		],
		"gender": "male",
		"birthDate": "1990-05-15",
		"address": [
			{
				"use": "home",
				"city": "Manila",
				"country": "PH"
			}
		]
	}`)

	err := v.Validate("Patient", validPatient)
	if err != nil {
		t.Logf("Validation result (may have warnings): %v", err)
	} else {
		t.Log("✓ Valid Patient resource passed validation")
	}
}

// TestIntegration_InvalidPatient tests validation catches errors in invalid resources
func TestIntegration_InvalidPatient(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	v := validator.NewRemoteValidator(url, apiKey)

	// Invalid Patient - completely empty, missing required fields
	invalidPatient := json.RawMessage(`{
		"resourceType": "Patient"
	}`)

	err := v.Validate("Patient", invalidPatient)
	if err != nil {
		t.Logf("✓ Invalid Patient correctly rejected: %v", err)
	} else {
		t.Log("⚠ Warning: Empty Patient was accepted (validator may be lenient)")
	}
}

// TestIntegration_MalformedResource tests validation of malformed JSON
func TestIntegration_MalformedResource(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	v := validator.NewRemoteValidator(url, apiKey)

	// Invalid resource type
	invalidResource := json.RawMessage(`{
		"resourceType": "InvalidResourceType",
		"id": "test"
	}`)

	err := v.Validate("InvalidResourceType", invalidResource)
	if err != nil {
		t.Logf("✓ Invalid resource type correctly rejected: %v", err)
	} else {
		t.Error("✗ Expected error for invalid resource type")
	}
}

// TestIntegration_DirectEndpointCall tests the validator endpoint directly (bypassing RemoteValidator)
func TestIntegration_DirectEndpointCall(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	// Create a simple Patient resource
	patient := map[string]interface{}{
		"resourceType": "Patient",
		"id":           "direct-test",
		"name": []map[string]interface{}{
			{"family": "Test", "given": []string{"Direct"}},
		},
	}

	body, _ := json.Marshal(patient)

	req, err := http.NewRequest(http.MethodPost, url+"/validateResource", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/fhir+json")
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	t.Logf("Direct endpoint response:")
	t.Logf("  Status: %d", resp.StatusCode)
	t.Logf("  Body: %s", string(respBody))

	if resp.StatusCode == http.StatusOK {
		t.Log("✓ Direct endpoint call successful")
	} else if resp.StatusCode == http.StatusUnauthorized {
		t.Log("⚠ Unauthorized - check VALIDATOR_API_KEY environment variable")
	} else {
		t.Logf("⚠ Unexpected status code: %d", resp.StatusCode)
	}
}

// TestIntegration_ValidEncounter tests validation of an Encounter resource
func TestIntegration_ValidEncounter(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	v := validator.NewRemoteValidator(url, apiKey)

	encounter := json.RawMessage(`{
		"resourceType": "Encounter",
		"id": "integration-test-encounter",
		"status": "finished",
		"class": {
			"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
			"code": "AMB",
			"display": "ambulatory"
		},
		"subject": {
			"reference": "Patient/integration-test-patient"
		},
		"period": {
			"start": "2024-01-15T09:00:00Z",
			"end": "2024-01-15T10:00:00Z"
		}
	}`)

	err := v.Validate("Encounter", encounter)
	if err != nil {
		t.Logf("Encounter validation result: %v", err)
	} else {
		t.Log("✓ Encounter resource passed validation")
	}
}

// TestIntegration_ValidObservation tests validation of an Observation resource
func TestIntegration_ValidObservation(t *testing.T) {
	url := getValidatorURL()
	apiKey := getValidatorAPIKey()

	if err := checkValidatorHealth(url); err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	v := validator.NewRemoteValidator(url, apiKey)

	observation := json.RawMessage(`{
		"resourceType": "Observation",
		"id": "integration-test-observation",
		"status": "final",
		"code": {
			"coding": [
				{
					"system": "http://loinc.org",
					"code": "85354-9",
					"display": "Blood pressure panel"
				}
			]
		},
		"subject": {
			"reference": "Patient/integration-test-patient"
		},
		"effectiveDateTime": "2024-01-15T09:30:00Z",
		"component": [
			{
				"code": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "8480-6",
							"display": "Systolic blood pressure"
						}
					]
				},
				"valueQuantity": {
					"value": 120,
					"unit": "mmHg",
					"system": "http://unitsofmeasure.org",
					"code": "mm[Hg]"
				}
			},
			{
				"code": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "8462-4",
							"display": "Diastolic blood pressure"
						}
					]
				},
				"valueQuantity": {
					"value": 80,
					"unit": "mmHg",
					"system": "http://unitsofmeasure.org",
					"code": "mm[Hg]"
				}
			}
		]
	}`)

	err := v.Validate("Observation", observation)
	if err != nil {
		t.Logf("Observation validation result: %v", err)
	} else {
		t.Log("✓ Observation resource passed validation")
	}
}