# Account

Financial account for tracking charges for a patient or cost center

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/Account`

## Required Fields

- **`status`** (code): Whether the account is currently usable (active | inactive | entered-in-error | on-hold | unknown)

## Optional Fields

- **`identifier`** (Identifier[]): Unique identifier for the account
- **`type`** (CodeableConcept): Categorizes the account for reporting and searching purposes
- **`name`** (string): Human-readable label for the account
- **`subject`** (Reference[]): The entity that caused the expenses (Patient, Device, Practitioner, Location, HealthcareService, Organization)
- **`servicePeriod`** (Period): The date range of services associated with this account
- **`owner`** (Reference): Entity managing the account
- **`description`** (string): Explanation of the account

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Account",
  "id": "example-account",
  "status": "active",
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "PBILLACCT",
        "display": "Patient Billing Account"
      }
    ]
  },
  "name": "Patient Billing Account",
  "subject": [
    {
      "reference": "Patient/example-patient",
      "display": "Juan Dela Cruz"
    }
  ],
  "servicePeriod": {
    "start": "2024-01-01"
  },
  "owner": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "description": "Hospital charges for inpatient stay"
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).