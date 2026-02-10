# Claim

Provider-issued list of services and products for insurance reimbursement (e.g., PhilHealth)

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/Claim`

## Required Fields

- **`status`** (code): The status of the claim (active | cancelled | draft | entered-in-error)
- **`type`** (CodeableConcept): Category of claim (institutional | oral | pharmacy | professional | vision)
- **`use`** (code): Purpose of the claim (claim | preauthorization | predetermination)
- **`patient`** (Reference): The recipient of the products and services
- **`created`** (dateTime): Resource creation date
- **`provider`** (Reference): Party responsible for the claim
- **`priority`** (CodeableConcept): Desired processing priority

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the claim
- **`insurer`** (Reference): Target payor (e.g., PhilHealth)
- **`diagnosis`** (BackboneElement[]): Pertinent diagnosis information
- **`item`** (BackboneElement[]): Product or service provided
- **`total`** (Money): Total claim cost

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Claim",
  "id": "example-claim",
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
  "created": "2024-01-15T10:00:00Z",
  "insurer": {
    "reference": "Organization/philhealth",
    "display": "Philippine Health Insurance Corporation"
  },
  "provider": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "priority": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/processpriority",
        "code": "normal",
        "display": "Normal"
      }
    ]
  },
  "diagnosis": [
    {
      "sequence": 1,
      "diagnosisCodeableConcept": {
        "coding": [
          {
            "system": "http://hl7.org/fhir/sid/icd-10",
            "code": "J18.9",
            "display": "Pneumonia, unspecified organism"
          }
        ]
      }
    }
  ],
  "total": {
    "value": 50000.00,
    "currency": "PHP"
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).