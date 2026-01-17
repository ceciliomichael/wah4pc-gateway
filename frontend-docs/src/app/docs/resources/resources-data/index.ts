// Barrel export for FHIR Resource data - scalable modular structure
// Add new resources by creating a new file and importing here

// Type exports
export type { ResourceSlug, FieldDefinition, ResourceDefinition, CodeSystem, PageInfo } from "./types";

// Individual resource exports
export { patientResource } from "./patient";
export { encounterResource } from "./encounter";
export { procedureResource } from "./procedure";
export { immunizationResource } from "./immunization";
export { observationResource } from "./observation";
export { medicationResource } from "./medication";

// Import for aggregation
import { patientResource } from "./patient";
import { encounterResource } from "./encounter";
import { procedureResource } from "./procedure";
import { immunizationResource } from "./immunization";
import { observationResource } from "./observation";
import { medicationResource } from "./medication";
import type { ResourceDefinition, ResourceSlug, CodeSystem, PageInfo } from "./types";

// Aggregated resources array - order matters for display
export const resources: ResourceDefinition[] = [
  patientResource,
  encounterResource,
  procedureResource,
  immunizationResource,
  observationResource,
  medicationResource,
];

// Page metadata
export const pageInfo: PageInfo = {
  title: "FHIR Resources",
  description:
    "Detailed schema documentation for the 6 FHIR resource types supported by the WAH4PC Gateway. Each resource must conform to the Philippine Core (PH Core) profiles when submitted to the /receive/{resourceType} endpoint.",
  endpoint: "/receive/{resourceType}",
  supportedResources: ["Patient", "Encounter", "Procedure", "Immunization", "Observation", "Medication"],
};

// Common code systems used across resources
export const commonCodeSystems: CodeSystem[] = [
  {
    name: "SNOMED CT",
    url: "http://snomed.info/sct",
    description: "Systematized Nomenclature of Medicine - Clinical Terms for clinical concepts",
  },
  {
    name: "LOINC",
    url: "http://loinc.org",
    description: "Logical Observation Identifiers Names and Codes for laboratory and clinical observations",
  },
  {
    name: "CVX",
    url: "http://hl7.org/fhir/sid/cvx",
    description: "CDC Vaccine Administered codes for immunizations",
  },
  {
    name: "RxNorm",
    url: "http://www.nlm.nih.gov/research/umls/rxnorm",
    description: "Normalized names for clinical drugs",
  },
  {
    name: "PSGC",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
    description: "Philippine Standard Geographic Code for location references",
  },
  {
    name: "PSOC",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSOC",
    description: "Philippine Standard Occupational Classification",
  },
  {
    name: "PSCED",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSCED",
    description: "Philippine Standard Classification of Education",
  },
];

// Helper function to get a resource by slug
export function getResourceBySlug(slug: string): ResourceDefinition | undefined {
  return resources.find((r) => r.id === slug);
}

// Get all resource slugs for static generation
export function getAllResourceSlugs(): ResourceSlug[] {
  return resources.map((r) => r.id) as ResourceSlug[];
}