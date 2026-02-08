import type { ResourceDefinition } from "./types";

export const paymentNoticeResource: ResourceDefinition = {
  id: "payment-notice",
  name: "PaymentNotice",
  title: "Payment Notice",
  description:
    "This resource provides the status of a payment for goods and services rendered, and is used to link the payment to a Claim resource. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/PaymentNotice",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/PaymentNotice",
  fields: [
    {
      name: "identifier",
      path: "PaymentNotice.identifier",
      type: "Identifier[]",
      description: "Business identifier for the payment notice",
      required: false,
    },
    {
      name: "status",
      path: "PaymentNotice.status",
      type: "code",
      description: "The status of the payment notice (active | cancelled | draft | entered-in-error)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/fm-status",
        displayName: "Financial Resource Status",
      },
    },
    {
      name: "request",
      path: "PaymentNotice.request",
      type: "Reference",
      description: "Request reference (typically a Claim)",
      required: false,
      referenceTarget: ["Resource"],
    },
    {
      name: "response",
      path: "PaymentNotice.response",
      type: "Reference",
      description: "Response reference (typically a ClaimResponse)",
      required: false,
      referenceTarget: ["Resource"],
    },
    {
      name: "created",
      path: "PaymentNotice.created",
      type: "dateTime",
      description: "Creation date of this payment notice",
      required: true,
    },
    {
      name: "provider",
      path: "PaymentNotice.provider",
      type: "Reference",
      description: "Responsible practitioner or organization",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization"],
    },
    {
      name: "payment",
      path: "PaymentNotice.payment",
      type: "Reference",
      description: "Reference to the payment",
      required: true,
      referenceTarget: ["PaymentReconciliation"],
    },
    {
      name: "paymentDate",
      path: "PaymentNotice.paymentDate",
      type: "date",
      description: "Payment or clearing date",
      required: false,
    },
    {
      name: "payee",
      path: "PaymentNotice.payee",
      type: "Reference",
      description: "Party being paid",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization"],
    },
    {
      name: "recipient",
      path: "PaymentNotice.recipient",
      type: "Reference",
      description: "Party being notified",
      required: true,
      referenceTarget: ["Organization"],
    },
    {
      name: "amount",
      path: "PaymentNotice.amount",
      type: "Money",
      description: "Payment amount",
      required: true,
    },
    {
      name: "paymentStatus",
      path: "PaymentNotice.paymentStatus",
      type: "CodeableConcept",
      description: "Issued or cleared status of the payment",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/payment-status",
        displayName: "Payment Status",
      },
    },
  ],
  jsonTemplate: `{
  "resourceType": "PaymentNotice",
  "id": "example-payment-notice",
  "status": "active",
  "created": "2024-01-25T10:00:00Z",
  "payment": {
    "reference": "PaymentReconciliation/example-payment-reconciliation"
  },
  "paymentDate": "2024-01-25",
  "recipient": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "amount": {
    "value": 35000.00,
    "currency": "PHP"
  },
  "paymentStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/paymentstatus",
        "code": "paid",
        "display": "Paid"
      }
    ]
  }
}`,
};