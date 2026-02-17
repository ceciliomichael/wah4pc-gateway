# Invoice

List of ChargeItems with calculated totals for billing a patient or organization

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/Invoice`

## Required Fields

- **`status`** (code): The status of the invoice (draft | issued | balanced | cancelled | entered-in-error)

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the invoice
- **`type`** (CodeableConcept): Type of invoice
- **`subject`** (Reference): Recipient of the invoice (Patient or Group)
- **`recipient`** (Reference): Recipient of the invoice
- **`date`** (dateTime): Invoice date/time
- **`participant`** (BackboneElement[]): Participants involved in creation of the invoice
- **`issuer`** (Reference): Issuing organization of the invoice
- **`account`** (Reference): Account that is being charged
- **`lineItem`** (BackboneElement[]): Line items of the invoice
- **`totalNet`** (Money): Net total of this Invoice
- **`totalGross`** (Money): Gross total of this Invoice

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).