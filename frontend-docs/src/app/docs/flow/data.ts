// Transaction Flow Data - Detailed explanations and JSON examples
import { config } from "@/lib/config";

// ============================================================================
// REQUIRED HEADERS
// ============================================================================

export const fhirRequestHeaders = {
  "X-API-Key": "wah_your-api-key",
  "X-Provider-ID": "your-provider-id",
} as const;

// ============================================================================
// MERMAID DIAGRAMS
// ============================================================================

export const transactionFlowSequence = `sequenceDiagram
    autonumber
    participant App as Requester (App)
    participant GW as Gateway
    participant Provider as Provider (Giver)
    
    Note over App,Provider: Phase 1: Request Initiation
    App->>GW: POST /api/v1/fhir/request/{resourceType}
    Note right of App: Sends resource-specific request body + provider IDs
    GW->>GW: Generate transaction_id
    GW->>GW: Validate API Key & Rate Limit
    GW->>GW: Create Transaction (status: pending)
    GW-->>App: 202 Accepted
    Note left of GW: Returns transaction_id immediately
    
    Note over App,Provider: Phase 2: Provider Notification
    GW->>Provider: POST /fhir/process-query (webhook)
    Note right of GW: Includes transaction_id in payload
    Provider-->>GW: 200 OK (Acknowledged)
    
    Note over App,Provider: Phase 3: Data Preparation (Async)
    Provider->>Provider: Fetch requested FHIR data
    Provider->>Provider: Prepare response payload
    
    Note over App,Provider: Phase 4: Callback with Data
    Provider->>GW: POST /api/v1/fhir/receive/{resourceType}
    Note right of Provider: MUST include same transaction_id
    GW->>GW: Match transaction_id
    GW->>GW: Update status via RECEIVED -> COMPLETED
    GW-->>Provider: 200 OK
    
    Note over App,Provider: Phase 5: Data Retrieval
    App->>GW: GET /api/v1/transactions/{transaction_id}
    GW-->>App: 200 OK (Status + metadata)
`;

export const transactionIdFlowDiagram = `flowchart LR
    subgraph "Transaction ID Journey"
        A[Generated at Gateway] --> B[Sent to Requester]
        A --> C[Sent to Provider]
        C --> D[Returned in Callback]
        D --> E[Matched & Stored]
        B --> F[Used for Status Check]
        E --> F
    end
    
    style A fill:#3b82f6,color:#fff
    style E fill:#22c55e,color:#fff
`;

export const consistencyDiagram = `flowchart TB
    subgraph "Without Consistent transaction_id"
        X1[Request A] -.->|?| X2[Response ???]
        X3[Request B] -.->|?| X4[Response ???]
        X5[Callback] -.->|?| X6[Which Request?]
    end
    
    subgraph "With Consistent transaction_id"
        Y1[Request A<br/>txn_abc123] -->|OK| Y2[Response txn_abc123]
        Y3[Request B<br/>txn_def456] -->|OK| Y4[Response txn_def456]
        Y5[Callback txn_abc123] -->|OK| Y6[Matched to Request A]
    end
    
    style X6 fill:#ef4444,color:#fff
    style Y6 fill:#22c55e,color:#fff
`;

// ============================================================================
// JSON EXAMPLES - Step by Step
// ============================================================================

export const step1_initialRequest = `{
  "requesterId": "prov_clinic_sunrise_002",
  "targetId": "prov_hosp_metro_001",
  "patientIdentifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://hospital-metro.com/mrn",
      "value": "patient_12345"
    }
  ],
  "reason": "treatment",
  "notes": "Urgent request"
}`;

export const step2_gatewayResponse = `{
  "success": true,
  "data": {
    "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PENDING",
    "requesterId": "your-provider-uuid",
    "targetId": "prov_hosp_metro_001",
    "metadata": {
      "reason": "treatment",
      "notes": "Urgent request"
    }
  }
}`;

export const step3_providerWebhook = `{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "resourceType": "MedicationRequest",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
  "requesterId": "prov_clinic_sunrise_002",
  "gatewayReturnUrl": "${config.gatewayUrl}/api/v1/fhir/receive/MedicationRequest"
}`;

export const step4_providerCallback = `{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "MedicationRequest",
          "id": "medrx-001",
          "status": "active"
        }
      }
    ]
  }
}`;

export const step5_statusCheck = `// Request
GET /api/v1/transactions/txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890
X-API-Key: YOUR_API_KEY_HERE

// Response
{
  "success": true,
  "data": {
    "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "COMPLETED",
    "requesterId": "prov_clinic_sunrise_002",
    "targetId": "prov_hosp_metro_001",
    "resourceType": "MedicationRequest",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:32:45Z"
  }
}`;

// ============================================================================
// TRANSACTION ID EXPLANATION DATA
// ============================================================================

export const transactionIdBenefits = [
  {
    title: "Correlation Across Systems",
    description: "Links the original request to all subsequent operations. When Provider A sends data, the Gateway instantly knows which request it fulfills.",
    icon: "Link",
  },
  {
    title: "Asynchronous Processing",
    description: "Enables fire-and-forget requests. The requester doesn't wait; they check back later using the transaction_id.",
    icon: "Clock",
  },
  {
    title: "Audit Trail",
    description: "Every action logged under one ID. Debugging, compliance audits, and dispute resolution become straightforward.",
    icon: "FileSearch",
  },
  {
    title: "Idempotency",
    description: "Prevents duplicate processing. If a callback is sent twice, the Gateway recognizes the transaction_id and handles it gracefully.",
    icon: "Shield",
  },
];


