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
- `Appointment`: include `status` and at least one `participant` with `participant.status` plus either `participant.actor` or `participant.type`.
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
For `resourceType = Appointment`, gateway enforces these FHIR-aligned checks before forwarding:

- `resource.status` is required.
- `resource.participant` must contain at least one entry.
- Each `resource.participant[]` must include `status`.
- Each `resource.participant[]` must include either `actor` or `type` (FHIR invariant `app-1`).

If any of the above are missing, the request is rejected with HTTP 400.

## Appointment Payload Schema (Gateway Push)
Use this shape when sending `POST /api/v1/fhir/push/Appointment`:

```json
{
  "senderId": "string (required, provider UUID)",
  "targetId": "string (required, provider UUID)",
  "reason": "string (optional)",
  "notes": "string (optional)",
  "resource": {
    "resourceType": "Appointment (required)",
    "id": "string (recommended)",
    "status": "proposed | pending | booked | arrived | fulfilled | cancelled | noshow",
    "start": "FHIR dateTime (recommended)",
    "end": "FHIR dateTime (recommended)",
    "appointmentType": {
      "coding": [
        {
          "system": "string",
          "code": "string",
          "display": "string (recommended for UI)"
        }
      ]
    },
    "participant": [
      {
        "actor": {
          "reference": "Patient/{id} | Practitioner/{id} | Location/{id} (optional)",
          "display": "string (recommended)",
          "identifier": {
            "system": "string (optional)",
            "value": "string (optional)"
          }
        },
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                "code": "PPRF",
                "display": "primary performer"
              }
            ]
          }
        ],
        "status": "accepted | declined | tentative | needs-action"
      }
    ]
  }
}
```

Notes:
- `resource.resourceType` must match the URL path (`Appointment`).
- Use real FHIR `Reference` in `participant.actor` (`reference` and/or `identifier` as needed by your system).
- If `participant.actor` is omitted, provide `participant.type` to satisfy FHIR `app-1`.
- For Wah4Clinic edit UX, include `actor.display` and `appointmentType.coding.display`.

## Minimum Valid Appointment Push
```json
{
  "senderId": "<sender-provider-id>",
  "targetId": "<target-provider-id>",
  "resource": {
    "resourceType": "Appointment",
    "status": "proposed",
    "start": "2026-02-20T09:00:00Z",
    "appointmentType": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
          "code": "FOLLOWUP",
          "display": "Follow-up"
        }
      ]
    },
    "participant": [
      {
        "actor": {
          "reference": "Patient/PAT-12345",
          "display": "Juan Dela Cruz",
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
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Referral appointment transfer",
  "notes": "Please reconcile with local scheduling and notify patient",
  "resource": {
    "resourceType": "Appointment",
    "id": "appt-2026-000123",
    "identifier": [
      {
        "system": "https://sender.example/fhir/appointment-id",
        "value": "APT-2026-000123"
      }
    ],
    "meta": {
      "profile": [
        "http://hl7.org/fhir/StructureDefinition/Appointment"
      ]
    },
    "status": "booked",
    "description": "Initial cardiology consultation",
    "comment": "Bring previous ECG and lab results.",
    "start": "2026-03-05T09:00:00+08:00",
    "end": "2026-03-05T09:30:00+08:00",
    "minutesDuration": 30,
    "created": "2026-02-18T10:15:00+08:00",
    "appointmentType": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
          "code": "FOLLOWUP",
          "display": "A follow up visit from a previous appointment"
        }
      ],
      "text": "Follow-up"
    },
    "serviceCategory": [
      {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/service-category",
            "code": "17",
            "display": "General Practice"
          }
        ]
      }
    ],
    "specialty": [
      {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "394579002",
            "display": "Cardiology"
          }
        ]
      }
    ],
    "participant": [
      {
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                "code": "PAT",
                "display": "patient"
              }
            ]
          }
        ],
        "actor": {
          "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
          "identifier": {
            "system": "https://sender.example/fhir/patient-id",
            "value": "a43ba81b-c551-463a-8774-046fb91f82a2"
          },
          "display": "Mariel Atienza Gravidez",
          "type": "Patient"
        },
        "required": "required",
        "status": "accepted"
      },
      {
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                "code": "PPRF",
                "display": "primary performer"
              }
            ]
          }
        ],
        "actor": {
          "reference": "Practitioner/789a25b5-809f-4c5d-b28e-d6eb1c9e8765",
          "identifier": {
            "system": "https://sender.example/fhir/practitioner-id",
            "value": "789a25b5-809f-4c5d-b28e-d6eb1c9e8765"
          },
          "display": "Dr. Ron Samanniego Samanniego",
          "type": "Practitioner"
        },
        "required": "required",
        "status": "accepted"
      }
    ]
  }
}
```

## Other Wah4Clinic-Supported Push Request Body Examples

