Integration Guide

# Provider Integration

Complete guide to connect your healthcare system with the WAH4PC Gateway. Learn what endpoints you need to implement, how to handle patient identifiers, and best practices for seamless integration.

## Prerequisites

- Publicly Accessible Base URL
Your backend must be reachable from the internet (e.g., https://api.yourorganization.com)
- HTTPS Enabled
All endpoints must use HTTPS for secure communication
- Gateway Auth Key
Generate a secure secret key that the Gateway will use to authenticate when calling your webhooks
- Webhook Endpoints
You must implement two webhook endpoints that the gateway will call
- FHIR-Compatible Data
Your system should be able to produce and consume FHIR resources
- Patient Identifier Mapping
Ability to match patients by PhilHealth ID, MRN, or other FHIR identifiers

## Integration Flow Overview

The diagram below shows the complete integration flow, including registration, requesting data, and providing data to other providers.

integration_flow.mmd

#### End-to-End Integration Flow

1
## Register Your Organization

Before exchanging data, register your organization with the gateway. This creates a provider record and allows other providers to discover you.

### Registration Request

POST`http://localhost:8080/api/v1/providers`

Required Headers

X-API-Key: wah_your-api-key

Request Body

{

"name":"Example Hospital",

"type":"hospital",

"baseUrl":"https://your-api.example.com"

}

Supported Provider Types

clinichospitallaboratorypharmacy

Response (201 Created)

{

"id":"550e8400-e29b-41d4-a716-446655440000",

"name":"Example Hospital",

"type":"hospital",

"baseUrl":"https://your-api.example.com",

"createdAt":"2024-01-15T10:30:00Z",

"updatedAt":"2024-01-15T10:30:00Z"

}

**Important:** Save your `id` — you'll need it when making requests to the gateway.

2
## Implement Webhook Endpoints

The gateway communicates with your system via webhooks. You must implement two endpoints on your backend that the gateway will call.

webhooks.mmd

#### Webhook Interaction Pattern

### Webhook 1: Process Query

Called when another provider requests data from you

POST`{your_base_url}/fhir/process-query`

Incoming Request from Gateway

{

"transactionId":"txn-uuid-from-gateway",

"requesterId":"requesting-provider-uuid",

"identifiers":

[

{

"system":"http://philhealth.gov.ph",

"value":"12-345678901-2"

},

{

"system":"http://your-hospital.com/mrn",

"value":"MRN-12345"

}

],

"resourceType":"Patient",

"gatewayReturnUrl":"http://localhost:8080/api/v1/fhir/receive/Patient",

"reason":"Referral consultation",

"notes":"Patient requires urgent cardiac evaluation"

}

#### Implementation Requirements

1. 1.
Acknowledge the request immediately with `200 OK`
2. 2.
Match patient using the `identifiers` array (PhilHealth ID, MRN, etc.)
3. 3.
Format the data as a FHIR resource
4. 4.
POST the data to the `gatewayReturnUrl`

Your Response to Gateway (send to gatewayReturnUrl)

{

"error":"Invalid JSON",

"raw":"POST {gatewayReturnUrl} Headers: Content-Type: application/json X-Provider-ID: your-provider-uuid X-API-Key: your-api-key Body: { "transactionId": "txn-uuid-from-gateway", "status": "SUCCESS", "data": { "resourceType": "Patient", "id": "patient-123", "identifier": [ { "system": "http://philhealth.gov.ph", "value": "12-345678901-2" } ], "name": [{ "family": "Dela Cruz", "given": ["Juan"] }], "birthDate": "1990-05-15", "gender": "male" } }"

}

### Webhook 2: Receive Results

Called when you requested data and it's now available

POST`{your_base_url}/fhir/receive-results`

Incoming Data from Gateway

{

"transactionId":"your-original-transaction-id",

"status":"SUCCESS",

"data":

{

"resourceType":"Patient",

"id":"patient-123",

"identifier":

[

{

"system":"http://philhealth.gov.ph",

"value":"12-345678901-2"

}

],

"name":

[

{

"family":"Dela Cruz",

"given":

[

"Juan"

]

}

],

"birthDate":"1990-05-15",

"gender":"male"

}

}

#### Implementation Requirements

1. 1.
Validate the `transactionId` matches a pending request
2. 2.
Store or process the received FHIR data
3. 3.
Respond with `200 OK` to confirm receipt

Your Response

{

"message":"Data received successfully"

}

## Understanding Patient Identifiers

The gateway uses FHIR-compliant identifiers to match patients across different healthcare systems. Each identifier has a `system` (the namespace/authority) and a `value` (the actual ID).

### Common Identifier Systems

| System URI | Description | Example Value |
| --- | --- | --- |
| http://philhealth.gov.ph | PhilHealth Member ID | 12-345678901-2 |
| http://psa.gov.ph/birth-certificate | PSA Birth Certificate Number | 1234-5678-9012-3456 |
| http://your-hospital.com/mrn | Your Hospital's MRN | MRN-12345 |
| http://hl7.org/fhir/sid/passport | Passport Number | P123456789 |

**Matching Logic:** When you receive a query, try to match patients using ANY of the provided identifiers. A patient may have multiple IDs - match on whichever one exists in your system.

3
## Request Data from Other Providers

Once registered, you can request FHIR resources from any other registered provider.

### Initiate a Query

POST`http://localhost:8080/api/v1/fhir/request/Patient`

Required Headers

X-API-Key: wah_your-api-key

X-Provider-ID: your-provider-id

Idempotency-Key: uuid-v4-for-safe-retries

Request Body

{

"requesterId":"your-provider-uuid",

"targetId":"target-provider-uuid",

"identifiers":

[

{

"system":"http://philhealth.gov.ph",

"value":"12-345678901-2"

}

],

"reason":"Referral consultation",

"notes":"Need latest lab results"

}

Response (202 Accepted)

{

"success":true,

"data":

{

"id":"transaction-uuid",

"requesterId":"your-provider-uuid",

"targetId":"target-provider-uuid",

"identifiers":

[

{

"system":"http://philhealth.gov.ph",

"value":"12-345678901-2"

}

],

"resourceType":"Patient",

"status":"PENDING",

"metadata":

{

"reason":"Referral consultation",

"notes":"Need latest lab results"

},

"createdAt":"2024-01-15T11:00:00Z",

"updatedAt":"2024-01-15T11:00:00Z"

}

}

**What happens next:** The gateway forwards your request to the target provider. When they respond, the gateway will call your `/fhir/receive-results` endpoint with the data.

## Best Practices

### Respond Immediately (200 OK)

Always acknowledge webhook requests within 5 seconds. Process data asynchronously to avoid timeouts.

### Use Idempotency Keys

Generate a UUID v4 for each request and include it in the Idempotency-Key header. Reuse the same key when retrying failed requests. Keys are cached for 24 hours.

### Handle Duplicate Detection

The gateway prevents identical requests (same requester, target, identifiers) within 5 minutes. Handle 429 errors gracefully and avoid immediate retries.

### Handle 409 Conflict

If you receive 409, your previous request with the same Idempotency-Key is still processing. Wait and retry after a short delay.

### Log Everything

Log all incoming requests and outgoing responses with transaction IDs for debugging and auditing.

### Use a Job Queue

For production, use Redis/RabbitMQ to queue processing jobs instead of spawning threads directly.

## Common Pitfalls to Avoid

### Blocking the Webhook Response

Don't fetch data from your database before responding 200 OK. The gateway has a timeout and will retry.

### Ignoring REJECTED Status

When a provider can't find the patient, they should return status: 'REJECTED', not just fail silently.

### Hardcoding Identifiers

Don't assume all patients have a PhilHealth ID. Match on ANY identifier in the array that exists in your system.

### Missing Error Handling

If your database query fails, catch the error and send status: 'ERROR' to the gateway with details.

## Security Considerations

### Validate X-Gateway-Auth Header

Verify the X-Gateway-Auth header matches your Gateway Auth Key to ensure requests are from the legitimate gateway.

### Validate X-Provider-ID Header

When receiving callbacks, check the X-Provider-ID header matches the expected sender.

### Verify Transaction IDs

Only process results for transaction IDs you initiated. Reject unknown transactions.

### Use HTTPS Only

All communication must use HTTPS. The gateway will reject HTTP base URLs.

### Implement Rate Limiting

Protect your endpoints from abuse by implementing rate limiting on webhooks.

## Complete Webhook Implementation

Production-ready examples with validation, error handling, logging, and proper async patterns.

```
// ============================================================================
// WAH4PC Gateway Integration - Node.js/TypeScript
// Production-ready webhook handlers with validation and error handling
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Identifier {
  system: string;
  value: string;
}

interface ProcessQueryPayload {
  transactionId: string;
  requesterId: string;
  identifiers: Identifier[];
  resourceType: string;
  gatewayReturnUrl: string;
  reason?: string;   // Optional: Purpose of the request
  notes?: string;    // Optional: Additional context for the target provider
}

interface ReceiveResultsPayload {
  transactionId: string;
  status: 'SUCCESS' | 'REJECTED' | 'ERROR';
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas (using Zod)
// ─────────────────────────────────────────────────────────────────────────────

const IdentifierSchema = z.object({
  system: z.string().url(),
  value: z.string().min(1),
});

const ProcessQuerySchema = z.object({
  transactionId: z.string().uuid(),
  requesterId: z.string().uuid(),
  identifiers: z.array(IdentifierSchema).min(1),
  resourceType: z.string(),
  gatewayReturnUrl: z.string().url(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const ReceiveResultsSchema = z.object({
  transactionId: z.string().uuid(),
  status: z.enum(['SUCCESS', 'REJECTED', 'ERROR']),
  data: z.record(z.unknown()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Request Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateSchema<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error('[Validation Error]', result.error.flatten());
      return res.status(400).json({
        error: 'Invalid request payload',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

function validateGatewayAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-gateway-auth'];
  const expectedKey = process.env.GATEWAY_AUTH_KEY;

  if (!expectedKey) {
    // No key configured - allow (backward compatibility)
    return next();
  }

  if (authHeader !== expectedKey) {
    console.error('[Auth Error] Invalid or missing X-Gateway-Auth header');
    return res.status(401).json({
      error: 'Unauthorized - Invalid gateway authentication',
    });
  }

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Functions (implement these for your system)
// ─────────────────────────────────────────────────────────────────────────────

async function findPatientByIdentifiers(identifiers: Identifier[]) {
  // Try each identifier until we find a match
  for (const id of identifiers) {
    const patient = await db.patients.findFirst({
      where: {
        OR: [
          { philhealthId: id.system.includes('philhealth') ? id.value : undefined },
          { mrn: id.system.includes('/mrn') ? id.value : undefined },
          // Add more identifier types as needed
        ],
      },
    });
    if (patient) return patient;
  }
  return null;
}

async function storePendingTransaction(transactionId: string, data: unknown) {
  await db.pendingTransactions.create({
    data: { transactionId, status: 'PENDING', createdAt: new Date() },
  });
}

async function storeReceivedData(transactionId: string, data: unknown) {
  await db.receivedData.create({
    data: { transactionId, fhirData: JSON.stringify(data), receivedAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query (when another provider requests data from you)
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  '/fhir/process-query',
  validateGatewayAuth,
  validateSchema(ProcessQuerySchema),
  async (req: Request, res: Response) => {
    const { transactionId, identifiers, gatewayReturnUrl, reason, notes } = req.body as ProcessQueryPayload;

    console.log(`[Process Query] Transaction: ${transactionId}`);
    console.log(`[Process Query] Identifiers: ${JSON.stringify(identifiers)}`);
    if (reason) console.log(`[Process Query] Reason: ${reason}`);
    if (notes) console.log(`[Process Query] Notes: ${notes}`);

    // IMPORTANT: Acknowledge immediately (Gateway expects quick response)
    res.status(200).json({ message: 'Processing' });

    // Process asynchronously
    setImmediate(async () => {
      try {
        // 1. Find patient by any matching identifier
        const patient = await findPatientByIdentifiers(identifiers);

        let responsePayload;
        if (!patient) {
          // Patient not found - send REJECTED status
          responsePayload = {
            transactionId,
            status: 'REJECTED',
            data: {
              error: 'Patient not found',
              searchedIdentifiers: identifiers,
            },
          };
        } else {
          // Patient found - format as FHIR resource
          responsePayload = {
            transactionId,
            status: 'SUCCESS',
            data: {
              resourceType: 'Patient',
              id: patient.id,
              identifier: identifiers.filter(id =>
                patient.philhealthId === id.value || patient.mrn === id.value
              ),
              name: [{ family: patient.lastName, given: [patient.firstName] }],
              birthDate: patient.birthDate,
              gender: patient.gender,
            },
          };
        }

        // 2. Send response to gateway (with Idempotency-Key for safe retries)
        const idempotencyKey = crypto.randomUUID();
        const response = await fetch(gatewayReturnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.WAH4PC_API_KEY!,
            'X-Provider-ID': process.env.WAH4PC_PROVIDER_ID!,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(responsePayload),
        });

        if (!response.ok) {
          console.error(`[Process Query] Gateway callback failed: ${response.status}`);
        } else {
          console.log(`[Process Query] Successfully sent response for ${transactionId}`);
        }
      } catch (error) {
        console.error(`[Process Query] Error processing ${transactionId}:`, error);
        // Optionally send error status to gateway
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results (when data you requested is available)
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  '/fhir/receive-results',
  validateGatewayAuth,
  validateSchema(ReceiveResultsSchema),
  async (req: Request, res: Response) => {
    const { transactionId, status, data } = req.body as ReceiveResultsPayload;

    console.log(`[Receive Results] Transaction: ${transactionId}, Status: ${status}`);

    try {
      // 1. Verify this transaction was initiated by us
      const pending = await db.pendingTransactions.findUnique({
        where: { transactionId },
      });

      if (!pending) {
        console.warn(`[Receive Results] Unknown transaction: ${transactionId}`);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // 2. Store the received data
      await storeReceivedData(transactionId, data);

      // 3. Update transaction status
      await db.pendingTransactions.update({
        where: { transactionId },
        data: { status: status, completedAt: new Date() },
      });

      console.log(`[Receive Results] Stored data for ${transactionId}`);
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      console.error(`[Receive Results] Error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables Required
// ─────────────────────────────────────────────────────────────────────────────
// WAH4PC_API_KEY=wah_your-api-key-here
// WAH4PC_PROVIDER_ID=your-provider-uuid
// WAH4PC_GATEWAY_URL=http://localhost:8080
// GATEWAY_AUTH_KEY=your-secret-gateway-auth-key (set when registering provider)

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

```
// ============================================================================
// WAH4PC Gateway Integration - Go
// Production-ready webhook handlers with validation and error handling
// ============================================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

type Identifier struct {
	System string `json:"system" validate:"required,url"`
	Value  string `json:"value" validate:"required"`
}

type ProcessQueryRequest struct {
	TransactionID    string       `json:"transactionId" validate:"required,uuid"`
	RequesterID      string       `json:"requesterId" validate:"required,uuid"`
	Identifiers      []Identifier `json:"identifiers" validate:"required,min=1,dive"`
	ResourceType     string       `json:"resourceType" validate:"required"`
	GatewayReturnURL string       `json:"gatewayReturnUrl" validate:"required,url"`
	Reason           string       `json:"reason,omitempty"`  // Optional: Purpose of the request
	Notes            string       `json:"notes,omitempty"`   // Optional: Additional context
}

type ReceiveResultsRequest struct {
	TransactionID string                 `json:"transactionId" validate:"required,uuid"`
	Status        string                 `json:"status" validate:"required,oneof=SUCCESS REJECTED ERROR"`
	Data          map[string]interface{} `json:"data"`
}

type GatewayResponse struct {
	TransactionID string      `json:"transactionId"`
	Status        string      `json:"status"`
	Data          interface{} `json:"data,omitempty"`
}

type FHIRPatient struct {
	ResourceType string       `json:"resourceType"`
	ID           string       `json:"id"`
	Identifier   []Identifier `json:"identifier"`
	Name         []HumanName  `json:"name"`
	BirthDate    string       `json:"birthDate"`
	Gender       string       `json:"gender"`
}

type HumanName struct {
	Family string   `json:"family"`
	Given  []string `json:"given"`
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

type Config struct {
	APIKey     string
	ProviderID string
	GatewayURL string
}

func loadConfig() Config {
	return Config{
		APIKey:     os.Getenv("WAH4PC_API_KEY"),
		ProviderID: os.Getenv("WAH4PC_PROVIDER_ID"),
		GatewayURL: os.Getenv("WAH4PC_GATEWAY_URL"),
	}
}

var config = loadConfig()

// ─────────────────────────────────────────────────────────────────────────────
// Database Functions (implement these for your system)
// ─────────────────────────────────────────────────────────────────────────────

func findPatientByIdentifiers(identifiers []Identifier) (*FHIRPatient, error) {
	// Try each identifier until we find a match
	for _, id := range identifiers {
		// Query your database here
		// patient, err := db.FindPatientByIdentifier(id.System, id.Value)
		// if err == nil && patient != nil {
		//     return convertToFHIR(patient), nil
		// }
	}
	return nil, nil // Not found
}

func storePendingTransaction(transactionID string) error {
	// Store in your database
	return nil
}

func storeReceivedData(transactionID string, data map[string]interface{}) error {
	// Store in your database
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

func validateGatewayAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expectedKey := os.Getenv("GATEWAY_AUTH_KEY")

		// If no key configured, allow (backward compatibility)
		if expectedKey == "" {
			next(w, r)
			return
		}

		authHeader := r.Header.Get("X-Gateway-Auth")
		if authHeader != expectedKey {
			log.Printf("[Auth Error] Invalid or missing X-Gateway-Auth header")
			http.Error(w, "Unauthorized - Invalid gateway authentication", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query Handler
// ─────────────────────────────────────────────────────────────────────────────

func handleProcessQuery(w http.ResponseWriter, r *http.Request) {
	var req ProcessQueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Process Query] Invalid JSON: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.TransactionID == "" || len(req.Identifiers) == 0 {
		log.Printf("[Process Query] Missing required fields")
		http.Error(w, "Missing transactionId or identifiers", http.StatusBadRequest)
		return
	}

	log.Printf("[Process Query] Transaction: %s, Identifiers: %d",
		req.TransactionID, len(req.Identifiers))

	// IMPORTANT: Acknowledge immediately
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Processing"})

	// Process asynchronously
	go func() {
		// Find patient by identifiers
		patient, err := findPatientByIdentifiers(req.Identifiers)

		var response GatewayResponse
		response.TransactionID = req.TransactionID

		if err != nil {
			log.Printf("[Process Query] Database error: %v", err)
			response.Status = "ERROR"
			response.Data = map[string]string{"error": "Internal error"}
		} else if patient == nil {
			log.Printf("[Process Query] Patient not found for transaction %s", req.TransactionID)
			response.Status = "REJECTED"
			response.Data = map[string]interface{}{
				"error":               "Patient not found",
				"searchedIdentifiers": req.Identifiers,
			}
		} else {
			log.Printf("[Process Query] Found patient %s", patient.ID)
			response.Status = "SUCCESS"
			response.Data = patient
		}

		// Send response to gateway
		if err := sendToGateway(req.GatewayReturnURL, response); err != nil {
			log.Printf("[Process Query] Failed to send callback: %v", err)
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results Handler
// ─────────────────────────────────────────────────────────────────────────────

func handleReceiveResults(w http.ResponseWriter, r *http.Request) {
	var req ReceiveResultsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Receive Results] Invalid JSON: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Receive Results] Transaction: %s, Status: %s",
		req.TransactionID, req.Status)

	// Store the received data
	if err := storeReceivedData(req.TransactionID, req.Data); err != nil {
		log.Printf("[Receive Results] Failed to store data: %v", err)
		http.Error(w, "Failed to store data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Data received successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Send Response to Gateway
// ─────────────────────────────────────────────────────────────────────────────

func sendToGateway(url string, payload GatewayResponse) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("request creation error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", config.APIKey)
	req.Header.Set("X-Provider-ID", config.ProviderID)
	req.Header.Set("Idempotency-Key", generateUUID()) // Use google/uuid package

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("gateway returned status %d", resp.StatusCode)
	}

	log.Printf("[Gateway] Successfully sent response for %s", payload.TransactionID)
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

func main() {
	http.HandleFunc("/fhir/process-query", validateGatewayAuth(handleProcessQuery))
	http.HandleFunc("/fhir/receive-results", validateGatewayAuth(handleReceiveResults))

	log.Println("Webhook server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

```
# ============================================================================
# WAH4PC Gateway Integration - Python (Flask)
# Production-ready webhook handlers with validation and error handling
# ============================================================================

from flask import Flask, request, jsonify
from pydantic import BaseModel, HttpUrl, validator
from typing import List, Optional, Dict, Any
from threading import Thread
import requests
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

class Config:
    API_KEY = os.environ.get('WAH4PC_API_KEY', '')
    PROVIDER_ID = os.environ.get('WAH4PC_PROVIDER_ID', '')
    GATEWAY_URL = os.environ.get('WAH4PC_GATEWAY_URL', '')

config = Config()

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models for Validation
# ─────────────────────────────────────────────────────────────────────────────

class Identifier(BaseModel):
    system: str
    value: str

class ProcessQueryPayload(BaseModel):
    transactionId: str
    requesterId: str
    identifiers: List[Identifier]
    resourceType: str
    gatewayReturnUrl: str
    reason: Optional[str] = None   # Optional: Purpose of the request
    notes: Optional[str] = None    # Optional: Additional context

    @validator('identifiers')
    def identifiers_not_empty(cls, v):
        if not v:
            raise ValueError('At least one identifier is required')
        return v

class ReceiveResultsPayload(BaseModel):
    transactionId: str
    status: str
    data: Optional[Dict[str, Any]] = None

    @validator('status')
    def status_valid(cls, v):
        if v not in ['SUCCESS', 'REJECTED', 'ERROR']:
            raise ValueError('Status must be SUCCESS, REJECTED, or ERROR')
        return v

# ─────────────────────────────────────────────────────────────────────────────
# Database Functions (implement these for your system)
# ─────────────────────────────────────────────────────────────────────────────

def find_patient_by_identifiers(identifiers: List[Identifier]) -> Optional[Dict]:
    """
    Try each identifier until we find a match in your database.
    Returns FHIR-formatted patient or None if not found.
    """
    for identifier in identifiers:
        # Query your database here
        # patient = db.patients.find_one({
        #     '$or': [
        #         {'philhealth_id': identifier.value if 'philhealth' in identifier.system else None},
        #         {'mrn': identifier.value if '/mrn' in identifier.system else None},
        #     ]
        # })
        # if patient:
        #     return format_as_fhir(patient)
        pass
    return None

def store_received_data(transaction_id: str, data: Dict) -> None:
    """Store received FHIR data in your database."""
    # db.received_data.insert_one({
    #     'transaction_id': transaction_id,
    #     'data': data,
    #     'received_at': datetime.utcnow()
    # })
    pass

def verify_pending_transaction(transaction_id: str) -> bool:
    """Verify this transaction was initiated by us."""
    # return db.pending_transactions.find_one({'transaction_id': transaction_id}) is not None
    return True

# ─────────────────────────────────────────────────────────────────────────────
# Webhook 1: Process Query (when another provider requests data from you)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/fhir/process-query', methods=['POST'])
def process_query():
    # Validate request body
    try:
        payload = ProcessQueryPayload(**request.json)
    except Exception as e:
        logger.error(f"[Process Query] Validation error: {e}")
        return jsonify({'error': 'Invalid request payload', 'details': str(e)}), 400

    logger.info(f"[Process Query] Transaction: {payload.transactionId}")
    logger.info(f"[Process Query] Identifiers: {[f'{i.system}:{i.value}' for i in payload.identifiers]}")

    # IMPORTANT: Acknowledge immediately (don't block)
    response = jsonify({'message': 'Processing'})

    # Process asynchronously
    def send_to_gateway():
        try:
            # 1. Find patient by identifiers
            patient = find_patient_by_identifiers(payload.identifiers)

            if patient is None:
                # Patient not found
                response_payload = {
                    'transactionId': payload.transactionId,
                    'status': 'REJECTED',
                    'data': {
                        'error': 'Patient not found',
                        'searchedIdentifiers': [i.dict() for i in payload.identifiers]
                    }
                }
                logger.info(f"[Process Query] Patient not found for {payload.transactionId}")
            else:
                # Patient found
                response_payload = {
                    'transactionId': payload.transactionId,
                    'status': 'SUCCESS',
                    'data': patient
                }
                logger.info(f"[Process Query] Found patient for {payload.transactionId}")

            # 2. Send response to gateway
            resp = requests.post(
                payload.gatewayReturnUrl,
                headers={
                    'Content-Type': 'application/json',
                    'X-API-Key': config.API_KEY,
                    'X-Provider-ID': config.PROVIDER_ID,
                },
                json=response_payload,
                timeout=30
            )

            if resp.status_code >= 400:
                logger.error(f"[Process Query] Gateway returned {resp.status_code}")
            else:
                logger.info(f"[Process Query] Successfully sent response for {payload.transactionId}")

        except Exception as e:
            logger.error(f"[Process Query] Error: {e}")

    Thread(target=send_to_gateway).start()
    return response, 200

# ─────────────────────────────────────────────────────────────────────────────
# Webhook 2: Receive Results (when data you requested is available)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/fhir/receive-results', methods=['POST'])
def receive_results():
    # Validate request body
    try:
        payload = ReceiveResultsPayload(**request.json)
    except Exception as e:
        logger.error(f"[Receive Results] Validation error: {e}")
        return jsonify({'error': 'Invalid request payload', 'details': str(e)}), 400

    logger.info(f"[Receive Results] Transaction: {payload.transactionId}, Status: {payload.status}")

    # Verify this transaction was initiated by us
    if not verify_pending_transaction(payload.transactionId):
        logger.warning(f"[Receive Results] Unknown transaction: {payload.transactionId}")
        return jsonify({'error': 'Transaction not found'}), 404

    try:
        # Store the received data
        if payload.data:
            store_received_data(payload.transactionId, payload.data)

        logger.info(f"[Receive Results] Stored data for {payload.transactionId}")
        return jsonify({'message': 'Data received successfully'}), 200

    except Exception as e:
        logger.error(f"[Receive Results] Error storing data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

```
// ============================================================================
// WAH4PC Gateway Integration - Dart (Shelf)
// Production-ready webhook handlers with validation and error handling
// ============================================================================

import 'dart:convert';
import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:http/http.dart' as http;

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

class Config {
  static String apiKey = Platform.environment['WAH4PC_API_KEY'] ?? '';
  static String providerId = Platform.environment['WAH4PC_PROVIDER_ID'] ?? '';
  static String gatewayAuthKey = Platform.environment['GATEWAY_AUTH_KEY'] ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

Middleware validateGatewayAuth() {
  return (Handler innerHandler) {
    return (Request request) async {
      if (Config.gatewayAuthKey.isEmpty) return await innerHandler(request);

      final authHeader = request.headers['x-gateway-auth'];
      if (authHeader != Config.gatewayAuthKey) {
        return Response.forbidden('Unauthorized - Invalid gateway authentication');
      }

      return await innerHandler(request);
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query
// ─────────────────────────────────────────────────────────────────────────────

Future<Response> handleProcessQuery(Request request) async {
  try {
    final payload = jsonDecode(await request.readAsString());
    final String transactionId = payload['transactionId'];
    final String gatewayReturnUrl = payload['gatewayReturnUrl'];
    final List identifiers = payload['identifiers'];
    final String? reason = payload['reason'];  // Optional
    final String? notes = payload['notes'];    // Optional

    print('[Process Query] Transaction: $transactionId');
    if (reason != null) print('[Process Query] Reason: $reason');
    if (notes != null) print('[Process Query] Notes: $notes');

    // IMPORTANT: Acknowledge immediately
    // We start processing in background but return 200 OK now
    _processQueryInBackground(transactionId, gatewayReturnUrl, identifiers);

    return Response.ok(jsonEncode({'message': 'Processing'}),
        headers: {'content-type': 'application/json'});
  } catch (e) {
    print('[Process Query] Error: $e');
    return Response.badRequest(body: 'Invalid request payload');
  }
}

void _processQueryInBackground(
    String transactionId, String gatewayReturnUrl, List identifiers) async {
  try {
    // 1. Find patient (Mock database lookup)
    final patient = await _findPatientByIdentifiers(identifiers);

    Map<String, dynamic> responsePayload;

    if (patient == null) {
      responsePayload = {
        'transactionId': transactionId,
        'status': 'REJECTED',
        'data': {
          'error': 'Patient not found',
          'searchedIdentifiers': identifiers,
        }
      };
    } else {
      responsePayload = {
        'transactionId': transactionId,
        'status': 'SUCCESS',
        'data': patient,
      };
    }

    // 2. Send response to gateway
    final response = await http.post(
      Uri.parse(gatewayReturnUrl),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': Config.apiKey,
        'X-Provider-ID': Config.providerId,
      },
      body: jsonEncode(responsePayload),
    );

    if (response.statusCode >= 400) {
      print('[Process Query] Gateway returned ${response.statusCode}');
    } else {
      print('[Process Query] Successfully sent response for $transactionId');
    }
  } catch (e) {
    print('[Process Query] Background error: $e');
  }
}

Future<Map<String, dynamic>?> _findPatientByIdentifiers(List identifiers) async {
  // Simulate DB lookup
  await Future.delayed(Duration(milliseconds: 100));
  // Return mock patient
  return {
    'resourceType': 'Patient',
    'id': 'patient-123',
    'name': [
      {'family': 'Dela Cruz', 'given': ['Juan']}
    ],
    'birthDate': '1990-05-15',
    'gender': 'male',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results
// ─────────────────────────────────────────────────────────────────────────────

Future<Response> handleReceiveResults(Request request) async {
  try {
    final payload = jsonDecode(await request.readAsString());
    final String transactionId = payload['transactionId'];
    final String status = payload['status'];
    final Map<String, dynamic>? data = payload['data'];

    print('[Receive Results] Transaction: $transactionId, Status: $status');

    if (data != null) {
      // Store data in database
      print('[Receive Results] Stored data for $transactionId');
    }

    return Response.ok(jsonEncode({'message': 'Data received successfully'}),
        headers: {'content-type': 'application/json'});
  } catch (e) {
    print('[Receive Results] Error: $e');
    return Response.internalServerError();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

void main() async {
  final handler = const Pipeline()
      .addMiddleware(logRequests())
      .addMiddleware(validateGatewayAuth())
      .addHandler((Request request) {
    if (request.url.path == 'fhir/process-query' && request.method == 'POST') {
      return handleProcessQuery(request);
    }
    if (request.url.path == 'fhir/receive-results' && request.method == 'POST') {
      return handleReceiveResults(request);
    }
    return Response.notFound('Not found');
  });

  final server = await shelf_io.serve(handler, '0.0.0.0', 8080);
  print('Server listening on port ${server.port}');
}
```

## Integration Checklist

- Register your organization with the gateway
- Generate and save a Gateway Auth Key for mutual authentication
- Save your provider ID and API key securely
- Implement POST /fhir/process-query endpoint
- Implement POST /fhir/receive-results endpoint
- Add validation for X-Gateway-Auth header in your webhooks
- Add patient matching logic for FHIR identifiers
- Generate unique Idempotency-Key (UUID v4) for each request
- Handle 409 Conflict (retry after delay) and 429 errors (duplicate detected)
- Test with a sandbox/staging gateway first
- Ensure HTTPS is configured on your base URL
- Implement proper error handling and logging
- Set up monitoring for webhook endpoints
- Configure environment variables for production