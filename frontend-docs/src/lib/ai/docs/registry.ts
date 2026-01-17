/**
 * Documentation Page and Section Registry
 * Centralized metadata for all documentation pages
 */

import type { PageInfo, SectionInfo } from "./types";

/**
 * PAGE_REGISTRY - Structured metadata about each documentation page
 * This is the source of truth for what pages exist in the documentation
 */
export const PAGE_REGISTRY: Record<string, PageInfo> = {
  introduction: {
    id: "introduction",
    title: "Introduction",
    description:
      "Overview of WAH4PC Gateway, core capabilities, system architecture diagram, quick start links, and supported FHIR resources",
  },
  architecture: {
    id: "architecture",
    title: "System Architecture",
    description:
      "Detailed system architecture with sequence diagrams, transaction states, data models (Provider, Transaction), and key architectural points",
  },
  "system-flow": {
    id: "system-flow",
    title: "System Flow",
    description:
      "High-level ecosystem lifecycle: Onboarding, Discovery, Security, Data Exchange, and Monitoring phases with diagrams and key concepts",
  },
  flow: {
    id: "flow",
    title: "Transaction Flow",
    description:
      "Detailed transaction lifecycle with step-by-step flow, JSON request/response examples, transaction ID importance, and error scenarios",
  },
  integration: {
    id: "integration",
    title: "Integration Guide",
    description:
      "Complete integration guide with webhook implementation, code examples (Node.js/TypeScript, Go), required headers, and best practices",
  },
  api: {
    id: "api",
    title: "API Reference",
    description:
      "Complete API documentation: Health, Providers, FHIR Gateway, and Transactions endpoints with authentication, rate limiting, and error codes",
  },
  resources: {
    id: "resources",
    title: "FHIR Resources",
    description:
      "Overview of the 6 supported FHIR resource types (Patient, Encounter, Procedure, Immunization, Observation, Medication) with links to detailed schemas",
  },
  "resources/patient": {
    id: "resources/patient",
    title: "PH Core Patient",
    description:
      "Patient resource schema with required extensions (indigenousPeople), PH Core Address profile, PhilHealth ID identifiers, and complete JSON template",
  },
  "resources/encounter": {
    id: "resources/encounter",
    title: "PH Core Encounter",
    description:
      "Encounter resource schema with status codes, class codes (AMB, IMP), subject reference to PH Core Patient, and participant references",
  },
  "resources/procedure": {
    id: "resources/procedure",
    title: "PH Core Procedure",
    description:
      "Procedure resource schema with SNOMED CT codes, subject/encounter references to PH Core profiles, performer details, and body site coding",
  },
  "resources/immunization": {
    id: "resources/immunization",
    title: "PH Core Immunization",
    description:
      "Immunization resource schema with CVX vaccine codes, patient/encounter references, dose quantity, lot number, and funding source",
  },
  "resources/observation": {
    id: "resources/observation",
    title: "PH Core Observation",
    description:
      "Observation resource schema with LOINC codes for vital signs/labs, subject/encounter references, component values (e.g., blood pressure systolic/diastolic)",
  },
  "resources/medication": {
    id: "resources/medication",
    title: "PH Core Medication",
    description:
      "Medication resource schema with PH Core drugs ValueSet binding, form codes, ingredient details, and batch information",
  },
};

/**
 * SECTION_REGISTRY - Maps to actual section IDs in page.tsx files
 * These IDs correspond to <section id="..."> in the React components
 */
