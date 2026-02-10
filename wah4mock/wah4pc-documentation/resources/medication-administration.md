# MedicationAdministration

Record of a medication actually given to a patient

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/MedicationAdministration`

## Required Fields

- **`status`** (code): Status of the administration (in-progress | not-done | on-hold | completed | entered-in-error | stopped | unknown)
- **`medicationCodeableConcept`** (CodeableConcept): What was administered
- **`subject`** (Reference): Who received medication
- **`effectiveDateTime`** (dateTime): Start and end time of administration

## Optional Fields

- **`identifier`** (Identifier[]): External identifier for the administration
- **`category`** (CodeableConcept): Type of medication usage
- **`context`** (Reference): Encounter or Episode of Care
- **`performer`** (BackboneElement[]): Who performed the medication administration
- **`request`** (Reference): Request administration performed against
- **`dosage`** (BackboneElement): Details of how medication was taken

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "MedicationAdministration",
  "id": "example-medication-administration",
  "status": "completed",
  "category": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/medication-admin-category",
        "code": "inpatient",
        "display": "Inpatient"
      }
    ]
  },
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "1049502",
        "display": "Acetaminophen 325 MG Oral Tablet"
      }
    ],
    "text": "Paracetamol 325mg"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "context": {
    "reference": "Encounter/example-encounter"
  },
  "effectiveDateTime": "2024-01-15T08:00:00Z",
  "performer": [
    {
      "actor": {
        "reference": "Practitioner/example-nurse",
        "display": "Nurse Ana Garcia"
      }
    }
  ],
  "dosage": {
    "text": "One tablet orally",
    "route": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "26643006",
          "display": "Oral route"
        }
      ]
    },
    "dose": {
      "value": 325,
      "unit": "mg",
      "system": "http://unitsofmeasure.org",
      "code": "mg"
    }
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).