# WAH4PC Gateway Push Formats

## Purpose
Use push when a sender provider needs to transfer a FHIR resource to a target provider without waiting for a prior query transaction.

## Endpoint
```http
POST /api/v1/fhir/push/{resourceType}
```

Example:
```http
POST /api/v1/fhir/push/Appointment
```

## Required Headers
- `Content-Type: application/json`
- `X-API-Key: <sender-api-key>` (or `Authorization: Bearer <sender-api-key>`)

Optional:
- `Idempotency-Key: <uuid-v4>`

## Path Requirements
- `{resourceType}` must be one of the gateway-supported resource types.
- `resource.resourceType` in body must exactly match `{resourceType}` in URL.

## Request Body Requirements
```json
{
  "senderId": "string",
  "targetId": "string",
  "resource": {
    "resourceType": "string"
  },
  "reason": "string",
  "notes": "string"
}
```

Field rules:
- `senderId` (required): registered sender provider ID.
- `targetId` (required): registered target provider ID.
- `resource` (required): full FHIR JSON resource payload.
- `reason` (optional): transfer reason.
- `notes` (optional): extra context.

## Resource Checklist (All Supported Types)
For every pushed resource, include:
- `resource.resourceType` matching the URL `{resourceType}`
- A stable logical identity (`resource.id` and/or `resource.identifier[]`)
- Core workflow fields expected by your integration (`status`, `subject`, `encounter`, `code`, `effectiveDateTime`, etc., depending on type)
- Any references represented with identifiers when possible for cross-system matching

Recommended minimum guidance by type:
- `Patient`: include at least one `identifier`, plus `name` and demographics used by receiver matching.
- `Appointment`: include `status`, schedule fields (`start`, `end`), and required `participant[].actor.identifier`.
- `Encounter`: include `status`, `class`, `subject`.
- `Procedure`: include `status`, `code`, `subject`.
- `Immunization`: include `status`, `vaccineCode`, `patient`, `occurrenceDateTime`.
- `Observation`: include `status`, `code`, `subject`, and a value or component.
- `Medication`: include business `identifier` and `code`.
- `Location`: include `identifier`, `name`, and status/mode details as used by receiver.
- `Organization`: include `identifier` and `name`.
- `Practitioner`: include `identifier` and `name`.
- `Account`: include `status` and at least one `subject`.
- `Claim`: include identifiers, `status`, `type`, `patient`, and billable timing.
- `ClaimResponse`: include `status`, `type`, `patient`, and reference to source claim.
- `ChargeItem`: include `status`, `code`, and `subject`.
- `ChargeItemDefinition`: include canonical/business identifiers and pricing definition fields used by receiver.
- `Invoice`: include `status`, subject/recipient context, and priced line references.
- `PaymentNotice`: include `status`, payment/recipient context, and references.
- `PaymentReconciliation`: include `status`, payment details, and allocation references.
- `AllergyIntolerance`: include `clinicalStatus`, `code`, and `patient`.
- `Condition`: include `clinicalStatus`, `code`, and `subject`.
- `DiagnosticReport`: include `status`, `code`, `subject`, and result references/content.
- `MedicationAdministration`: include `status`, medication, and `subject`.
- `MedicationRequest`: include `status`, `intent`, medication, and `subject`.
- `NutritionOrder`: include `status`, `intent`, and `patient`.
- `PractitionerRole`: include practitioner and organization linkage plus role/specialty as needed.

Note: The gateway validates envelope and schema, but domain completeness is integration-specific; send enough identifiers and context for the target to reconcile records safely.

## Appointment Extra Validation
For `resourceType = Appointment`, each participant must use a logical identifier:

- `participant[].actor.identifier.system` is required
- `participant[].actor.identifier.value` is required

If missing, the request is rejected with HTTP 400.

## Minimum Valid Appointment Push
```json
{
  "senderId": "<sender-provider-id>",
  "targetId": "<target-provider-id>",
  "resource": {
    "resourceType": "Appointment",
    "status": "proposed",
    "start": "2026-02-20T09:00:00Z",
    "participant": [
      {
        "actor": {
          "identifier": {
            "system": "https://sender.example/fhir/patient-id",
            "value": "PAT-12345"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New appointment",
  "notes": "Please confirm availability"
}
```

## Complete Appointment Push Example
```json
{
  "senderId": "<sender-provider-id>",
  "targetId": "<target-provider-id>",
  "reason": "Referral appointment transfer",
  "notes": "Please reconcile with your scheduling system",
  "resource": {
    "resourceType": "Appointment",
    "id": "appt-2026-000123",
    "identifier": [
      {
        "system": "https://sender.example/fhir/appointment-id",
        "value": "APT-2026-000123"
      }
    ],
    "status": "booked",
    "description": "Initial specialist consultation",
    "start": "2026-02-20T09:00:00Z",
    "end": "2026-02-20T09:30:00Z",
    "participant": [
      {
        "actor": {
          "identifier": {
            "system": "https://sender.example/fhir/patient-id",
            "value": "PAT-12345"
          },
          "display": "Patient"
        },
        "status": "accepted"
      },
      {
        "actor": {
          "identifier": {
            "system": "https://sender.example/fhir/practitioner-id",
            "value": "PRAC-56789"
          },
          "display": "Practitioner"
        },
        "status": "accepted"
      }
    ]
  }
}
```

## cURL Example
```bash
curl -X POST "http://localhost:8080/api/v1/fhir/push/Appointment" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <sender-api-key>" \
  -H "Idempotency-Key: <uuid-v4>" \
  -d @appointment-push.json
```

## Success Response
```json
{
  "success": true,
  "data": {
    "id": "txn_<transaction-id>",
    "requesterId": "<sender-provider-id>",
    "targetId": "<target-provider-id>",
    "resourceType": "Appointment",
    "status": "COMPLETED",
    "metadata": {
      "reason": "Referral appointment transfer",
      "notes": "Please reconcile with your scheduling system"
    },
    "createdAt": "2026-02-18T10:00:00Z",
    "updatedAt": "2026-02-18T10:00:00Z"
  }
}
```

## Forwarding Contract to Target Provider
After validation, gateway forwards to:
```http
POST {targetBaseUrl}/fhir/receive-push
```

With payload:
```json
{
  "transactionId": "string",
  "senderId": "string",
  "resourceType": "string",
  "resource": {
    "resourceType": "string"
  },
  "reason": "string",
  "notes": "string"
}
```

Gateway adds:
- `X-Gateway-Auth: <target-provider-gateway-auth-key>` (when configured)

## Common Error Cases
- `400 Bad Request`: missing `senderId`, `targetId`, `resource`, or Appointment participant identifier rules not met.
- `401 Unauthorized`: missing/invalid API key.
- `404 Not Found`: sender/target provider does not exist.
- `422 Unprocessable Entity`: FHIR schema validation failed.
- `502 Bad Gateway`: target provider unreachable or upstream forwarding failed.
