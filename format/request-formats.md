# WAH4PC Gateway Request Formats (25 Resources)

## Base Route
- Gateway base: `/api/v1`
- Request endpoint pattern: `POST /api/v1/fhir/request/{resourceType}`
- Target return endpoint pattern: `POST /api/v1/fhir/receive/{resourceType}`

## Shared Notes
- Required for all request bodies: `requesterId`, `targetId`
- Optional for all request bodies: `reason`, `notes`
- Patient-scoped resources use `patientIdentifiers`
- Resource-scoped resources use resource-specific identifiers
- For `Medication`, prefer `medicationCode` (`system` + `code`), with `medicationIdentifiers` as fallback

## 1. Patient
Endpoint:
```http
POST /api/v1/fhir/request/Patient
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 2. Appointment
Endpoint:
```http
POST /api/v1/fhir/request/Appointment
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD",
  "status": "string",
  "practitionerIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 3. Encounter
Endpoint:
```http
POST /api/v1/fhir/request/Encounter
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 4. Procedure
Endpoint:
```http
POST /api/v1/fhir/request/Procedure
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 5. Immunization
Endpoint:
```http
POST /api/v1/fhir/request/Immunization
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 6. Observation
Endpoint:
```http
POST /api/v1/fhir/request/Observation
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 7. Medication
Endpoint:
```http
POST /api/v1/fhir/request/Medication
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "medicationCode": {
    "system": "string",
    "code": "string"
  },
  "medicationIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 8. Location
Endpoint:
```http
POST /api/v1/fhir/request/Location
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "locationIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 9. Organization
Endpoint:
```http
POST /api/v1/fhir/request/Organization
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "organizationIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 10. Practitioner
Endpoint:
```http
POST /api/v1/fhir/request/Practitioner
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "practitionerIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 11. Account
Endpoint:
```http
POST /api/v1/fhir/request/Account
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 12. Claim
Endpoint:
```http
POST /api/v1/fhir/request/Claim
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 13. ClaimResponse
Endpoint:
```http
POST /api/v1/fhir/request/ClaimResponse
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 14. ChargeItem
Endpoint:
```http
POST /api/v1/fhir/request/ChargeItem
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 15. ChargeItemDefinition
Endpoint:
```http
POST /api/v1/fhir/request/ChargeItemDefinition
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "chargeItemDefinitionIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 16. Invoice
Endpoint:
```http
POST /api/v1/fhir/request/Invoice
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 17. PaymentNotice
Endpoint:
```http
POST /api/v1/fhir/request/PaymentNotice
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 18. PaymentReconciliation
Endpoint:
```http
POST /api/v1/fhir/request/PaymentReconciliation
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 19. AllergyIntolerance
Endpoint:
```http
POST /api/v1/fhir/request/AllergyIntolerance
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 20. Condition
Endpoint:
```http
POST /api/v1/fhir/request/Condition
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 21. DiagnosticReport
Endpoint:
```http
POST /api/v1/fhir/request/DiagnosticReport
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 22. MedicationAdministration
Endpoint:
```http
POST /api/v1/fhir/request/MedicationAdministration
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 23. MedicationRequest
Endpoint:
```http
POST /api/v1/fhir/request/MedicationRequest
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 24. NutritionOrder
Endpoint:
```http
POST /api/v1/fhir/request/NutritionOrder
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "patientIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## 25. PractitionerRole
Endpoint:
```http
POST /api/v1/fhir/request/PractitionerRole
```
Body:
```json
{
  "requesterId": "string",
  "targetId": "string",
  "practitionerRoleIdentifiers": [{ "system": "string", "value": "string" }],
  "reason": "string",
  "notes": "string"
}
```

## Target Provider -> Gateway Return (SUCCESS)
Endpoint:
```http
POST /api/v1/fhir/receive/{resourceType}
```
Body:
```json
{
  "transactionId": "string",
  "status": "SUCCESS",
  "data": {}
}
```

## Target Provider -> Gateway Return (REJECTED)
Endpoint:
```http
POST /api/v1/fhir/receive/{resourceType}
```
Body:
```json
{
  "transactionId": "string",
  "status": "REJECTED",
  "data": {
    "resourceType": "OperationOutcome",
    "issue": [
      {
        "severity": "string",
        "code": "string",
        "details": {
          "text": "string"
        }
      }
    ]
  }
}
```

## Target Provider -> Gateway Return (ERROR)
Endpoint:
```http
POST /api/v1/fhir/receive/{resourceType}
```
Body:
```json
{
  "transactionId": "string",
  "status": "ERROR",
  "data": {
    "resourceType": "OperationOutcome",
    "issue": [
      {
        "severity": "string",
        "code": "string",
        "details": {
          "text": "string"
        }
      }
    ]
  }
}
```
