/**
 * Section Registry
 * Maps page IDs to their section metadata
 */

import type { SectionInfo } from "../types";

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
        "Step 1: Contact Administrator to register your organization",
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

  "request-formats": [
    {
      id: "overview",
      name: "Overview",
      description:
        "Full markdown content from format/request-formats.md including all 25 request formats",
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

  // PH Core Resources
  "resources/location": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "PH Core Location with PSGC address extensions and managing organization reference",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a hospital building location with PSGC-coded address",
    },
  ],
  "resources/organization": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "PH Core Organization with DOH NHFR code identifier and PSGC address extensions",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a healthcare provider organization with facility ID",
    },
  ],
  "resources/practitioner": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "PH Core Practitioner with PRC license identifier and qualification details",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a physician with license number and contact details",
    },
  ],
  "resources/appointment": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 Appointment with status, start/end, and participant references",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a booked appointment between patient and practitioner",
    },
  ],

  // Base R4 - Financial/Administrative
  "resources/account": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 Account resource structure for tracking financial obligations",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a patient billing account",
    },
  ],
  "resources/claim": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 Claim resource with insurance details, diagnosis, and items",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of an institutional claim submission",
    },
  ],
  "resources/claim-response": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 ClaimResponse with adjudication results and payment status",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of an approved claim response with payment details",
    },
  ],
  "resources/charge-item": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 ChargeItem for individual billable services or products",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a charge for a lab test",
    },
  ],
  "resources/charge-item-definition": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 ChargeItemDefinition for cataloging billable items and prices",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a price definition for a service",
    },
  ],
  "resources/invoice": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 Invoice grouping charge items with total gross/net amounts",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a patient invoice with line items",
    },
  ],
  "resources/payment-notice": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 PaymentNotice indicating payment status and amount",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a payment notification",
    },
  ],
  "resources/payment-reconciliation": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 PaymentReconciliation for bulk payments and claim linkages",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a reconciliation for a payment batch",
    },
  ],

  // Base R4 - Clinical/Other
  "resources/allergy-intolerance": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 AllergyIntolerance with substance code, reaction, and criticality",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a medication allergy",
    },
  ],
  "resources/condition": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 Condition with clinical status, verification status, and code",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a clinical diagnosis",
    },
  ],
  "resources/diagnostic-report": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 DiagnosticReport with status, code, and result references",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a laboratory report with results",
    },
  ],
  "resources/medication-administration": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 MedicationAdministration with medication, dosage, and time",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a drug administration event",
    },
  ],
  "resources/medication-request": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 MedicationRequest with intent, priority, and dosage instructions",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a medication prescription",
    },
  ],
  "resources/nutrition-order": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 NutritionOrder for diet, formula, or supplements",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a dietary order",
    },
  ],
  "resources/practitioner-role": [
    {
      id: "structure",
      name: "Structure Definition",
      description:
        "Standard R4 PractitionerRole linking practitioner, organization, and location",
    },
    {
      id: "template",
      name: "JSON Template",
      description:
        "JSON example of a doctor's role at a hospital",
    },
  ],
};
