import type { ResourceDefinition } from "./types";

export const claimResource: ResourceDefinition = {
  id: "claim",
  name: "Claim",
  title: "Claim",
  description:
    "A provider issued list of professional services and products which have been provided, or are to be provided, to a patient which is sent to an insurer for reimbursement. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/Claim",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Claim",
  fields: [
    {
      name: "identifier",
      path: "Claim.identifier",
      type: "Identifier[]",
      description: "Business identifier for the claim",
      required: false,
    },
    {
      name: "status",
      path: "Claim.status",
      type: "code",
      description: "The status of the claim (active | cancelled | draft | entered-in-error)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/fm-status",
        displayName: "Financial Resource Status",
      },
    },
    {
      name: "type",
      path: "Claim.type",
      type: "CodeableConcept",
      description: "Category of claim (institutional | oral | pharmacy | professional | vision)",
      required: true,
      binding: {
        strength: "extensible",
        valueSet: "http://hl7.org/fhir/ValueSet/claim-type",
        displayName: "Claim Type",
      },
    },
    {
      name: "use",
      path: "Claim.use",
      type: "code",
      description: "Purpose of the claim (claim | preauthorization | predetermination)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/claim-use",
        displayName: "Claim Use",
      },
    },
    {
      name: "patient",
      path: "Claim.patient",
      type: "Reference",
      description: "The recipient of the products and services",
      required: true,
      referenceTarget: ["Patient"],
    },
    {
      name: "created",
      path: "Claim.created",
      type: "dateTime",
      description: "Resource creation date",
      required: true,
    },
    {
      name: "insurer",
      path: "Claim.insurer",
      type: "Reference",
      description: "Target payor (e.g., PhilHealth)",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "provider",
      path: "Claim.provider",
      type: "Reference",
      description: "Party responsible for the claim",
      required: true,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization"],
    },
    {
      name: "priority",
      path: "Claim.priority",
      type: "CodeableConcept",
      description: "Desired processing priority",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/process-priority",
        displayName: "Process Priority",
      },
    },
    {
      name: "diagnosis",
      path: "Claim.diagnosis",
      type: "BackboneElement[]",
      description: "Pertinent diagnosis information",
      required: false,
    },
    {
      name: "item",
      path: "Claim.item",
      type: "BackboneElement[]",
      description: "Product or service provided",
      required: false,
    },
    {
      name: "total",
      path: "Claim.total",
      type: "Money",
      description: "Total claim cost",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Claim",
  "id": "example-claim",
  "status": "active",
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/claim-type",
        "code": "institutional",
        "display": "Institutional"
      }
    ]
  },
  "use": "claim",
  "patient": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "created": "2024-01-15T10:00:00Z",
  "insurer": {
    "reference": "Organization/philhealth",
    "display": "Philippine Health Insurance Corporation"
  },
  "provider": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "priority": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/processpriority",
        "code": "normal",
        "display": "Normal"
      }
    ]
  },
  "diagnosis": [
    {
      "sequence": 1,
      "diagnosisCodeableConcept": {
        "coding": [
          {
            "system": "http://hl7.org/fhir/sid/icd-10",
            "code": "J18.9",
            "display": "Pneumonia, unspecified organism"
          }
        ]
      }
    }
  ],
  "total": {
    "value": 50000.00,
    "currency": "PHP"
  }
}`,
};