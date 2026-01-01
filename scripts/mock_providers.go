//go:build ignore
// +build ignore

// Mock Provider Simulation Script
// This script simulates two healthcare providers for testing the gateway:
// - Clinic A (Requester): Requests patient data
// - Hospital B (Source): Provides patient data
//
// Usage: go run scripts/mock_providers.go

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

const (
	gatewayURL    = "http://localhost:8080"
	clinicAPort   = ":9001"
	hospitalBPort = ":9002"
	masterKey     = "tcgtrio123" // Master key for initial API key creation only
)

// httpClient is a shared client for making authenticated requests
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

// apiKey holds the generated API key for authenticated requests
var apiKey string

// bootstrapApiKey creates an admin API key using the master key
// This demonstrates the full authentication lifecycle
func bootstrapApiKey() (string, error) {
	log.Println("[Auth] Creating API key using master key...")

	payload := map[string]interface{}{
		"owner":     "Simulation Script",
		"role":      "admin",
		"rateLimit": 1000,
	}

	// Use master key to create the API key
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
			ID     string `json:"id"`
			Key    string `json:"key"`
			Prefix string `json:"prefix"`
			Owner  string `json:"owner"`
			Role   string `json:"role"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode API key response: %w", err)
	}

	if result.Data.Key == "" {
		return "", fmt.Errorf("no API key returned in response")
	}

	log.Printf("[Auth] API key created successfully!")
	log.Printf("[Auth]   ID: %s", result.Data.ID)
	log.Printf("[Auth]   Prefix: %s", result.Data.Prefix)
	log.Printf("[Auth]   Owner: %s", result.Data.Owner)
	log.Printf("[Auth]   Role: %s", result.Data.Role)

	return result.Data.Key, nil
}

// makeRequestWithAuth creates and executes an HTTP request with specified authentication
// useMasterKey: if true, uses X-Master-Key header; if false, uses X-API-Key header
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

// makeRequest creates and executes an authenticated HTTP request using the API key
func makeRequest(method, url string, body interface{}) (*http.Response, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key not initialized - call bootstrapApiKey first")
	}
	return makeRequestWithAuth(method, url, body, apiKey, false)
}

// Mock FHIR Patient resource
var mockPatientData = map[string]interface{}{
	"resourceType": "Patient",
	"id":           "pat-123",
	"meta": map[string]interface{}{
		"versionId":   "1",
		"lastUpdated": time.Now().Format(time.RFC3339),
	},
	"identifier": []map[string]interface{}{
		{
			"system": "http://hospital-b.example.com/patients",
			"value":  "pat-123",
		},
	},
	"active": true,
	"name": []map[string]interface{}{
		{
			"use":    "official",
			"family": "Dela Cruz",
			"given":  []string{"Juan", "Santos"},
		},
	},
	"gender":    "male",
	"birthDate": "1990-05-15",
	"address": []map[string]interface{}{
		{
			"use":        "home",
			"city":       "Manila",
			"country":    "PH",
			"postalCode": "1000",
		},
	},
}

func main() {
	var wg sync.WaitGroup

	// Start mock providers
	wg.Add(2)
	go startClinicA(&wg)
	go startHospitalB(&wg)

	// Wait for servers to start
	time.Sleep(time.Second)

	log.Println("\n========================================")
	log.Println("Mock Providers Started!")
	log.Println("========================================")
	log.Printf("Clinic A (Requester): http://localhost%s", clinicAPort)
	log.Printf("Hospital B (Source):  http://localhost%s", hospitalBPort)
	log.Println("========================================")

	// Run simulation
	runSimulation()

	// Keep servers running
	wg.Wait()
}

// startClinicA starts the mock Clinic A server (the requester)
func startClinicA(wg *sync.WaitGroup) {
	defer wg.Done()

	mux := http.NewServeMux()

	// Endpoint to receive results from gateway
	mux.HandleFunc("/fhir/receive-results", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[Clinic A] Received data from Gateway!")

		body, _ := io.ReadAll(r.Body)
		var payload map[string]interface{}
		json.Unmarshal(body, &payload)

		prettyJSON, _ := json.MarshalIndent(payload, "", "  ")
		log.Printf("[Clinic A] Data received:\n%s\n", string(prettyJSON))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "received"})
	})

	log.Printf("[Clinic A] Starting server on %s...", clinicAPort)
	if err := http.ListenAndServe(clinicAPort, mux); err != nil {
		log.Fatalf("[Clinic A] Server failed: %v", err)
	}
}

// startHospitalB starts the mock Hospital B server (the data source)
func startHospitalB(wg *sync.WaitGroup) {
	defer wg.Done()

	mux := http.NewServeMux()

	// Endpoint to process queries from gateway
	mux.HandleFunc("/fhir/process-query", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[Hospital B] Received query from Gateway!")

		body, _ := io.ReadAll(r.Body)
		var payload struct {
			TransactionID string `json:"transactionId"`
			RequesterID   string `json:"requesterId"`
			Identifiers   []struct {
				System string `json:"system"`
				Value  string `json:"value"`
			} `json:"identifiers"`
			GatewayReturnURL string `json:"gatewayReturnUrl"`
		}
		json.Unmarshal(body, &payload)

		log.Printf("[Hospital B] Query details:")
		log.Printf("  Transaction ID: %s", payload.TransactionID)
		log.Printf("  Requester: %s", payload.RequesterID)
		log.Printf("  Identifiers: %d identifier(s)", len(payload.Identifiers))
		for i, id := range payload.Identifiers {
			log.Printf("    [%d] System: %s, Value: %s", i+1, id.System, id.Value)
		}
		log.Printf("  Return URL: %s", payload.GatewayReturnURL)

		// Acknowledge receipt
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "processing"})

		// Simulate async processing and send data back to gateway
		go func() {
			time.Sleep(500 * time.Millisecond) // Simulate processing time

			log.Println("[Hospital B] Sending patient data to Gateway...")

			dataJSON, _ := json.Marshal(mockPatientData)
			responsePayload := map[string]interface{}{
				"transactionId": payload.TransactionID,
				"status":        "SUCCESS",
				"data":          json.RawMessage(dataJSON),
			}

			// Use authenticated request to send data back to gateway
			resp, err := makeRequest(http.MethodPost, payload.GatewayReturnURL, responsePayload)
			if err != nil {
				log.Printf("[Hospital B] Failed to send data: %v", err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				log.Printf("[Hospital B] Data sent successfully! Status: %d", resp.StatusCode)
			} else {
				body, _ := io.ReadAll(resp.Body)
				log.Printf("[Hospital B] Failed to send data (status %d): %s", resp.StatusCode, string(body))
			}
		}()
	})

	log.Printf("[Hospital B] Starting server on %s...", hospitalBPort)
	if err := http.ListenAndServe(hospitalBPort, mux); err != nil {
		log.Fatalf("[Hospital B] Server failed: %v", err)
	}
}

// runSimulation registers providers and initiates a FHIR transfer
func runSimulation() {
	log.Println("")
	log.Println("--- Starting Simulation ---")

	// Step 1: Bootstrap API Key (demonstrates full auth lifecycle)
	log.Println("\n[Simulation] Step 1: Creating API Key...")
	var err error
	apiKey, err = bootstrapApiKey()
	if err != nil {
		log.Fatalf("Failed to bootstrap API key: %v", err)
	}
	log.Println("[Simulation] API Key created - all subsequent requests will use X-API-Key header")

	// Step 2: Register Clinic A
	log.Println("\n[Simulation] Step 2: Registering Clinic A...")
	clinicA := registerProvider("Clinic A", "clinic", fmt.Sprintf("http://localhost%s", clinicAPort))
	if clinicA == nil {
		log.Fatal("Failed to register Clinic A")
	}
	log.Printf("[Simulation] Clinic A registered with ID: %s\n", clinicA["id"])

	// Step 3: Register Hospital B
	log.Println("\n[Simulation] Step 3: Registering Hospital B...")
	hospitalB := registerProvider("Hospital B", "hospital", fmt.Sprintf("http://localhost%s", hospitalBPort))
	if hospitalB == nil {
		log.Fatal("Failed to register Hospital B")
	}
	log.Printf("[Simulation] Hospital B registered with ID: %s\n", hospitalB["id"])

	// Step 4: Initiate FHIR transfer request
	time.Sleep(500 * time.Millisecond)
	log.Println("\n[Simulation] Step 4: Initiating FHIR Patient transfer...")
	log.Printf("[Simulation] From: Hospital B -> To: Clinic A")

	requestPayload := map[string]interface{}{
		"requesterId": clinicA["id"],
		"targetId":    hospitalB["id"],
		"identifiers": []map[string]string{
			{
				"system": "http://hospital-b.com/mrn",
				"value":  "pat-123",
			},
		},
		"reason": "Patient referral",
		"notes":  "Requesting complete patient record for treatment",
	}

	resp, err := makeRequest(http.MethodPost, gatewayURL+"/api/v1/fhir/request/Patient", requestPayload)
	if err != nil {
		log.Fatalf("[Simulation] Failed to initiate request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("[Simulation] Failed to initiate FHIR request (status %d): %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	prettyJSON, _ := json.MarshalIndent(result, "", "  ")
	log.Printf("[Simulation] Gateway response:\n%s\n", string(prettyJSON))

	// Wait for async flow to complete
	time.Sleep(2 * time.Second)

	// Step 5: Check transaction status
	if data, ok := result["data"].(map[string]interface{}); ok {
		if txID, ok := data["id"].(string); ok {
			log.Println("\n[Simulation] Step 5: Checking transaction status...")
			checkTransaction(txID)
		}
	}

	log.Println("\n--- Simulation Complete ---")
	log.Println("Mock providers will continue running. Press Ctrl+C to stop.")
}

// registerProvider registers a provider with the gateway
func registerProvider(name, providerType, baseURL string) map[string]interface{} {
	payload := map[string]string{
		"name":    name,
		"type":    providerType,
		"baseUrl": baseURL,
	}

	resp, err := makeRequest(http.MethodPost, gatewayURL+"/api/v1/providers", payload)
	if err != nil {
		log.Printf("Failed to register provider: %v", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to register provider (status %d): %s", resp.StatusCode, string(body))
		return nil
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if data, ok := result["data"].(map[string]interface{}); ok {
		return data
	}

	return nil
}

// checkTransaction retrieves and displays transaction status
func checkTransaction(txID string) {
	resp, err := makeRequest(http.MethodGet, gatewayURL+"/api/v1/transactions/"+txID, nil)
	if err != nil {
		log.Printf("Failed to get transaction: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to get transaction (status %d): %s", resp.StatusCode, string(body))
		return
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	prettyJSON, _ := json.MarshalIndent(result, "", "  ")
	log.Printf("[Simulation] Transaction status:\n%s\n", string(prettyJSON))
}
