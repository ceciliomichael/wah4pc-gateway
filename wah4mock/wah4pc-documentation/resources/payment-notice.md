# PaymentNotice

Notification of payment status or clearing details

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/PaymentNotice`

## Required Fields

- **`status`** (code): The status of the payment notice (active | cancelled | draft | entered-in-error)
- **`created`** (dateTime): Creation date of this payment notice
- **`payment`** (Reference): Reference to the payment
- **`recipient`** (Reference): Party being notified
- **`amount`** (Money): Payment amount

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the payment notice
- **`request`** (Reference): Request reference (typically a Claim)
- **`response`** (Reference): Response reference (typically a ClaimResponse)
- **`provider`** (Reference): Responsible practitioner or organization
- **`paymentDate`** (date): Payment or clearing date
- **`payee`** (Reference): Party being paid
- **`paymentStatus`** (CodeableConcept): Issued or cleared status of the payment

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).