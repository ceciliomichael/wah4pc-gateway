import type { ResourceDefinition } from "./types";

export const accountResource: ResourceDefinition = {
  id: "account",
  name: "Account",
  title: "Account",
  description:
    "A financial tool for tracking value accrued for a particular purpose. In the healthcare field, used to track charges for a patient, cost centers, etc. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/Account",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Account",
  fields: [
    {
      name: "identifier",
      path: "Account.identifier",
      type: "Identifier[]",
      description: "Unique identifier for the account",
      required: false,
    },
    {
      name: "status",
      path: "Account.status",
      type: "code",
      description: "Whether the account is currently usable (active | inactive | entered-in-error | on-hold | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/account-status",
        displayName: "Account Status",
      },
    },
    {
      name: "type",
      path: "Account.type",
      type: "CodeableConcept",
      description: "Categorizes the account for reporting and searching purposes",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/account-type",
        displayName: "Account Type",
      },
    },
    {
      name: "name",
      path: "Account.name",
      type: "string",
      description: "Human-readable label for the account",
      required: false,
    },
    {
      name: "subject",
      path: "Account.subject",
      type: "Reference[]",
      description: "The entity that caused the expenses (Patient, Device, Practitioner, Location, HealthcareService, Organization)",
      required: false,
      referenceTarget: ["Patient", "Device", "Practitioner", "Location", "HealthcareService", "Organization"],
    },
    {
      name: "servicePeriod",
      path: "Account.servicePeriod",
      type: "Period",
      description: "The date range of services associated with this account",
      required: false,
    },
    {
      name: "owner",
      path: "Account.owner",
      type: "Reference",
      description: "Entity managing the account",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "description",
      path: "Account.description",
      type: "string",
      description: "Explanation of the account's purpose",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Account",
  "id": "example-account",
  "status": "active",
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "PBILLACCT",
        "display": "Patient Billing Account"
      }
    ]
  },
  "name": "Patient Billing Account",
  "subject": [
    {
      "reference": "Patient/example-patient",
      "display": "Juan Dela Cruz"
    }
  ],
  "servicePeriod": {
    "start": "2024-01-01"
  },
  "owner": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "description": "Hospital charges for inpatient stay"
}`,
};