// System Flow Data - High-level ecosystem lifecycle documentation

// ============================================================================
// MERMAID DIAGRAMS
// ============================================================================

export const systemLifecycleDiagram = `
flowchart TB
    subgraph ONBOARD["Phase 1: Onboarding"]
        direction LR
        R1[New Provider] --> R2[Register with Gateway]
        R2 --> R3[Receive Provider ID]
        R3 --> R4[Generate API Key]
    end

    subgraph DISCOVER["Phase 2: Discovery"]
        direction LR
        D1[Query Provider Registry] --> D2[Find Target Provider]
        D2 --> D3[Get Target's baseUrl]
    end

    subgraph SECURE["Phase 3: Security"]
        direction LR
        S1[Include API Key] --> S2[Gateway Validates]
        S2 --> S3[Rate Limit Check]
        S3 --> S4[Request Authorized]
    end

    subgraph EXCHANGE["Phase 4: Data Exchange"]
        direction LR
        E1[Initiate Transaction] --> E2[Gateway Orchestrates]
        E2 --> E3[Target Processes]
        E3 --> E4[Data Delivered]
    end

    subgraph MONITOR["Phase 5: Monitoring"]
        direction LR
        M1[Track Transaction Status] --> M2[View Audit Logs]
        M2 --> M3[Monitor Health]
    end

    ONBOARD --> DISCOVER
    DISCOVER --> SECURE
    SECURE --> EXCHANGE
    EXCHANGE --> MONITOR
    MONITOR -.->|Continuous Operation| DISCOVER

    style ONBOARD fill:#dbeafe,stroke:#3b82f6
    style DISCOVER fill:#dcfce7,stroke:#22c55e
    style SECURE fill:#fef3c7,stroke:#f59e0b
    style EXCHANGE fill:#e0e7ff,stroke:#6366f1
    style MONITOR fill:#fce7f3,stroke:#ec4899
`;

export const onboardingFlowDiagram = `
sequenceDiagram
    participant P as New Provider
    participant A as System Admin
    participant GW as WAH4PC Gateway
    participant DB as Provider Registry

    rect rgb(219, 234, 254)
        Note over P,DB: Registration Process
        P->>A: Request Registration
        Note right of P: Provide details (name, url)
        A->>GW: Register Provider (Admin Tool)
        GW->>DB: Store Provider Record
        DB-->>GW: Provider ID Generated
        A-->>P: Provide Credentials
        Note left of P: Receive Provider ID & API Key
    end
`;

export const discoveryFlowDiagram = `
sequenceDiagram
    participant A as Provider A (Requester)
    participant GW as WAH4PC Gateway
    participant REG as Provider Registry

    rect rgb(220, 252, 231)
        Note over A,REG: Finding Other Providers
        A->>GW: GET /api/v1/providers
        GW->>REG: Query All Providers
        REG-->>GW: Provider List
        GW-->>A: 200 OK
        Note left of GW: [{id, name, type, baseUrl}, ...]
    end

    rect rgb(224, 231, 255)
        Note over A,REG: Getting Specific Provider
        A->>GW: GET /api/v1/providers/{targetId}
        GW->>REG: Lookup by ID
        REG-->>GW: Provider Details
        GW-->>A: 200 OK
        Note left of GW: {id, name, type, baseUrl}
    end
`;

export const securityFlowDiagram = `
sequenceDiagram
    participant C as Client Request
    participant MW as Auth Middleware
    participant RL as Rate Limiter
    participant H as Handler

    rect rgb(254, 243, 199)
        Note over C,H: Every Request Goes Through Security
        C->>MW: Request + X-API-Key Header
        MW->>MW: Validate API Key Format
        MW->>MW: Lookup Key in Database
        alt Key Invalid
            MW-->>C: 401 Unauthorized
        else Key Valid
            MW->>RL: Check Rate Limit
            alt Rate Exceeded
                RL-->>C: 429 Too Many Requests
            else Within Limit
                RL->>H: Forward Request
                H-->>C: Process & Respond
            end
        end
    end
`;

export const exchangeFlowDiagram = `
sequenceDiagram
    participant A as Provider A (Requester)
    participant GW as WAH4PC Gateway
    participant V as FHIR Validator
    participant B as Provider B (Target)

    rect rgb(224, 231, 255)
        Note over A,B: Data Exchange Orchestration
        A->>GW: POST /api/v1/fhir/request/{type}
        GW->>GW: Create Transaction (PENDING)
        GW->>B: POST /fhir/process-query
        B-->>GW: 200 OK (Acknowledged)
        GW-->>A: 202 Accepted (txn_id)
    end

    rect rgb(254, 252, 232)
        Note over A,B: Async Processing
        B->>B: Fetch & Prepare Data
    end

    rect rgb(220, 252, 231)
        Note over A,B: Data Delivery & Validation
        B->>GW: POST /api/v1/fhir/receive/{type}
        GW->>V: Validate FHIR Resource
        V-->>GW: Validation Result
        GW->>A: POST /fhir/receive-results
        A-->>GW: 200 OK
        GW-->>B: 200 OK
        GW->>GW: Transaction COMPLETED
    end
`;

export const monitoringFlowDiagram = `
sequenceDiagram
    participant P as Provider
    participant GW as WAH4PC Gateway
    participant TX as Transaction Store

    rect rgb(252, 231, 243)
        Note over P,TX: Status Tracking
        P->>GW: GET /api/v1/transactions/{id}
        GW->>TX: Lookup Transaction
        TX-->>GW: Transaction Data
        GW-->>P: 200 OK
        Note left of GW: {id, status, timestamps}
    end

    rect rgb(252, 231, 243)
        Note over P,TX: Listing All Transactions
        P->>GW: GET /api/v1/transactions
        GW->>TX: Query Transactions
        TX-->>GW: Transaction List
        GW-->>P: 200 OK
        Note left of GW: Filtered by requester/target
    end
`;

