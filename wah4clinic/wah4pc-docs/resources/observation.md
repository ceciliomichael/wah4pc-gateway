# PH Core Observation

Observation resource schema with LOINC codes for vital signs/labs, subject/encounter references, component values (e.g., blood pressure systolic/diastolic)

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Observation profile URL
- **`status`** (code): Current status (registered | preliminary | final | amended | corrected | cancelled | entered-in-error | unknown)
- **`code`** (CodeableConcept): Type of observation - LOINC codes recommended
- **`subject`** (Reference): The patient observed - must conform to PH Core Patient

## Optional Fields

- **`category`** (CodeableConcept[]): Classification of observation type (e.g., vital-signs, laboratory)
- **`encounter`** (Reference): The encounter context - must conform to PH Core Encounter
- **`effectiveDateTime`** (dateTime | Period | Timing | instant): When the observation was made
- **`value[x]`** (Quantity | CodeableConcept | string | boolean | integer | Range | Ratio | SampledData | time | dateTime | Period): Actual result value
- **`interpretation`** (CodeableConcept[]): High, low, normal, etc.
- **`bodySite`** (CodeableConcept): Observed body part - SNOMED CT codes
- **`component`** (BackboneElement[]): Component results (e.g., systolic/diastolic for BP)
- **`performer`** (Reference[]): Who is responsible for the observation

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Observation",
  "id": "blood-pressure-example",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Blood pressure measurement: 120/80 mmHg</div>"
  },
  "identifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:uuid:187e0c12-8dd2-67e2-99b2-bf273c878281"
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure panel with all children optional"
      }
    ],
    "text": "Blood pressure systolic & diastolic"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "effectiveDateTime": "2024-01-15T10:30:00+08:00",
  "performer": [
    {
      "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
    }
  ],
  "bodySite": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "368209003",
        "display": "Right arm"
      }
    ]
  },
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 120,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "N",
              "display": "Normal"
            }
          ]
        }
      ]
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 80,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "N",
              "display": "Normal"
            }
          ]
        }
      ]
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).