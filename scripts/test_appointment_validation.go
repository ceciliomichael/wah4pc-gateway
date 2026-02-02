//go:build ignore
// +build ignore

// Appointment Validation Test Script
// This script tests the Appointment push validation to ensure:
// - Participants must use logical identifiers (system + value)
// - Direct references without identifiers are rejected
//
// Prerequisites:
// - Gateway running at localhost:3040
// - At least two providers registered
//
// Usage: go run scripts/test_appointment_validation.go

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const (
	gatewayURL = "http://localhost:3040"
	masterKey  = "tcgtrio123"
)

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

var apiKey string

type testCase struct {
	name        string
	payload     map[string]interface{}
	expectError bool
	errorMsg    string
}

func main() {
	log.Println("========================================")
	log.Println("Appointment Validation Test Suite")
	log.Println("========================================")

	// Step 1: Bootstrap API key
	log.Println("\n[Setup] Creating API key...")
	var err error
	apiKey, err = bootstrapApiKey()
	if err != nil {
		log.Fatalf("Failed to bootstrap API key: %v", err)
	}
	log.Println("[Setup] API key created successfully")

	// Step 2: Register test providers
	log.Println("\n[Setup] Registering test providers...")
	senderID, targetID, err := setupProviders()
	if err != nil {
		log.Fatalf("Failed to setup providers: %v", err)
	}
	log.Printf("[Setup] Sender ID: %s", senderID)
	log.Printf("[Setup] Target ID: %s", targetID)

	// Step 3: Run test cases
	log.Println("\n========================================")
	log.Println("Running Appointment Validation Tests")
	log.Println("========================================")

	testCases := buildTestCases(senderID, targetID)

	passed := 0
	failed := 0

	for i, tc := range testCases {
		log.Printf("\n--- Test %d: %s ---", i+1, tc.name)
		success := runTestCase(tc)
		if success {
			passed++
			log.Printf("✓ PASSED: %s", tc.name)
		} else {
			failed++
			log.Printf("✗ FAILED: %s", tc.name)
		}
	}

	// Summary
	log.Println("\n========================================")
	log.Println("Test Summary")
	log.Println("========================================")
	log.Printf("Total: %d | Passed: %d | Failed: %d", len(testCases), passed, failed)

	if failed > 0 {
		log.Println("\n⚠ Some tests failed!")
	} else {
		log.Println("\n✓ All tests passed!")
	}
}

func buildTestCases(senderID, targetID string) []testCase {
	return []testCase{
		{
			name: "Valid Appointment with logical identifiers",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test valid appointment",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-001",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"identifier": map[string]interface{}{
									"system": "http://hospital-a.example.com/patients",
									"value":  "patient-123",
								},
							},
							"status": "needs-action",
						},
						{
							"actor": map[string]interface{}{
								"identifier": map[string]interface{}{
									"system": "http://hospital-a.example.com/practitioners",
									"value":  "dr-456",
								},
							},
							"status": "accepted",
						},
					},
				},
			},
			expectError: false,
		},
		{
			name: "Invalid Appointment - direct reference only (no identifier)",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test invalid appointment - direct reference",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-002",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"reference": "Patient/patient-123",
							},
							"status": "needs-action",
						},
					},
				},
			},
			expectError: true,
			errorMsg:    "must use a logical identifier",
		},
		{
			name: "Invalid Appointment - missing identifier system",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test invalid appointment - missing system",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-003",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"identifier": map[string]interface{}{
									"value": "patient-123",
								},
							},
							"status": "needs-action",
						},
					},
				},
			},
			expectError: true,
			errorMsg:    "must have both system and value",
		},
		{
			name: "Invalid Appointment - missing identifier value",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test invalid appointment - missing value",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-004",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"identifier": map[string]interface{}{
									"system": "http://hospital-a.example.com/patients",
								},
							},
							"status": "needs-action",
						},
					},
				},
			},
			expectError: true,
			errorMsg:    "must have both system and value",
		},
		{
			name: "Invalid Appointment - empty participants",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test invalid appointment - no participants",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-005",
					"status":       "proposed",
					"participant":  []map[string]interface{}{},
				},
			},
			expectError: true,
			errorMsg:    "must have at least one participant",
		},
		{
			name: "Invalid Appointment - second participant missing identifier",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test invalid appointment - mixed valid/invalid",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-006",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"identifier": map[string]interface{}{
									"system": "http://hospital-a.example.com/patients",
									"value":  "patient-123",
								},
							},
							"status": "needs-action",
						},
						{
							"actor": map[string]interface{}{
								"reference": "Practitioner/dr-456",
							},
							"status": "accepted",
						},
					},
				},
			},
			expectError: true,
			errorMsg:    "participant[1].actor must use a logical identifier",
		},
		{
			name: "Valid Appointment - reference with identifier (both present)",
			payload: map[string]interface{}{
				"senderId": senderID,
				"targetId": targetID,
				"reason":   "Test valid appointment - reference with identifier",
				"data": map[string]interface{}{
					"resourceType": "Appointment",
					"id":           "test-apt-007",
					"status":       "proposed",
					"participant": []map[string]interface{}{
						{
							"actor": map[string]interface{}{
								"reference": "Patient/patient-123",
								"identifier": map[string]interface{}{
									"system": "http://hospital-a.example.com/patients",
									"value":  "patient-123",
								},
							},
							"status": "needs-action",
						},
					},
				},
			},
			expectError: false,
		},
	}
}

