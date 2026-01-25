import type { ResourceDefinition } from "./types";

export const chargeItemDefinitionResource: ResourceDefinition = {
  id: "charge-item-definition",
  name: "ChargeItemDefinition",
  title: "Charge Item Definition",
  description:
    "The ChargeItemDefinition resource provides the properties that apply to the (billing) codes necessary to calculate costs and prices. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/ChargeItemDefinition",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/ChargeItemDefinition",
  fields: [
    {
      name: "url",
      path: "ChargeItemDefinition.url",
      type: "uri",
      description: "Canonical identifier for this charge item definition",
      required: true,
    },
    {
      name: "identifier",
      path: "ChargeItemDefinition.identifier",
      type: "Identifier[]",
      description: "Additional identifier for the charge item definition",
      required: false,
    },
    {
      name: "version",
      path: "ChargeItemDefinition.version",
      type: "string",
      description: "Business version of the charge item definition",
      required: false,
    },
    {
      name: "title",
      path: "ChargeItemDefinition.title",
      type: "string",
      description: "Name for this charge item definition (human-friendly)",
      required: false,
    },
    {
      name: "status",
      path: "ChargeItemDefinition.status",
      type: "code",
      description: "Publication status (draft | active | retired | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/publication-status",
        displayName: "Publication Status",
      },
    },
    {
      name: "description",
      path: "ChargeItemDefinition.description",
      type: "markdown",
      description: "Natural language description of the charge item definition",
      required: false,
    },
    {
      name: "code",
      path: "ChargeItemDefinition.code",
      type: "CodeableConcept",
      description: "Billing code or product type this definition applies to",
      required: false,
    },
    {
      name: "applicability",
      path: "ChargeItemDefinition.applicability",
      type: "BackboneElement[]",
      description: "Whether the charge item definition is applicable",
      required: false,
    },
    {
      name: "propertyGroup",
      path: "ChargeItemDefinition.propertyGroup",
      type: "BackboneElement[]",
      description: "Group of properties which are applicable for the definition",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "ChargeItemDefinition",
  "id": "example-charge-item-definition",
  "url": "http://hospital.ph/ChargeItemDefinition/laboratory-cbc",
  "version": "1.0.0",
  "title": "Complete Blood Count Pricing",
  "status": "active",
  "description": "Pricing definition for Complete Blood Count laboratory test",
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
  "propertyGroup": [
    {
      "priceComponent": [
        {
          "type": "base",
          "amount": {
            "value": 500.00,
            "currency": "PHP"
          }
        }
      ]
    }
  ]
}`,
};