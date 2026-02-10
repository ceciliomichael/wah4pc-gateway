# PH Core Medication

Medication resource schema with PH Core drugs ValueSet binding, form codes, ingredient details, and batch information

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Medication profile URL

## Optional Fields

- **`code`** (CodeableConcept): Codes that identify this medication - bound to PH Core drugs ValueSet
- **`status`** (code): Status of the medication (active | inactive | entered-in-error)
- **`manufacturer`** (Reference): Manufacturer of the item
- **`form`** (CodeableConcept): Dose form (e.g., tablet, capsule, injection)
- **`amount`** (Ratio): Amount of drug in package
- **`ingredient`** (BackboneElement[]): Active or inactive ingredient
- **`batch`** (BackboneElement): Batch information including lot number and expiration

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Medication",
  "id": "example-medication",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Paracetamol 500mg Tablet</div>"
  },
  "status": "active",
  "code": {
    "coding": [
      {
        "system": "urn://example.com/ph-core/fhir/CodeSystem/drugs",
        "code": "paracetamol-500mg",
        "display": "Paracetamol 500mg"
      },
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "313782",
        "display": "Acetaminophen 500 MG Oral Tablet"
      }
    ],
    "text": "Paracetamol 500mg Tablet"
  },
  "form": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "385055001",
        "display": "Tablet"
      }
    ]
  },
  "amount": {
    "numerator": {
      "value": 100,
      "unit": "tablets",
      "system": "http://unitsofmeasure.org",
      "code": "{tbl}"
    },
    "denominator": {
      "value": 1,
      "unit": "bottle",
      "system": "http://unitsofmeasure.org",
      "code": "{bottle}"
    }
  },
  "ingredient": [
    {
      "itemCodeableConcept": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "387517004",
            "display": "Paracetamol"
          }
        ]
      },
      "strength": {
        "numerator": {
          "value": 500,
          "unit": "mg",
          "system": "http://unitsofmeasure.org",
          "code": "mg"
        },
        "denominator": {
          "value": 1,
          "unit": "tablet",
          "system": "http://unitsofmeasure.org",
          "code": "{tbl}"
        }
      }
    }
  ],
  "batch": {
    "lotNumber": "MED2024A001",
    "expirationDate": "2026-12-31"
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).