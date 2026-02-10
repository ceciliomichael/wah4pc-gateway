# PaymentReconciliation

Bulk payment details and references to Claims being settled

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/PaymentReconciliation`

## Required Fields

- **`status`** (code): The status of the payment reconciliation (active | cancelled | draft | entered-in-error)
- **`created`** (dateTime): Creation date of this payment reconciliation
- **`paymentDate`** (date): When payment was issued
- **`paymentAmount`** (Money): Total amount of payment

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the payment reconciliation
- **`period`** (Period): Period covered by the payment reconciliation
- **`paymentIssuer`** (Reference): Organization issuing the payment
- **`request`** (Reference): Reference to requesting resource
- **`requestor`** (Reference): Responsible practitioner or organization
- **`outcome`** (code): Outcome of the request (queued | complete | error | partial)
- **`disposition`** (string): Disposition message
- **`detail`** (BackboneElement[]): Settlement details

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).