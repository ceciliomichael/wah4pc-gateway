// Mermaid diagrams for Integration Guide

export const integrationFlowDiagram = `
sequenceDiagram
    participant YS as Your System
    participant GW as WAH4PC Gateway
    participant OP as Other Provider

    rect rgb(240, 249, 255)
        Note over YS,OP: Step 1 - Registration
        YS->>GW: POST /api/v1/providers
        GW-->>YS: 201 Created (Provider ID)
    end

    rect rgb(240, 253, 244)
        Note over YS,OP: Step 2 - Requesting Data (You are Requester)
        YS->>GW: POST /api/v1/fhir/request/Patient
        GW->>OP: POST /fhir/process-query
        OP-->>GW: 200 OK
        GW-->>YS: 202 Accepted (Transaction ID)
    end
    
    rect rgb(254, 252, 232)
        Note over YS,OP: Async - Other provider processes
        OP->>GW: POST /api/v1/fhir/receive/Patient
        GW->>YS: POST /fhir/receive-results
        YS-->>GW: 200 OK
    end

    rect rgb(254, 242, 242)
        Note over YS,OP: Step 3 - Providing Data (You are Target)
        OP->>GW: POST /api/v1/fhir/request/Patient
        GW->>YS: POST /fhir/process-query
        YS-->>GW: 200 OK
    end
    
    rect rgb(250, 245, 255)
        Note over YS,OP: You process and respond
        YS->>GW: POST /api/v1/fhir/receive/Patient
        GW->>OP: POST /fhir/receive-results
    end
`;

export const webhookHandlerDiagram = `
sequenceDiagram
    participant GW as Gateway
    participant PQ as /fhir/process-query
    participant DB as Your Database
    participant RR as /fhir/receive-results

    rect rgb(240, 249, 255)
        Note over GW,DB: Webhook 1 - Incoming Query
        GW->>PQ: POST request with transactionId, identifiers[]
        PQ->>DB: Match patient by identifiers
        DB-->>PQ: Patient record
        PQ-->>GW: 200 OK (Acknowledged)
        PQ->>GW: POST gatewayReturnUrl with data
    end

    rect rgb(250, 245, 255)
        Note over GW,DB: Webhook 2 - Receive Results
        GW->>RR: POST with transactionId and data
        RR->>DB: Store received data
        DB-->>RR: Saved
        RR-->>GW: 200 OK
    end
`;

// ============================================================================
// PRODUCTION-READY CODE EXAMPLES
// ============================================================================

export const nodeJsExample = `// ============================================================================
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
    const { transactionId, identifiers, gatewayReturnUrl } = req.body as ProcessQueryPayload;

    console.log(\`[Process Query] Transaction: \${transactionId}\`);
    console.log(\`[Process Query] Identifiers: \${JSON.stringify(identifiers)}\`);

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

        // 2. Send response to gateway
        const response = await fetch(gatewayReturnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.WAH4PC_API_KEY!,
            'X-Provider-ID': process.env.WAH4PC_PROVIDER_ID!,
          },
          body: JSON.stringify(responsePayload),
        });

        if (!response.ok) {
          console.error(\`[Process Query] Gateway callback failed: \${response.status}\`);
        } else {
          console.log(\`[Process Query] Successfully sent response for \${transactionId}\`);
        }
      } catch (error) {
        console.error(\`[Process Query] Error processing \${transactionId}:\`, error);
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

    console.log(\`[Receive Results] Transaction: \${transactionId}, Status: \${status}\`);

    try {
      // 1. Verify this transaction was initiated by us
      const pending = await db.pendingTransactions.findUnique({
        where: { transactionId },
      });

      if (!pending) {
        console.warn(\`[Receive Results] Unknown transaction: \${transactionId}\`);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // 2. Store the received data
      await storeReceivedData(transactionId, data);

      // 3. Update transaction status
      await db.pendingTransactions.update({
        where: { transactionId },
        data: { status: status, completedAt: new Date() },
      });

      console.log(\`[Receive Results] Stored data for \${transactionId}\`);
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      console.error(\`[Receive Results] Error:\`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables Required
// ─────────────────────────────────────────────────────────────────────────────
// WAH4PC_API_KEY=wah_your-api-key-here
// WAH4PC_PROVIDER_ID=your-provider-uuid
// WAH4PC_GATEWAY_URL=https://gateway.wah4pc.com
// GATEWAY_AUTH_KEY=your-secret-gateway-auth-key (set when registering provider)

app.listen(3000, () => console.log('Webhook server running on port 3000'));`;

