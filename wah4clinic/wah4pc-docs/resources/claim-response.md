# ClaimResponse

Adjudication details and payment advice from an insurer in response to a Claim

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/ClaimResponse`

## Required Fields

- **`status`** (code): The status of the response (active | cancelled | draft | entered-in-error)
- **`type`** (CodeableConcept): Category of claim response
- **`use`** (code): Purpose (claim | preauthorization | predetermination)
- **`patient`** (Reference): The recipient of the products and services
- **`created`** (dateTime): Response creation date
- **`insurer`** (Reference): Party responsible for adjudication
- **`outcome`** (code): Result of the adjudication (queued | complete | error | partial)

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the claim response
- **`request`** (Reference): The original claim reference
- **`disposition`** (string): Disposition message
- **`total`** (BackboneElement[]): Adjudication totals
- **`payment`** (BackboneElement): Payment details

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).