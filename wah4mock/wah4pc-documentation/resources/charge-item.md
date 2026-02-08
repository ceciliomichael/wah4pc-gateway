import type { ResourceDefinition } from "./types";

export const chargeItemResource: ResourceDefinition = {
  id: "charge-item",
  name: "ChargeItem",
  title: "Charge Item",
  description:
    "The resource ChargeItem describes the provision of healthcare provider products for a certain patient, therefore referring not only to the product, but also to the subject of provision (patient). This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/ChargeItem",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/ChargeItem",
  fields: [
    {
      name: "identifier",
      path: "ChargeItem.identifier",
      type: "Identifier[]",
      description: "Business identifier for the charge item",
      required: false,
    },
    {
      name: "status",
      path: "ChargeItem.status",
      type: "code",
      description: "The status of the charge item (planned | billable | not-billable | aborted | billed | entered-in-error | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/chargeitem-status",
        displayName: "ChargeItem Status",
      },
    },
    {
      name: "code",
      path: "ChargeItem.code",
      type: "CodeableConcept",
      description: "A code identifying the charge item",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/chargeitem-billingcodes",
        displayName: "ChargeItem Billing Codes",
      },
    },
    {
      name: "subject",
      path: "ChargeItem.subject",
      type: "Reference",
      description: "Individual service was provided to",
      required: true,
      referenceTarget: ["Patient", "Group"],
    },
    {
      name: "context",
      path: "ChargeItem.context",
      type: "Reference",
      description: "Encounter/Episode associated with the charge item",
      required: false,
      referenceTarget: ["Encounter", "EpisodeOfCare"],
    },
    {
      name: "occurrenceDateTime",
      path: "ChargeItem.occurrence[x]",
      type: "dateTime",
      description: "When the charged service was provided",
      required: false,
    },
    {
      name: "performer",
      path: "ChargeItem.performer",
      type: "BackboneElement[]",
      description: "Who performed or participated in the charge item",
      required: false,
    },
    {
      name: "performingOrganization",
      path: "ChargeItem.performingOrganization",
      type: "Reference",
      description: "Organization providing the service",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "quantity",
      path: "ChargeItem.quantity",
      type: "Quantity",
      description: "Quantity of the charge item",
      required: false,
    },
    {
      name: "priceOverride",
      path: "ChargeItem.priceOverride",
      type: "Money",
      description: "Price overriding the associated rules",
      required: false,
    },
    {
      name: "enterer",
      path: "ChargeItem.enterer",
      type: "Reference",
      description: "Individual who entered the charge item",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization", "Patient", "Device", "RelatedPerson"],
    },
  ],
  jsonTemplate: `{
  "resourceType": "ChargeItem",
  "id": "example-charge-item",
  "status": "billable",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "85984002",
        "display": "Laboratory test"
      }
    ],
    "text": "Complete Blood Count"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "context": {
    "reference": "Encounter/example-encounter"
  },
  "occurrenceDateTime": "2024-01-15T09:00:00Z",
  "performer": [
    {
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0912",
            "code": "SPRF",
            "display": "Secondary Performer"
          }
        ]
      },
      "actor": {
        "reference": "Practitioner/example-practitioner",
        "display": "Dr. Maria Santos"
      }
    }
  ],
  "performingOrganization": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "quantity": {
    "value": 1
  },
  "priceOverride": {
    "value": 500.00,
    "currency": "PHP"
  }
}`,
};