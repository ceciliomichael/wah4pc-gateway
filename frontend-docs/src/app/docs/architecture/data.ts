// Mermaid diagrams for Architecture page

export const systemArchitectureDiagram = `
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
`;

export const transactionFlowDiagram = `
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
`;

export const transactionStatesDiagram = `
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
`;

// Static data for tables and cards

export interface TransactionStateData {
  status: string;
  statusColor: string;
  description: string;
  nextStates: string;
  [key: string]: unknown;
}

export const transactionStatesData: TransactionStateData[] = [
  {
    status: "PENDING",
    statusColor: "bg-yellow-100 text-yellow-800",
    description: "Request sent to target, awaiting response",
    nextStates: "RECEIVED, FAILED",
  },
  {
    status: "RECEIVED",
    statusColor: "bg-blue-100 text-blue-800",
    description: "Target sent data, relaying to requester",
    nextStates: "COMPLETED, FAILED",
  },
  {
    status: "COMPLETED",
    statusColor: "bg-green-100 text-green-800",
    description: "Requester acknowledged receipt",
    nextStates: "-",
  },
  {
    status: "FAILED",
    statusColor: "bg-red-100 text-red-800",
    description: "Provider unreachable or error occurred",
    nextStates: "-",
  },
];

export const keyPoints = [
  "The requester receives a transaction ID immediately (202 Accepted)",
  "Data processing happens asynchronously at the target",
  "The gateway acts as a relay, never storing FHIR data",
  "Transaction status is tracked throughout the lifecycle",
] as const;

export const dataModels = {
  provider: {
    title: "Provider",
    code: `{
  "id": "uuid",
  "name": "City Hospital",
  "type": "hospital",
  "facility_code": "HOSP-001",
  "location": "Quezon City",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}`,
    types: ["clinic", "hospital", "laboratory", "pharmacy"],
  },
  transaction: {
    title: "Transaction",
    code: `{
  "id": "uuid",
  "requesterId": "provider-uuid",
  "targetId": "provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
  "resourceType": "Patient",
  "status": "PENDING",
  "metadata": {
    "reason": "Referral",
    "notes": "Urgent"
  },
  "createdAt": "...",
  "updatedAt": "..."
}`,
  },
} as const;
