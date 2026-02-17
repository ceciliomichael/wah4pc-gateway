# System Architecture

Understanding the data flow and transaction lifecycle of the WAH4PC Gateway.

## System Components

The diagram below shows how healthcare providers interact with the gateway
and how requests flow through the system.

### Component Interaction Model
```mermaid
sequenceDiagram
participant P1 as Hospital A (Requester)
participant GW as WAH4PC Gateway
participant V as FHIR Validator
participant P2 as Laboratory B (Target)

rect rgb(240, 249, 255)
Note over P1,P2: Provider Request Flow
P1->>GW: POST /api/v1/fhir/request/Patient
GW->>GW: Validate Providers
GW->>GW: Create Transaction
GW->>P2: POST /fhir/process-query
P2-->>GW: 200 OK
GW-->>P1: 202 Accepted (Transaction ID)
end

rect rgb(240, 253, 244)
Note over P1,P2: Provider Response Flow
P2->>GW: POST /api/v1/fhir/receive/Patient
GW->>V: POST /validateResource
V-->>GW: Validation Result
alt Valid Resource
GW->>GW: Update Transaction Status
GW->>P1: POST /fhir/receive-results
P1-->>GW: 200 OK
GW-->>P2: 200 OK
else Invalid Resource
GW-->>P2: 422 Unprocessable Entity
end
end
```

## Transaction Flow

The gateway uses an asynchronous request/response model. When a provider
requests data, the gateway orchestrates the entire flow without blocking.

### Async Request/Response Cycle
```mermaid
sequenceDiagram
participant R as Requester (Hospital A)
participant G as Gateway
participant V as Validator
participant T as Target (Lab B)

rect rgb(240, 249, 255)
Note over R,T: Phase 1 - Query Initiation
R->>+G: POST /api/v1/fhir/request/Patient
G->>G: Validate Providers
G->>G: Create Transaction (PENDING)
G->>+T: POST /fhir/process-query
T-->>-G: 200 OK (Acknowledged)
G-->>-R: 202 Accepted (Transaction ID)
end

rect rgb(254, 252, 232)
Note over R,T: Phase 2 - Async Data Processing
T->>T: Fetch Patient Data
T->>T: Prepare FHIR Bundle
end

rect rgb(240, 253, 244)
Note over R,T: Phase 3 - Data Relay
T->>+G: POST /api/v1/fhir/receive/Patient
G->>V: Validate FHIR Resource
V-->>G: Validation Result
G->>G: Update Status (RECEIVED)
G->>+R: POST /fhir/receive-results
R-->>-G: 200 OK (Data Received)
G->>G: Update Status (COMPLETED)
G-->>-T: 200 OK
end
```

> **Key Points**

## Transaction States

Each transaction progresses through a state machine. This enables status
tracking and prevents duplicate processing.

### State Machine Diagram
```mermaid
sequenceDiagram
participant TX as Transaction
participant S as Status

rect rgb(254, 252, 232)
Note over TX,S: State Transitions
TX->>S: Transaction Created
S->>S: Status = PENDING
end

alt Target sends data successfully
rect rgb(240, 249, 255)
TX->>S: Target responds
S->>S: Status = RECEIVED
end
alt Requester acknowledges
rect rgb(240, 253, 244)
TX->>S: Requester confirms
S->>S: Status = COMPLETED
end
else Requester unreachable
rect rgb(254, 242, 242)
TX->>S: Delivery failed
S->>S: Status = FAILED
end
end
else Target unreachable
rect rgb(254, 242, 242)
TX->>S: Forward failed
S->>S: Status = FAILED
end
end
```

• PENDING: Request sent to target, awaiting response
• RECEIVED: Target sent data, relaying to requester
• COMPLETED: Requester acknowledged receipt
• FAILED: Provider unreachable or error occurred

## Data Models

### {dataModels.provider.title}

**Provider Struct**
```json
{
"id": "uuid",
"name": "City Hospital",
"type": "hospital",
"baseUrl": "https://api.cityhospital.com",
"createdAt": "2024-01-15T10:00:00Z",
"updatedAt": "2024-01-15T10:00:00Z"
}
```

### {dataModels.transaction.title}

**Transaction Struct**
```json
{
"id": "uuid",
"requesterId": "provider-uuid",
"targetId": "provider-uuid",
"patientId": "patient-123",
"resourceType": "Patient",
"status": "PENDING",
"metadata": {
"reason": "Referral",
"notes": "Urgent"
},
"createdAt": "...",
"updatedAt": "..."
}
```