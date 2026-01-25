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
      "Overview of all 24 supported FHIR resource types (PH Core and Base R4) with links to detailed schemas and validation rules",
  },
  // PH Core Resources
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
  "resources/location": {
    id: "resources/location",
    title: "PH Core Location",
    description:
      "Location resource schema localized for Philippines with PSGC coding for region, province, city/municipality, and barangay",
  },
  "resources/organization": {
    id: "resources/organization",
    title: "PH Core Organization",
    description:
      "Organization resource schema with DOH National Health Facilities Registry (NHFR) code support and PSGC address extensions",
  },
  "resources/practitioner": {
    id: "resources/practitioner",
    title: "PH Core Practitioner",
    description:
      "Practitioner resource schema with PRC license identifier support and PH Core address extensions",
  },

  // Base R4 - Financial/Administrative
  "resources/account": {
    id: "resources/account",
    title: "Account",
    description:
      "Financial account for tracking charges for a patient or cost center",
  },
  "resources/claim": {
    id: "resources/claim",
    title: "Claim",
    description:
      "Provider-issued list of services and products for insurance reimbursement (e.g., PhilHealth)",
  },
  "resources/claim-response": {
    id: "resources/claim-response",
    title: "ClaimResponse",
    description:
      "Adjudication details and payment advice from an insurer in response to a Claim",
  },
  "resources/charge-item": {
    id: "resources/charge-item",
    title: "ChargeItem",
    description:
      "Itemized record of provided product or service for billing purposes",
  },
  "resources/charge-item-definition": {
    id: "resources/charge-item-definition",
    title: "ChargeItemDefinition",
    description:
      "Definition of billing codes, prices, and rules for charge items",
  },
  "resources/invoice": {
    id: "resources/invoice",
    title: "Invoice",
    description:
      "List of ChargeItems with calculated totals for billing a patient or organization",
  },
  "resources/payment-notice": {
    id: "resources/payment-notice",
    title: "PaymentNotice",
    description:
      "Notification of payment status or clearing details",
  },
  "resources/payment-reconciliation": {
    id: "resources/payment-reconciliation",
    title: "PaymentReconciliation",
    description:
      "Bulk payment details and references to Claims being settled",
  },

  // Base R4 - Clinical/Other
  "resources/allergy-intolerance": {
    id: "resources/allergy-intolerance",
    title: "AllergyIntolerance",
    description:
      "Record of patient allergies and adverse reactions to substances",
  },
  "resources/condition": {
    id: "resources/condition",
    title: "Condition",
    description:
      "Clinical condition, diagnosis, problem, or issue that has risen to a level of concern",
  },
  "resources/diagnostic-report": {
    id: "resources/diagnostic-report",
    title: "DiagnosticReport",
    description:
      "Findings and interpretation of diagnostic tests (lab, imaging, etc.)",
  },
  "resources/medication-administration": {
    id: "resources/medication-administration",
    title: "MedicationAdministration",
    description:
      "Record of a medication actually given to a patient",
  },
  "resources/medication-request": {
    id: "resources/medication-request",
    title: "MedicationRequest",
    description:
      "Order or prescription for medication to be supplied and instructions for use",
  },
  "resources/nutrition-order": {
    id: "resources/nutrition-order",
    title: "NutritionOrder",
    description:
      "Request for diet, formula feeding, or nutritional supplements",
  },
  "resources/practitioner-role": {
    id: "resources/practitioner-role",
    title: "PractitionerRole",
    description:
      "Roles, specialties, and services a practitioner performs at an organization",
  },
};