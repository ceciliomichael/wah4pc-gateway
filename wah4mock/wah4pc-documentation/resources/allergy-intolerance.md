# AllergyIntolerance

Record of patient allergies and adverse reactions to substances

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/AllergyIntolerance`

## Required Fields

- **`patient`** (Reference): Who the sensitivity is for

## Optional Fields

- **`identifier`** (Identifier[]): External IDs for this allergy
- **`clinicalStatus`** (CodeableConcept): Clinical status of the allergy (active | inactive | resolved)
- **`verificationStatus`** (CodeableConcept): Verification status (unconfirmed | confirmed | refuted | entered-in-error)
- **`type`** (code): allergy | intolerance - Underlying mechanism
- **`category`** (code[]): Category of the identified substance (food | medication | environment | biologic)
- **`criticality`** (code): Potential seriousness (low | high | unable-to-assess)
- **`code`** (CodeableConcept): Code that identifies the allergy or intolerance
- **`encounter`** (Reference): Encounter when the allergy was asserted
- **`onsetDateTime`** (dateTime): When allergy or intolerance was identified
- **`recorder`** (Reference): Who recorded the sensitivity
- **`reaction`** (BackboneElement[]): Adverse reaction events linked to exposure

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "AllergyIntolerance",
  "id": "example-allergy",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        "code": "confirmed",
        "display": "Confirmed"
      }
    ]
  },
  "type": "allergy",
  "category": ["medication"],
  "criticality": "high",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "7980",
        "display": "Penicillin"
      }
    ],
    "text": "Penicillin"
  },
  "patient": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "onsetDateTime": "2010-01-01",
  "recorder": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  },
  "reaction": [
    {
      "manifestation": [
        {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "39579001",
              "display": "Anaphylaxis"
            }
          ]
        }
      ],
      "severity": "severe"
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).