### Patient (`POST /api/v1/fhir/push/Patient`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Patient demographic sync",
  "notes": "Source clinic registration update",
  "resource": {
    "resourceType": "Patient",
    "id": "a43ba81b-c551-463a-8774-046fb91f82a2",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
        "value": "PH-0099887766"
      }
    ],
    "name": [
      {
        "family": "Gravidez",
        "given": ["Mariel", "Atienza"]
      }
    ],
    "gender": "female",
    "birthDate": "1990-10-24"
  }
}
```

### Practitioner (`POST /api/v1/fhir/push/Practitioner`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Provider roster sync",
  "notes": "New attending physician",
  "resource": {
    "resourceType": "Practitioner",
    "id": "789a25b5-809f-4c5d-b28e-d6eb1c9e8765",
    "identifier": [
      {
        "system": "https://sender.example/fhir/practitioner-id",
        "value": "789a25b5-809f-4c5d-b28e-d6eb1c9e8765"
      }
    ],
    "name": [
      {
        "prefix": ["Dr."],
        "family": "Samanniego",
        "given": ["Ron", "Samanniego"]
      }
    ]
  }
}
```

### Encounter (`POST /api/v1/fhir/push/Encounter`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Encounter handoff",
  "notes": "Outpatient visit linked to referral",
  "resource": {
    "resourceType": "Encounter",
    "id": "enc-2026-001",
    "status": "finished",
    "class": {
      "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      "code": "AMB",
      "display": "ambulatory"
    },
    "subject": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    },
    "participant": [
      {
        "individual": {
          "reference": "Practitioner/789a25b5-809f-4c5d-b28e-d6eb1c9e8765",
          "display": "Dr. Ron Samanniego Samanniego"
        }
      }
    ]
  }
}
```

### Procedure (`POST /api/v1/fhir/push/Procedure`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Procedure documentation sync",
  "notes": "Performed during ambulatory encounter",
  "resource": {
    "resourceType": "Procedure",
    "id": "proc-2026-001",
    "status": "completed",
    "code": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "165171009",
          "display": "Blood pressure measurement"
        }
      ],
      "text": "Blood pressure measurement"
    },
    "subject": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    },
    "performedDateTime": "2026-03-05T09:10:00+08:00"
  }
}
```

### Immunization (`POST /api/v1/fhir/push/Immunization`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Immunization record sync",
  "notes": "Administered vaccine update",
  "resource": {
    "resourceType": "Immunization",
    "id": "imm-2026-001",
    "status": "completed",
    "vaccineCode": {
      "coding": [
        {
          "system": "http://hl7.org/fhir/sid/cvx",
          "code": "208",
          "display": "COVID-19"
        }
      ],
      "text": "COVID-19"
    },
    "patient": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    },
    "occurrenceDateTime": "2026-03-05T10:00:00+08:00"
  }
}
```

### Observation (`POST /api/v1/fhir/push/Observation`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Vital signs sync",
  "notes": "BP panel result from visit",
  "resource": {
    "resourceType": "Observation",
    "id": "obs-2026-001",
    "status": "final",
    "code": {
      "coding": [
        {
          "system": "http://loinc.org",
          "code": "85354-9",
          "display": "Blood Pressure Panel"
        }
      ],
      "text": "Blood Pressure Panel"
    },
    "subject": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    },
    "effectiveDateTime": "2026-03-05T09:12:00+08:00"
  }
}
```

### DiagnosticReport (`POST /api/v1/fhir/push/DiagnosticReport`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Diagnostic report sync",
  "notes": "Linked to observation results",
  "resource": {
    "resourceType": "DiagnosticReport",
    "id": "dr-2026-001",
    "status": "final",
    "code": {
      "coding": [
        {
          "system": "http://loinc.org",
          "code": "58410-2",
          "display": "Complete blood count panel"
        }
      ],
      "text": "Complete blood count panel"
    },
    "subject": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    }
  }
}
```

### Medication (`POST /api/v1/fhir/push/Medication`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Medication master sync",
  "notes": "New formulary item",
  "resource": {
    "resourceType": "Medication",
    "id": "med-2026-001",
    "status": "active",
    "code": {
      "coding": [
        {
          "system": "urn://example.com/ph-core/fhir/ValueSet/drugs",
          "code": "MET500",
          "display": "Metformin 500 mg tablet"
        }
      ],
      "text": "Metformin 500 mg tablet"
    }
  }
}
```

### MedicationRequest (`POST /api/v1/fhir/push/MedicationRequest`)
```json
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "Prescription sync",
  "notes": "Discharge medication order",
  "resource": {
    "resourceType": "MedicationRequest",
    "id": "mr-2026-001",
    "status": "active",
    "intent": "order",
    "medicationCodeableConcept": {
      "coding": [
        {
          "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
          "code": "860975",
          "display": "Metformin 500 MG Oral Tablet"
        }
      ],
      "text": "Metformin 500 MG Oral Tablet"
    },
    "subject": {
      "reference": "Patient/a43ba81b-c551-463a-8774-046fb91f82a2",
      "display": "Mariel Atienza Gravidez"
    }
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
- `400 Bad Request`: missing `senderId`, `targetId`, `resource`, URL/body `resourceType` mismatch, or Appointment FHIR invariant checks not met.
- `401 Unauthorized`: missing/invalid API key.
- `404 Not Found`: sender/target provider does not exist.
- `422 Unprocessable Entity`: FHIR schema validation failed.
- `502 Bad Gateway`: target provider unreachable or upstream forwarding failed.
