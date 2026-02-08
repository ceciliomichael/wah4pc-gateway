import type { ResourceDefinition } from "./types";

export const invoiceResource: ResourceDefinition = {
  id: "invoice",
  name: "Invoice",
  title: "Invoice",
  description:
    "Invoice containing collected ChargeItems from an Account with calculated individual and total price for billing purposes. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/Invoice",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Invoice",
  fields: [
    {
      name: "identifier",
      path: "Invoice.identifier",
      type: "Identifier[]",
      description: "Business identifier for the invoice",
      required: false,
    },
    {
      name: "status",
      path: "Invoice.status",
      type: "code",
      description: "The status of the invoice (draft | issued | balanced | cancelled | entered-in-error)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/invoice-status",
        displayName: "Invoice Status",
      },
    },
    {
      name: "type",
      path: "Invoice.type",
      type: "CodeableConcept",
      description: "Type of invoice",
      required: false,
    },
    {
      name: "subject",
      path: "Invoice.subject",
      type: "Reference",
      description: "Recipient of the invoice (Patient or Group)",
      required: false,
      referenceTarget: ["Patient", "Group"],
    },
    {
      name: "recipient",
      path: "Invoice.recipient",
      type: "Reference",
      description: "Recipient of the invoice",
      required: false,
      referenceTarget: ["Organization", "Patient", "RelatedPerson"],
    },
    {
      name: "date",
      path: "Invoice.date",
      type: "dateTime",
      description: "Invoice date/time",
      required: false,
    },
    {
      name: "participant",
      path: "Invoice.participant",
      type: "BackboneElement[]",
      description: "Participants involved in creation of the invoice",
      required: false,
    },
    {
      name: "issuer",
      path: "Invoice.issuer",
      type: "Reference",
      description: "Issuing organization of the invoice",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "account",
      path: "Invoice.account",
      type: "Reference",
      description: "Account that is being charged",
      required: false,
      referenceTarget: ["Account"],
    },
    {
      name: "lineItem",
      path: "Invoice.lineItem",
      type: "BackboneElement[]",
      description: "Line items of the invoice",
      required: false,
    },
    {
      name: "totalNet",
      path: "Invoice.totalNet",
      type: "Money",
      description: "Net total of this Invoice",
      required: false,
    },
    {
      name: "totalGross",
      path: "Invoice.totalGross",
      type: "Money",
      description: "Gross total of this Invoice",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Invoice",
  "id": "example-invoice",
  "status": "issued",
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0017",
        "code": "PAT",
        "display": "Patient"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "date": "2024-01-15T10:00:00Z",
  "issuer": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "lineItem": [
    {
      "sequence": 1,
      "chargeItemReference": {
        "reference": "ChargeItem/example-charge-item"
      },
      "priceComponent": [
        {
          "type": "base",
          "amount": {
            "value": 5000.00,
            "currency": "PHP"
          }
        }
      ]
    }
  ],
  "totalNet": {
    "value": 5000.00,
    "currency": "PHP"
  },
  "totalGross": {
    "value": 5600.00,
    "currency": "PHP"
  }
}`,
};