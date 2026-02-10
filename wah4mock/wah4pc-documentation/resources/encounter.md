# PH Core Encounter

Encounter resource schema with status codes, class codes (AMB, IMP), subject reference to PH Core Patient, and participant references

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Encounter profile URL
- **`status`** (code): Current status of the encounter (planned | arrived | triaged | in-progress | onleave | finished | cancelled | entered-in-error | unknown)
- **`class`** (Coding): Classification of the encounter (e.g., AMB for ambulatory, IMP for inpatient)
- **`subject`** (Reference): Reference to the patient - must conform to PH Core Patient profile

## Optional Fields

- **`participant.individual`** (Reference): Healthcare provider involved - must reference PH Core Practitioner, PractitionerRole, or PH Core RelatedPerson
- **`period`** (Period): The start and end time of the encounter
- **`reasonCode`** (CodeableConcept[]): Coded reason the encounter takes place
- **`serviceProvider`** (Reference): The organization responsible for the encounter

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Encounter",
  "id": "example-encounter",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">An ambulatory encounter for the patient.</div>"
  },
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "participant": [
    {
      "individual": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      }
    }
  ],
  "period": {
    "start": "2024-01-15T09:00:00+08:00",
    "end": "2024-01-15T10:30:00+08:00"
  },
  "reasonCode": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "185349003",
          "display": "Encounter for check up"
        }
      ]
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).