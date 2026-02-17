# DiagnosticReport

Findings and interpretation of diagnostic tests (lab, imaging, etc.)

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/DiagnosticReport`

## Required Fields

- **`status`** (code): The status of the diagnostic report (registered | partial | preliminary | final)
- **`code`** (CodeableConcept): Name/Code for this diagnostic report

## Optional Fields

- **`identifier`** (Identifier[]): Business identifier for the report
- **`basedOn`** (Reference[]): What was requested
- **`category`** (CodeableConcept[]): Service category
- **`subject`** (Reference): The subject of the report
- **`encounter`** (Reference): Health care event when test ordered
- **`effectiveDateTime`** (dateTime): Clinically relevant time for report
- **`issued`** (instant): When the report was released
- **`performer`** (Reference[]): Responsible diagnostic service
- **`result`** (Reference[]): Observations
- **`conclusion`** (string): Clinical conclusion (interpretation) of test results
- **`conclusionCode`** (CodeableConcept[]): Codes for the clinical conclusion

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "DiagnosticReport",
  "id": "example-diagnostic-report",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
          "code": "LAB",
          "display": "Laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "58410-2",
        "display": "Complete blood count (hemogram) panel - Blood by Automated count"
      }
    ],
    "text": "Complete Blood Count"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "effectiveDateTime": "2024-01-15T09:30:00Z",
  "issued": "2024-01-15T14:00:00Z",
  "performer": [
    {
      "reference": "Organization/example-organization",
      "display": "Philippine General Hospital Laboratory"
    }
  ],
  "result": [
    {
      "reference": "Observation/hemoglobin",
      "display": "Hemoglobin"
    },
    {
      "reference": "Observation/wbc",
      "display": "White Blood Cell Count"
    }
  ],
  "conclusion": "All values within normal limits"
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).