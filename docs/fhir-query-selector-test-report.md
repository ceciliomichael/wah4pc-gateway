# FHIR Query Selector Test Report

## Scope

This report covers selector validation for all resource types accepted by:

- `POST /api/v1/fhir/request/{resourceType}`

Validation is performed by `normalizeAndValidateQuerySelector` in `internal/service/query_selector_policy.go`.

Automated tests:

- `internal/service/query_selector_policy_all_resources_test.go`
- `internal/service/query_selector_policy_test.go`

## Request Body Patterns Used in Tests

### Patient-scoped valid request body

```json
{
  "requesterId": "requester-provider",
  "targetId": "target-provider",
  "resourceType": "Observation",
  "selector": {
    "patientIdentifiers": [
      {
        "system": "http://example.org/patient-id",
        "value": "PAT-001"
      }
    ]
  }
}
```

### Resource-scoped valid request body

```json
{
  "requesterId": "requester-provider",
  "targetId": "target-provider",
  "resourceType": "Medication",
  "selector": {
    "resourceIdentifiers": [
      {
        "system": "http://example.org/resource-id",
        "value": "RES-001"
      }
    ]
  }
}
```

### Legacy request body (accepted only for patient-scoped resources)

```json
{
  "requesterId": "requester-provider",
  "targetId": "target-provider",
  "resourceType": "Patient",
  "identifiers": [
    {
      "system": "http://example.org/patient-id",
      "value": "PAT-001"
    }
  ]
}
```

## Expected Results Matrix

| Resource Type | Selector Mode | Valid With | Invalid With |
|---|---|---|---|
| Account | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| AllergyIntolerance | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| ChargeItem | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Claim | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| ClaimResponse | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Condition | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| DiagnosticReport | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Encounter | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Immunization | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Invoice | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| MedicationAdministration | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| MedicationRequest | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| NutritionOrder | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Observation | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Patient | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| PaymentNotice | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| PaymentReconciliation | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| Procedure | patient | `selector.patientIdentifiers` | `selector.resourceIdentifiers` |
| ChargeItemDefinition | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |
| Location | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |
| Medication | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |
| Organization | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |
| Practitioner | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |
| PractitionerRole | resource | `selector.resourceIdentifiers` | `selector.patientIdentifiers` |

## Additional Assertions

- Every allowed resource type has a selector policy entry.
- Every selector policy entry points to an allowed resource type.
- Legacy `identifiers` are normalized to `selector.patientIdentifiers` only for patient-scoped resources.
- Legacy `identifiers` are rejected for resource-scoped resources.

