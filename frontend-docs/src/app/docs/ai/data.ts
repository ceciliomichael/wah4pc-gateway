// Mermaid diagrams for AI Capabilities page

export const aiWorkflowDiagram = `
sequenceDiagram
    participant P as Healthcare Provider
    participant GW as WAH4PC Gateway
    participant AI as AI Processing Engine
    participant T as Target Provider

    rect rgb(240, 249, 255)
        Note over P,T: AI-Enhanced Request Flow
        P->>GW: POST /api/v1/fhir/request/Patient
        GW->>AI: Analyze Request Context
        AI->>AI: Extract Clinical Intent
        AI->>AI: Determine Optimal Routing
        AI-->>GW: Routing Recommendation
        GW->>T: Forward to Best Match
        T-->>GW: Response Data
        GW-->>P: Enhanced Response
    end
`;

export const aiAnalysisDiagram = `
sequenceDiagram
    participant D as FHIR Data
    participant AI as AI Engine
    participant R as Results

    rect rgb(240, 253, 244)
        Note over D,R: Data Analysis Pipeline
        D->>AI: Raw FHIR Bundle
        AI->>AI: Parse Resources
        AI->>AI: Extract Patterns
        AI->>AI: Generate Insights
        AI-->>R: Structured Analysis
    end

    rect rgb(254, 252, 232)
        Note over D,R: Quality Validation
        D->>AI: Incoming Data
        AI->>AI: Schema Validation
        AI->>AI: Completeness Check
        AI->>AI: Anomaly Detection
        AI-->>R: Validation Report
    end
`;

// Feature cards data
export const aiFeatures = [
  {
    iconName: "Brain" as const,
    title: "Smart Routing",
    description: "AI-powered routing decisions based on clinical context and provider capabilities",
  },
  {
    iconName: "Sparkles" as const,
    title: "Data Enrichment",
    description: "Automatic enhancement of FHIR resources with inferred metadata",
  },
  {
    iconName: "Shield" as const,
    title: "Anomaly Detection",
    description: "Real-time identification of unusual patterns in healthcare data",
  },
  {
    iconName: "Zap" as const,
    title: "Predictive Analytics",
    description: "Forecast patient needs and optimize resource allocation",
  },
] as const;

// Capabilities table data
export interface AiCapabilityData {
  capability: string;
  description: string;
  status: string;
  statusColor: string;
  [key: string]: unknown;
}

export const aiCapabilities: AiCapabilityData[] = [
  {
    capability: "Clinical NLP",
    description: "Extract structured data from clinical narratives",
    status: "Available",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    capability: "Resource Classification",
    description: "Automatically categorize FHIR resources by type and priority",
    status: "Available",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    capability: "Provider Matching",
    description: "Match requests to optimal target providers",
    status: "Available",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    capability: "Trend Analysis",
    description: "Identify patterns across historical transactions",
    status: "Beta",
    statusColor: "bg-yellow-100 text-yellow-800",
  },
  {
    capability: "Predictive Routing",
    description: "Anticipate provider availability and response times",
    status: "Coming Soon",
    statusColor: "bg-slate-100 text-slate-600",
  },
];

// Key benefits
export const keyBenefits = [
  "Reduced manual intervention in routing decisions",
  "Improved data quality through automated validation",
  "Faster transaction processing with intelligent prioritization",
  "Enhanced interoperability with smart format detection",
] as const;

// Integration example
export const integrationExample = {
  title: "AI-Enhanced Request",
  code: `POST /api/v1/fhir/request/Patient
X-API-Key: your-api-key
X-AI-Assist: true

{
  "targetId": "auto",
  "resourceType": "Patient",
  "patientId": "patient-123",
  "metadata": {
    "reason": "Specialist Referral",
    "urgency": "routine",
    "aiContext": {
      "preferredSpecialty": "cardiology",
      "locationPreference": "nearest"
    }
  }
}`,
  description: "Enable AI-assisted routing by setting X-AI-Assist header and using 'auto' as targetId.",
};

// Configuration options
export const configOptions = [
  {
    option: "X-AI-Assist",
    type: "Header",
    values: "true | false",
    description: "Enable AI processing for the request",
  },
  {
    option: "targetId",
    type: "Body",
    values: "'auto' | provider-id",
    description: "Use 'auto' for AI-based provider selection",
  },
  {
    option: "aiContext",
    type: "Body",
    values: "object",
    description: "Additional context to guide AI decisions",
  },
] as const;