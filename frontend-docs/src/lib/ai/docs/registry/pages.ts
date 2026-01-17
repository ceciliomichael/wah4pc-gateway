/**
 * Page Registry
 * Metadata for all documentation pages
 */

import type { PageInfo } from "../types";

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