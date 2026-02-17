# Condition

Clinical condition, diagnosis, problem, or issue that has risen to a level of concern

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/Condition`

## Required Fields

- **`subject`** (Reference): Who has the condition

## Optional Fields

- **`identifier`** (Identifier[]): External IDs for this condition
- **`clinicalStatus`** (CodeableConcept): The clinical status (active | recurrence | relapse | inactive | remission | resolved)
- **`verificationStatus`** (CodeableConcept): Verification status (unconfirmed | provisional | differential | confirmed | refuted | entered-in-error)
- **`category`** (CodeableConcept[]): Category of condition (problem-list-item | encounter-diagnosis)
- **`severity`** (CodeableConcept): Subjective severity of condition
- **`code`** (CodeableConcept): Identification of the condition, problem or diagnosis
- **`bodySite`** (CodeableConcept[]): Anatomical location, if relevant
- **`encounter`** (Reference): Encounter created as part of
- **`onsetDateTime`** (dateTime): Estimated or actual date, date-time, or age
- **`recordedDate`** (dateTime): Date record was first recorded
- **`recorder`** (Reference): Who recorded the condition
- **`note`** (Annotation[]): Additional information about the condition

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Condition",
  "id": "example-condition",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        "code": "confirmed",
        "display": "Confirmed"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/condition-category",
          "code": "encounter-diagnosis",
          "display": "Encounter Diagnosis"
        }
      ]
    }
  ],
  "severity": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "24484000",
        "display": "Severe"
      }
    ]
  },
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "E11.9",
        "display": "Type 2 diabetes mellitus without complications"
      }
    ],
    "text": "Type 2 Diabetes Mellitus"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "onsetDateTime": "2020-06-15",
  "recordedDate": "2020-06-15T10:00:00Z",
  "recorder": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).