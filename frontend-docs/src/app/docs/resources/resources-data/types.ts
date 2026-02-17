// FHIR Resource Schema Type Definitions for PH Core Gateway

// PH Core resources (validated against Philippine Core profiles)
export type PhCoreResourceSlug = 
  | "patient" 
  | "encounter" 
  | "procedure" 
  | "immunization" 
  | "observation" 
  | "medication"
  | "location"
  | "organization"
  | "practitioner";

// Base R4 resources (validated against standard HL7 FHIR R4)
export type BaseR4ResourceSlug =
  | "appointment"
  | "account"
  | "allergy-intolerance"
  | "charge-item"
  | "charge-item-definition"
  | "claim"
  | "claim-response"
  | "condition"
  | "diagnostic-report"
  | "invoice"
  | "medication-administration"
  | "medication-request"
  | "nutrition-order"
  | "payment-notice"
  | "payment-reconciliation"
  | "practitioner-role";

export type ResourceSlug = PhCoreResourceSlug | BaseR4ResourceSlug;

export interface FieldDefinition {
  name: string;
  path: string;
  type: string;
  description: string;
  required: boolean;
  binding?: {
    strength: "required" | "extensible" | "preferred" | "example";
    valueSet: string;
    displayName?: string;
  };
  pattern?: string;
  referenceTarget?: string[];
}

export interface ResourceDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  querySelectorRequirement?: "patient" | "resource";
  profileUrl: string;
  fhirVersion: string;
  baseDefinition: string;
  fields: FieldDefinition[];
  jsonTemplate: string;
}

export interface CodeSystem {
  name: string;
  url: string;
  description: string;
}

export interface PageInfo {
  title: string;
  description: string;
  endpoint: string;
  supportedResources: string[];
}