export const goExample = `// ============================================================================
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
	System string \`json:"system" validate:"required,url"\`
	Value  string \`json:"value" validate:"required"\`
}

type ProcessQueryRequest struct {
	TransactionID    string       \`json:"transactionId" validate:"required,uuid"\`
	RequesterID      string       \`json:"requesterId" validate:"required,uuid"\`
	Identifiers      []Identifier \`json:"identifiers" validate:"required,min=1,dive"\`
	ResourceType     string       \`json:"resourceType" validate:"required"\`
	GatewayReturnURL string       \`json:"gatewayReturnUrl" validate:"required,url"\`
}

type ReceiveResultsRequest struct {
	TransactionID string                 \`json:"transactionId" validate:"required,uuid"\`
	Status        string                 \`json:"status" validate:"required,oneof=SUCCESS REJECTED ERROR"\`
	Data          map[string]interface{} \`json:"data"\`
}

type GatewayResponse struct {
	TransactionID string      \`json:"transactionId"\`
	Status        string      \`json:"status"\`
	Data          interface{} \`json:"data,omitempty"\`
}

type FHIRPatient struct {
	ResourceType string       \`json:"resourceType"\`
	ID           string       \`json:"id"\`
	Identifier   []Identifier \`json:"identifier"\`
	Name         []HumanName  \`json:"name"\`
	BirthDate    string       \`json:"birthDate"\`
	Gender       string       \`json:"gender"\`
}

type HumanName struct {
	Family string   \`json:"family"\`
	Given  []string \`json:"given"\`
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
}`;

export const pythonExample = `# ============================================================================
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
    app.run(host='0.0.0.0', port=5000, debug=False)`;

export const dartExample = `// ============================================================================
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

    print('[Process Query] Transaction: $transactionId');

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
      print('[Process Query] Gateway returned \${response.statusCode}');
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
  print('Server listening on port \${server.port}');
}
`;

// ============================================================================
// STATIC DATA
// ============================================================================

export const providerTypes = ["clinic", "hospital", "laboratory", "pharmacy"] as const;

export const checklistItems = [
  "Register your organization with the gateway",
  "Generate and save a Gateway Auth Key for mutual authentication",
  "Save your provider ID and API key securely",
  "Implement POST /fhir/process-query endpoint",
  "Implement POST /fhir/receive-results endpoint",
  "Add validation for X-Gateway-Auth header in your webhooks",
  "Add patient matching logic for FHIR identifiers",
  "Test with a sandbox/staging gateway first",
  "Ensure HTTPS is configured on your base URL",
  "Implement proper error handling and logging",
  "Set up monitoring for webhook endpoints",
  "Configure environment variables for production",
] as const;

export const prerequisites = [
  {
    title: "Publicly Accessible Base URL",
    description: "Your backend must be reachable from the internet (e.g., https://api.yourorganization.com)",
  },
  {
    title: "HTTPS Enabled",
    description: "All endpoints must use HTTPS for secure communication",
  },
  {
    title: "Gateway Auth Key",
    description: "Generate a secure secret key that the Gateway will use to authenticate when calling your webhooks",
  },
  {
    title: "Webhook Endpoints",
    description: "You must implement two webhook endpoints that the gateway will call",
  },
  {
    title: "FHIR-Compatible Data",
    description: "Your system should be able to produce and consume FHIR resources",
  },
  {
    title: "Patient Identifier Mapping",
    description: "Ability to match patients by PhilHealth ID, MRN, or other FHIR identifiers",
  },
] as const;

export const securityFeatures = [
  {
    title: "Validate X-Gateway-Auth Header",
    description: "Verify the X-Gateway-Auth header matches your Gateway Auth Key to ensure requests are from the legitimate gateway.",
  },
  {
    title: "Validate X-Provider-ID Header",
    description: "When receiving callbacks, check the X-Provider-ID header matches the expected sender.",
  },
  {
    title: "Verify Transaction IDs",
    description: "Only process results for transaction IDs you initiated. Reject unknown transactions.",
  },
  {
    title: "Use HTTPS Only",
    description: "All communication must use HTTPS. The gateway will reject HTTP base URLs.",
  },
  {
    title: "Implement Rate Limiting",
    description: "Protect your endpoints from abuse by implementing rate limiting on webhooks.",
  },
] as const;

export const bestPractices = [
  {
    title: "Respond Immediately (200 OK)",
    description: "Always acknowledge webhook requests within 5 seconds. Process data asynchronously to avoid timeouts.",
    icon: "Clock",
  },
  {
    title: "Handle Idempotency",
    description: "The same transaction ID may be sent twice. Check if you've already processed it before re-processing.",
    icon: "CheckCircle2",
  },
  {
    title: "Log Everything",
    description: "Log all incoming requests and outgoing responses with transaction IDs for debugging and auditing.",
    icon: "Lightbulb",
  },
  {
    title: "Use a Job Queue",
    description: "For production, use Redis/RabbitMQ to queue processing jobs instead of spawning threads directly.",
    icon: "Lightbulb",
  },
] as const;

export const commonPitfalls = [
  {
    title: "Blocking the Webhook Response",
    description: "Don't fetch data from your database before responding 200 OK. The gateway has a timeout and will retry.",
  },
  {
    title: "Ignoring REJECTED Status",
    description: "When a provider can't find the patient, they should return status: 'REJECTED', not just fail silently.",
  },
  {
    title: "Hardcoding Identifiers",
    description: "Don't assume all patients have a PhilHealth ID. Match on ANY identifier in the array that exists in your system.",
  },
  {
    title: "Missing Error Handling",
    description: "If your database query fails, catch the error and send status: 'ERROR' to the gateway with details.",
  },
] as const;