export const consistencyRules = [
  {
    rule: "Never Modify",
    description: "The transaction_id is immutable. Pass it exactly as received—no trimming, no case changes.",
  },
  {
    rule: "Always Include",
    description: "Every callback, status update, or error report MUST include the transaction_id in the payload.",
  },
  {
    rule: "Store Locally",
    description: "Keep a local log mapping your internal job IDs to the gateway's transaction_id for debugging.",
  },
  {
    rule: "Validate Format",
    description: "transaction_id follows UUID v4 format with 'txn_' prefix. Validate before processing.",
  },
];

// ============================================================================
// FLOW STEPS DATA
// ============================================================================

export const flowSteps = [
  {
    step: 1,
    title: "Requester Initiates Request",
    actor: "Requester (App)",
    endpoint: "POST /api/v1/fhir/request/{resourceType}",
    description: "The requesting application (e.g., a clinic's EHR) sends a request to the Gateway specifying which provider has the data they need.",
    keyPoint: "At this point, no transaction_id exists yet. The requester is simply asking for data.",
  },
  {
    step: 2,
    title: "Gateway Creates Transaction",
    actor: "Gateway",
    endpoint: "Internal",
    description: "The Gateway validates the request, generates a unique transaction_id (UUID v4 with 'txn_' prefix), and stores the transaction with 'PENDING' status.",
    keyPoint: "The transaction_id is BORN here. This is the single source of truth.",
  },
  {
    step: 3,
    title: "Immediate Response to Requester",
    actor: "Gateway → Requester",
    endpoint: "Response: 202 Accepted",
    description: "The Gateway immediately returns the transaction_id to the requester. The connection is closed. The requester now has a 'receipt' to check later.",
    keyPoint: "202 means 'accepted for processing'—NOT 'completed'. The requester must poll or wait for webhook.",
  },
  {
    step: 4,
    title: "Gateway Notifies Provider",
    actor: "Gateway → Provider",
    endpoint: "POST {registered_provider_webhook_base}/fhir/process-query",
    description: "The Gateway forwards the request to the Provider (Giver) who has the patient data. The transaction_id is included in this payload.",
    keyPoint: "The Provider MUST capture and store this transaction_id. It's their key to respond correctly.",
  },
  {
    step: 5,
    title: "Provider Acknowledges",
    actor: "Provider → Gateway",
    endpoint: "Response: 200 OK",
    description: "The Provider acknowledges receipt. This doesn't mean the data is ready—just that the request was received.",
    keyPoint: "If the Provider returns an error here, the Gateway marks the transaction as 'FAILED' immediately.",
  },
  {
    step: 6,
    title: "Provider Processes Request",
    actor: "Provider (Internal)",
    endpoint: "N/A",
    description: "The Provider fetches the requested FHIR resources from their system. This may take seconds or minutes depending on complexity.",
    keyPoint: "This is asynchronous. The Gateway is NOT waiting. Other requests can proceed.",
  },
  {
    step: 7,
    title: "Provider Sends Callback",
    actor: "Provider → Gateway",
    endpoint: "POST /api/v1/fhir/receive/{resourceType}",
    description: "When data is ready, the Provider POSTs to the Gateway's callback endpoint. The payload MUST include the original transaction_id.",
    keyPoint: "WITHOUT the transaction_id, the Gateway cannot match this data to the original request. The callback would fail.",
  },
  {
    step: 8,
    title: "Gateway Matches and Stores",
    actor: "Gateway",
    endpoint: "Internal",
    description: "The Gateway looks up the transaction by transaction_id, verifies the Provider, relays data to requester webhook, and updates status to 'COMPLETED'.",
    keyPoint: "The transaction_id enables instant lookup. O(1) matching instead of complex correlation logic.",
  },
  {
    step: 9,
    title: "Requester Retrieves Data",
    actor: "Requester → Gateway",
    endpoint: "GET /api/v1/transactions/{id}",
    description: "The original requester checks status and metadata using the same transaction_id they received in step 3.",
    keyPoint: "FHIR data delivery happens via requester webhook `/fhir/receive-results`; transaction endpoint is for tracking.",
  },
];

// ============================================================================
// ERROR SCENARIOS
// ============================================================================

export const errorScenarios = [
  {
    scenario: "Missing transaction_id in Callback",
    request: `POST /api/v1/fhir/receive/Patient
{
  "status": "SUCCESS",
  "data": { ... }
  // ERROR: No transaction_id!
}`,
    response: `{
  "success": false,
  "error": "transactionId is required"
}`,
    explanation: "The Gateway rejects callbacks without a transactionId. There's no way to know which request this data belongs to.",
  },
  {
    scenario: "Transaction Not Found",
    request: `POST /api/v1/fhir/receive/Patient
{
  "transactionId": "txn_00000000-0000-0000-0000-000000000000",
  "status": "SUCCESS"
}`,
    response: `{
  "success": false,
  "error": "transaction not found or not in pending status"
}`,
    explanation: "The transactionId exists but doesn't match any record. Possibly expired, already completed, or never existed.",
  },
];