func runTestCase(tc testCase) bool {
	resp, err := makeRequest(http.MethodPost, gatewayURL+"/api/v1/fhir/push/Appointment", tc.payload)
	if err != nil {
		log.Printf("  Request failed: %v", err)
		return false
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	prettyJSON, _ := json.MarshalIndent(result, "  ", "  ")
	log.Printf("  Response Status: %d", resp.StatusCode)
	log.Printf("  Response Body:\n  %s", string(prettyJSON))

	errMsg, _ := result["error"].(string)

	if tc.expectError {
		// Expecting a 400 Bad Request for business rule validation errors
		if resp.StatusCode == http.StatusBadRequest {
			// Check if error message contains expected text
			if tc.errorMsg != "" && !containsString(errMsg, tc.errorMsg) {
				log.Printf("  Expected error containing '%s', got '%s'", tc.errorMsg, errMsg)
				return false
			}
			return true
		}
		log.Printf("  Expected error response (400), got %d", resp.StatusCode)
		return false
	}

	// Expecting success - validation passed
	// Accept these status codes:
	// - 200 OK: Full success
	// - 502 Bad Gateway: Target unreachable (validation passed, target offline)
	// - 422 with "validator service unavailable": Business validation passed, but external FHIR validator is offline
	if resp.StatusCode == http.StatusOK {
		return true
	}
	if resp.StatusCode == http.StatusBadGateway {
		log.Printf("  Validation passed (target unreachable is expected in test)")
		return true
	}
	if resp.StatusCode == http.StatusUnprocessableEntity && containsString(errMsg, "validator service unavailable") {
		log.Printf("  Business validation passed (FHIR validator offline - not part of this test)")
		return true
	}

	log.Printf("  Expected success (200/502) or validator-unavailable (422), got %d", resp.StatusCode)
	return false
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > 0 && len(substr) > 0 && findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func bootstrapApiKey() (string, error) {
	payload := map[string]interface{}{
		"owner":     "Appointment Validation Test",
		"role":      "admin",
		"rateLimit": 1000,
	}

	resp, err := makeRequestWithAuth(http.MethodPost, gatewayURL+"/api/v1/apikeys", payload, masterKey, true)
	if err != nil {
		return "", fmt.Errorf("failed to create API key: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to create API key (status %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Success bool `json:"success"`
		Data    struct {
			Key string `json:"key"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode API key response: %w", err)
	}

	if result.Data.Key == "" {
		return "", fmt.Errorf("no API key returned in response")
	}

	return result.Data.Key, nil
}

func setupProviders() (senderID, targetID string, err error) {
	// Register sender provider
	senderPayload := map[string]string{
		"name":           "Test Sender Clinic",
		"type":           "clinic",
		"baseUrl":        "http://localhost:9999",
		"gatewayAuthKey": "test-auth-key",
	}

	resp, err := makeRequest(http.MethodPost, gatewayURL+"/api/v1/providers", senderPayload)
	if err != nil {
		return "", "", fmt.Errorf("failed to register sender: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("failed to register sender (status %d): %s", resp.StatusCode, string(body))
	}

	var senderResult map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&senderResult)
	if data, ok := senderResult["data"].(map[string]interface{}); ok {
		senderID = data["id"].(string)
	}

	// Register target provider
	targetPayload := map[string]string{
		"name":           "Test Target Hospital",
		"type":           "hospital",
		"baseUrl":        "http://localhost:9998",
		"gatewayAuthKey": "test-auth-key",
	}

	resp2, err := makeRequest(http.MethodPost, gatewayURL+"/api/v1/providers", targetPayload)
	if err != nil {
		return "", "", fmt.Errorf("failed to register target: %w", err)
	}
	defer resp2.Body.Close()

	if resp2.StatusCode != http.StatusCreated && resp2.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp2.Body)
		return "", "", fmt.Errorf("failed to register target (status %d): %s", resp2.StatusCode, string(body))
	}

	var targetResult map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&targetResult)
	if data, ok := targetResult["data"].(map[string]interface{}); ok {
		targetID = data["id"].(string)
	}

	return senderID, targetID, nil
}

func makeRequestWithAuth(method, url string, body interface{}, authKey string, useMasterKey bool) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if useMasterKey {
		req.Header.Set("X-Master-Key", authKey)
	} else {
		req.Header.Set("X-API-Key", authKey)
	}

	return httpClient.Do(req)
}

func makeRequest(method, url string, body interface{}) (*http.Response, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key not initialized")
	}
	return makeRequestWithAuth(method, url, body, apiKey, false)
}