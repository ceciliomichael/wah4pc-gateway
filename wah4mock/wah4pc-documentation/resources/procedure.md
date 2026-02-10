# PH Core Procedure

Procedure resource schema with SNOMED CT codes, subject/encounter references to PH Core profiles, performer details, and body site coding

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Procedure profile URL
- **`status`** (code): Current status (preparation | in-progress | not-done | on-hold | stopped | completed | entered-in-error | unknown)
- **`subject`** (Reference): The patient on whom the procedure was performed - must conform to PH Core Patient

## Optional Fields

- **`code`** (CodeableConcept): Identification of the procedure - typically SNOMED CT or ICD-10-PCS codes
- **`encounter`** (Reference): The encounter during which the procedure was performed - must conform to PH Core Encounter
- **`performedDateTime`** (dateTime | Period | string | Age | Range): When the procedure was performed
- **`performer`** (BackboneElement[]): The people who performed the procedure
- **`bodySite`** (CodeableConcept[]): Target body sites - SNOMED CT body structure codes
- **`outcome`** (CodeableConcept): The result of the procedure

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Procedure",
  "id": "example-procedure",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Appendectomy procedure performed on patient.</div>"
  },
  "status": "completed",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "80146002",
        "display": "Appendectomy"
      }
    ],
    "text": "Appendectomy"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "performedDateTime": "2024-01-15T14:30:00+08:00",
  "performer": [
    {
      "actor": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      },
      "function": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "304292004",
            "display": "Surgeon"
          }
        ]
      }
    }
  ],
  "bodySite": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "66754008",
          "display": "Appendix structure"
        }
      ]
    }
  ],
  "outcome": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "385669000",
        "display": "Successful"
      }
    ]
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).