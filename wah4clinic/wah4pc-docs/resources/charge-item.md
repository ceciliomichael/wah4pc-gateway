# ChargeItem

Itemized record of provided product or service for billing purposes

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/ChargeItem`

## Required Fields

- **`status`** (code): The status of the charge item (planned | billable | not-billable | aborted | billed | entered-in-error | unknown)
- **`code`** (CodeableConcept): A code identifying the charge item
- **`subject`** (Reference): Individual service was provided to

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the charge item
- **`context`** (Reference): Encounter/Episode associated with the charge item
- **`occurrenceDateTime`** (dateTime): When the charged service was provided
- **`performer`** (BackboneElement[]): Who performed or participated in the charge item
- **`performingOrganization`** (Reference): Organization providing the service
- **`quantity`** (Quantity): Quantity of the charge item
- **`priceOverride`** (Money): Price overriding the associated rules
- **`enterer`** (Reference): Individual who entered the charge item

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).