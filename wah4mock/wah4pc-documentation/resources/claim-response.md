import type { ResourceDefinition } from "./types";

export const claimResponseResource: ResourceDefinition = {
  id: "claim-response",
  name: "ClaimResponse",
  title: "Claim Response",
  description:
    "This resource provides the adjudication details from the processing of a Claim resource. It is the response to a Claim submission from an insurer. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/ClaimResponse",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/ClaimResponse",
  fields: [
    {
      name: "identifier",
      path: "ClaimResponse.identifier",
      type: "Identifier[]",
      description: "Business identifier for the claim response",
      required: false,
    },
    {
      name: "status",
      path: "ClaimResponse.status",
      type: "code",
      description: "The status of the response (active | cancelled | draft | entered-in-error)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/fm-status",
        displayName: "Financial Resource Status",
      },
    },
    {
      name: "type",
      path: "ClaimResponse.type",
      type: "CodeableConcept",
      description: "Category of claim response",
      required: true,
      binding: {
        strength: "extensible",
        valueSet: "http://hl7.org/fhir/ValueSet/claim-type",
        displayName: "Claim Type",
      },
    },
    {
      name: "use",
      path: "ClaimResponse.use",
      type: "code",
      description: "Purpose (claim | preauthorization | predetermination)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/claim-use",
        displayName: "Claim Use",
      },
    },
    {
      name: "patient",
      path: "ClaimResponse.patient",
      type: "Reference",
      description: "The recipient of the products and services",
      required: true,
      referenceTarget: ["Patient"],
    },
    {
      name: "created",
      path: "ClaimResponse.created",
      type: "dateTime",
      description: "Response creation date",
      required: true,
    },
    {
      name: "insurer",
      path: "ClaimResponse.insurer",
      type: "Reference",
      description: "Party responsible for adjudication",
      required: true,
      referenceTarget: ["Organization"],
    },
    {
      name: "request",
      path: "ClaimResponse.request",
      type: "Reference",
      description: "The original claim reference",
      required: false,
      referenceTarget: ["Claim"],
    },
    {
      name: "outcome",
      path: "ClaimResponse.outcome",
      type: "code",
      description: "Result of the adjudication (queued | complete | error | partial)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/remittance-outcome",
        displayName: "Remittance Outcome",
      },
    },
    {
      name: "disposition",
      path: "ClaimResponse.disposition",
      type: "string",
      description: "Disposition message",
      required: false,
    },
    {
      name: "total",
      path: "ClaimResponse.total",
      type: "BackboneElement[]",
      description: "Adjudication totals",
      required: false,
    },
    {
      name: "payment",
      path: "ClaimResponse.payment",
      type: "BackboneElement",
      description: "Payment details",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "ClaimResponse",
  "id": "example-claim-response",
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
  "created": "2024-01-20T14:00:00Z",
  "insurer": {
    "reference": "Organization/philhealth",
    "display": "Philippine Health Insurance Corporation"
  },
  "request": {
    "reference": "Claim/example-claim"
  },
  "outcome": "complete",
  "disposition": "Claim processed successfully",
  "total": [
    {
      "category": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/adjudication",
            "code": "submitted",
            "display": "Submitted Amount"
          }
        ]
      },
      "amount": {
        "value": 50000.00,
        "currency": "PHP"
      }
    },
    {
      "category": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/adjudication",
            "code": "benefit",
            "display": "Benefit Amount"
          }
        ]
      },
      "amount": {
        "value": 35000.00,
        "currency": "PHP"
      }
    }
  ],
  "payment": {
    "type": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/ex-paymenttype",
          "code": "complete",
          "display": "Complete"
        }
      ]
    },
    "date": "2024-01-25",
    "amount": {
      "value": 35000.00,
      "currency": "PHP"
    }
  }
}`,
};