// ============================================================================
// PHASE DESCRIPTIONS
// ============================================================================

export const lifecyclePhases = [
  {
    phase: 1,
    title: "Onboarding",
    subtitle: "Join the Network",
    description: "Register your organization with the gateway and obtain credentials to participate in the healthcare data exchange network.",
    icon: "UserPlus",
    color: "blue",
    steps: [
      "Contact Administrator to register your organization",
      "Receive your unique Provider ID (UUID)",
      "Obtain your API Key for authentication",
      "Configure your webhook endpoints (baseUrl)",
    ],
    keyInsight: "Your Provider ID is your identity in the network. Your API Key proves you are who you claim to be.",
  },
  {
    phase: 2,
    title: "Discovery",
    subtitle: "Find Other Providers",
    description: "Query the provider registry to discover other healthcare organizations you can exchange data with.",
    icon: "Search",
    color: "green",
    steps: [
      "List all registered providers via GET /api/v1/providers",
      "Search by provider type (hospital, clinic, laboratory)",
      "Get specific provider details by ID",
      "Save target provider IDs for future requests",
    ],
    keyInsight: "The gateway acts as a directory. You don't need to know other providers' internal systems—just their ID.",
  },
  {
    phase: 3,
    title: "Security",
    subtitle: "Authenticate Every Request",
    description: "Every API call requires authentication. The gateway validates your API key and enforces rate limits to ensure fair usage.",
    icon: "Shield",
    color: "amber",
    steps: [
      "Include X-API-Key header in all requests",
      "Gateway validates key format and existence",
      "Rate limiter checks request frequency",
      "Authorized requests proceed to handlers",
    ],
    keyInsight: "Security is not optional. Requests without valid API keys are rejected immediately (401 Unauthorized).",
  },
  {
    phase: 4,
    title: "Data Exchange",
    subtitle: "Request & Receive FHIR Data",
    description: "The core functionality: request patient data from other providers and receive validated, compliant FHIR data via webhooks.",
    icon: "ArrowLeftRight",
    color: "indigo",
    steps: [
      "Initiate request via POST /api/v1/fhir/request/{resourceType}",
      "Gateway creates transaction and notifies target",
      "Target processes request and sends data to gateway",
      "Gateway validates data against PH Core FHIR profiles",
      "Valid data is delivered to your webhook endpoint",
    ],
    keyInsight: "Strict validation ensures only PH Core compliant FHIR data enters the network. Invalid resources are rejected with 422 errors.",
  },
  {
    phase: 5,
    title: "Monitoring",
    subtitle: "Track & Audit",
    description: "Monitor transaction status, view history, and maintain audit trails for compliance and debugging.",
    icon: "Activity",
    color: "pink",
    steps: [
      "Check transaction status via GET /api/v1/transactions/{id}",
      "List all your transactions (as requester or target)",
      "Review timestamps and status transitions",
      "Use transaction IDs for support inquiries",
    ],
    keyInsight: "Every action is logged. The transaction_id is your audit trail—keep it for compliance and debugging.",
  },
] as const;

// ============================================================================
// COMPARISON TABLE DATA
// ============================================================================

export const flowComparison = [
  {
    aspect: "Scope",
    systemFlow: "Entire ecosystem lifecycle (macro)",
    transactionFlow: "Single request/response cycle (micro)",
  },
  {
    aspect: "Focus",
    systemFlow: "How providers join, operate, and maintain participation",
    transactionFlow: "How a specific data request moves through the system",
  },
  {
    aspect: "Duration",
    systemFlow: "Ongoing (days/months/years)",
    transactionFlow: "Minutes to hours per transaction",
  },
  {
    aspect: "Key Concept",
    systemFlow: "Provider Identity & Trust",
    transactionFlow: "Transaction ID & Correlation",
  },
  {
    aspect: "Question Answered",
    systemFlow: '"How do I participate in the network?"',
    transactionFlow: '"What happens when I send a request?"',
  },
  {
    aspect: "Phases",
    systemFlow: "Onboard → Discover → Secure → Exchange → Monitor",
    transactionFlow: "Request → Acknowledge → Process → Callback → Complete",
  },
] as const;

// ============================================================================
// KEY CONCEPTS
// ============================================================================

export const keyConcepts = [
  {
    term: "Provider ID",
    definition: "A UUID that uniquely identifies your organization in the gateway. Obtained during registration.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  {
    term: "API Key",
    definition: "A secret token used to authenticate requests. Prefixed with 'wah_' and must be kept secure.",
    example: "wah_a1b2c3d4e5f6g7h8i9j0...",
  },
  {
    term: "Base URL",
    definition: "Your webhook endpoint base. The gateway appends paths like /fhir/process-query to call your system.",
    example: "https://api.yourhospital.com",
  },
  {
    term: "Transaction",
    definition: "A single data exchange request. Has a unique ID and progresses through status states.",
    example: "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
] as const;

// ============================================================================
// QUICK START CHECKLIST
// ============================================================================

export const quickStartSteps = [
  {
    step: 1,
    action: "Register Provider",
    endpoint: "Admin Process",
    result: "Provider ID",
  },
  {
    step: 2,
    action: "Implement Webhooks",
    endpoint: "Your server",
    result: "/fhir/process-query & /fhir/receive-results",
  },
  {
    step: 3,
    action: "Discover Providers",
    endpoint: "GET /api/v1/providers",
    result: "List of target IDs",
  },
  {
    step: 4,
    action: "Request Data",
    endpoint: "POST /api/v1/fhir/request/{type}",
    result: "Transaction ID",
  },
] as const;