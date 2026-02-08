import type { ResourceDefinition } from "./types";

export const paymentReconciliationResource: ResourceDefinition = {
  id: "payment-reconciliation",
  name: "PaymentReconciliation",
  title: "Payment Reconciliation",
  description:
    "This resource provides the payment details and claim references supporting a bulk payment or payment advice. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/PaymentReconciliation",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/PaymentReconciliation",
  fields: [
    {
      name: "identifier",
      path: "PaymentReconciliation.identifier",
      type: "Identifier[]",
      description: "Business identifier for the payment reconciliation",
      required: false,
    },
    {
      name: "status",
      path: "PaymentReconciliation.status",
      type: "code",
      description: "The status of the payment reconciliation (active | cancelled | draft | entered-in-error)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/fm-status",
        displayName: "Financial Resource Status",
      },
    },
    {
      name: "period",
      path: "PaymentReconciliation.period",
      type: "Period",
      description: "Period covered by the payment reconciliation",
      required: false,
    },
    {
      name: "created",
      path: "PaymentReconciliation.created",
      type: "dateTime",
      description: "Creation date of this payment reconciliation",
      required: true,
    },
    {
      name: "paymentIssuer",
      path: "PaymentReconciliation.paymentIssuer",
      type: "Reference",
      description: "Organization issuing the payment",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "request",
      path: "PaymentReconciliation.request",
      type: "Reference",
      description: "Reference to requesting resource",
      required: false,
      referenceTarget: ["Task"],
    },
    {
      name: "requestor",
      path: "PaymentReconciliation.requestor",
      type: "Reference",
      description: "Responsible practitioner or organization",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization"],
    },
    {
      name: "outcome",
      path: "PaymentReconciliation.outcome",
      type: "code",
      description: "Outcome of the request (queued | complete | error | partial)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/remittance-outcome",
        displayName: "Remittance Outcome",
      },
    },
    {
      name: "disposition",
      path: "PaymentReconciliation.disposition",
      type: "string",
      description: "Disposition message",
      required: false,
    },
    {
      name: "paymentDate",
      path: "PaymentReconciliation.paymentDate",
      type: "date",
      description: "When payment was issued",
      required: true,
    },
    {
      name: "paymentAmount",
      path: "PaymentReconciliation.paymentAmount",
      type: "Money",
      description: "Total amount of payment",
      required: true,
    },
    {
      name: "detail",
      path: "PaymentReconciliation.detail",
      type: "BackboneElement[]",
      description: "Settlement details",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "PaymentReconciliation",
  "id": "example-payment-reconciliation",
  "status": "active",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "created": "2024-02-01T10:00:00Z",
  "paymentIssuer": {
    "reference": "Organization/philhealth",
    "display": "Philippine Health Insurance Corporation"
  },
  "outcome": "complete",
  "disposition": "January 2024 payment batch processed",
  "paymentDate": "2024-02-01",
  "paymentAmount": {
    "value": 500000.00,
    "currency": "PHP"
  },
  "detail": [
    {
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/payment-type",
            "code": "payment",
            "display": "Payment"
          }
        ]
      },
      "request": {
        "reference": "Claim/example-claim"
      },
      "response": {
        "reference": "ClaimResponse/example-claim-response"
      },
      "date": "2024-01-25",
      "amount": {
        "value": 35000.00,
        "currency": "PHP"
      }
    }
  ]
}`,
};