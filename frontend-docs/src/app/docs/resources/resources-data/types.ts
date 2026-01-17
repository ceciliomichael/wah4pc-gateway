// FHIR Resource Schema Type Definitions for PH Core Gateway

export type ResourceSlug = "patient" | "encounter" | "procedure" | "immunization" | "observation" | "medication";

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