export const SECTION_REGISTRY: Record<string, SectionInfo[]> = {
  introduction: [],

  architecture: [
    {
      id: "components",
      name: "System Components",
      description:
        "Sequence diagram showing provider request and response flows through the gateway",
    },
    {
      id: "transaction-flow",
      name: "Transaction Flow",
      description:
        "Detailed sequence diagram of query initiation, async processing, and data relay phases",
    },
    {
      id: "states",
      name: "Transaction States",
      description:
        "State machine: PENDING → RECEIVED → COMPLETED or FAILED with transitions",
    },
    {
      id: "models",
      name: "Data Models",
      description:
        "Provider and Transaction JSON structures with field descriptions",
    },
  ],

  "system-flow": [
    {
      id: "intro",
      name: "Introduction",
      description:
        "Overview of the WAH4PC Gateway and comparison between System Flow and Transaction Flow",
    },
    {
      id: "lifecycle",
      name: "The Provider Lifecycle",
      description:
        "5-phase ecosystem lifecycle: Onboard → Discover → Secure → Exchange → Monitor",
    },
    {
      id: "phases",
      name: "Phase-by-Phase Breakdown",
      description:
        "Detailed breakdown of each phase with diagrams and key insights",
    },
    {
      id: "comparison",
      name: "System Flow vs Transaction Flow",
      description:
        "Comparison table explaining the difference between macro and micro level flows",
    },
    {
      id: "concepts",
      name: "Key Concepts",
      description:
        "Provider ID, API Key, Base URL, Transaction definitions and examples",
    },
    {
      id: "quick-start",
      name: "Quick Start Path",
      description:
        "Step-by-step guide from registration to first data exchange",
    },
    {
      id: "next-steps",
      name: "Next Steps",
      description:
        "Links to Provider Integration and Transaction Flow documentation",
    },
  ],

  flow: [
    {
      id: "intro",
      name: "Introduction",
      description:
        "Overview of the asynchronous request/response model and transaction_id importance",
    },
    {
      id: "transaction-id",
      name: "The Transaction ID",
      description:
        "Why transaction_id matters: correlation, async processing, audit trail, idempotency",
    },
    {
      id: "lifecycle",
      name: "Complete Transaction Lifecycle",
      description:
        "Complete flow sequence diagram from request initiation to final response",
    },
    {
      id: "step-by-step",
      name: "Step-by-Step with JSON Examples",
      description:
        "Detailed walkthrough with request/response payloads for each step",
    },
    {
      id: "consistency",
      name: "Consistency Rules",
      description:
        "Rules for handling transaction_id: never modify, always include, store locally",
    },
    {
      id: "errors",
      name: "Common Error Scenarios",
      description:
        "Common errors: missing transaction_id, transaction not found, with examples",
    },
    {
      id: "steps",
      name: "Detailed Step Reference",
      description:
        "Comprehensive breakdown of each step in the transaction lifecycle",
    },
    {
      id: "summary",
      name: "Summary",
      description:
        "Key takeaways about transaction_id handling and async processing",
    },
  ],

  integration: [
    {
      id: "prerequisites",
      name: "Prerequisites",
      description:
        "Requirements before starting integration: HTTPS endpoint, FHIR knowledge, etc.",
    },
    {
      id: "flow",
      name: "Integration Flow Overview",
      description:
        "Complete integration flow diagram showing registration, requesting, and providing data",
    },
    {
      id: "registration",
      name: "Register Your Organization",
      description:
        "Step 1: POST /api/v1/providers to create a provider record",
    },
    {
      id: "webhooks",
      name: "Implement Webhook Endpoints",
      description:
        "Step 2: Two required webhooks - /fhir/process-query and /fhir/receive-results",
    },
    {
      id: "identifiers",
      name: "Understanding Patient Identifiers",
      description:
        "FHIR-compliant identifiers with system URIs and matching logic",
    },
    {
      id: "requests",
      name: "Request Data from Other Providers",
      description:
        "Step 3: Initiate queries using POST /api/v1/fhir/request/{resourceType}",
    },
    {
      id: "best-practices",
      name: "Best Practices",
      description:
        "Security, error handling, idempotency, and async processing recommendations",
    },
    {
      id: "pitfalls",
      name: "Common Pitfalls to Avoid",
      description:
        "Common mistakes and how to avoid them during integration",
    },
    {
      id: "security",
      name: "Security Considerations",
      description:
        "Security best practices for API keys, HTTPS, and data protection",
    },
    {
      id: "examples",
      name: "Complete Webhook Implementation",
      description:
        "Production-ready code examples in Node.js, Go, Python, and Dart",
    },
    {
      id: "checklist",
      name: "Integration Checklist",
      description:
        "Final checklist to verify your integration is complete",
    },
  ],

  api: [
    {
      id: "base-url",
      name: "Base URL",
      description: "Gateway base URL for all API requests",
    },
    {
      id: "auth",
      name: "Authentication",
      description:
        "API key authentication via X-API-Key or Authorization header",
    },
    {
      id: "endpoints",
      name: "API Endpoints",
      description:
        "All available endpoints: Health, Providers, FHIR Gateway, and Transactions",
    },
    {
      id: "errors",
      name: "Error Responses",
      description:
        "Standard error format and HTTP status codes: 400, 401, 403, 404, 429, 500, etc.",
    },
    {
      id: "rate-limiting",
      name: "Rate Limiting",
      description:
        "Rate limit enforcement, 429 responses, exponential backoff recommendations",
    },
  ],

  resources: [
    {
      id: "code-systems",
      name: "Common Code Systems",
      description:
        "Standard terminology systems: SNOMED CT, LOINC, CVX, RxNorm, PSGC, PSOC, PSCED",
    },
  ],

  "resources/patient": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Required and optional fields for PH Core Patient including indigenousPeople extension",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example with Quezon City address, NCR region, PhilHealth ID",
    },
  ],
  "resources/encounter": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Required fields: status, class, subject (PH Core Patient reference)",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example with AMB class, participant, and period",
    },
  ],
  "resources/procedure": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Required fields: status, subject. References PH Core Patient and Encounter",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example with SNOMED CT procedure code, performer, and body site",
    },
  ],
  "resources/immunization": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Required fields: status, vaccineCode, patient, occurrenceDateTime",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example with CVX vaccine code, dose quantity, lot number, and funding source",
    },
  ],
  "resources/observation": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Required fields: status, code, subject. Supports vital signs and lab results",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example for blood pressure with systolic/diastolic components",
    },
  ],
  "resources/medication": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Code field bound to PH Core drugs ValueSet. Supports form, ingredients, and batch info",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "Complete JSON example with drug code, form, ingredient strength, and batch details",
    },
  ],
};

/**
 * Generates a formatted string listing all available pages
 * Used for injecting into the AI system prompt
 */
export function getPagesContextString(): string {
  const pages = Object.values(PAGE_REGISTRY);
  const lines: string[] = [];

  for (const page of pages) {
    lines.push(`- **${page.title}** (\`${page.id}\`): ${page.description}`);
  }

  return lines.join("\n");
}

/**
 * Get all page IDs as an array
 */
export function getAllPageIds(): string[] {
  return Object.keys(PAGE_REGISTRY);
}

/**
 * Check if a page exists in the registry
 */
export function isValidPage(pageId: string): boolean {
  return pageId.toLowerCase().trim() in PAGE_REGISTRY;
}