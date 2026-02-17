# Provider -> Gateway Return Formats (Core 8, Full FHIR in `data`)

Use these when target providers return query results to gateway.

## Base Endpoint Pattern
```http
POST /api/v1/fhir/receive/{resourceType}
```

Headers:
- `Content-Type: application/json`
- `X-Provider-ID: <target-provider-id>`

Common envelope:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {}
}
```

## 1. Patient
Endpoint:
```http
POST /api/v1/fhir/receive/Patient
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "pat-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"
      ]
    },
    "identifier": [
      {
        "system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
        "value": "23-1232382289-2"
      }
    ],
    "name": [
      {
        "family": "Dela Cruz",
        "given": ["Juan"]
      }
    ],
    "extension": [
      {
        "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
        "valueBoolean": false
      }
    ]
  }
}
```

## 2. Appointment
Endpoint:
```http
POST /api/v1/fhir/receive/Appointment
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Appointment",
    "id": "appt-1",
    "meta": {
      "profile": ["http://hl7.org/fhir/StructureDefinition/Appointment"]
    },
    "status": "booked",
    "start": "2026-02-17T09:00:00Z",
    "end": "2026-02-17T10:00:00Z",
    "participant": [
      {
        "actor": {
          "reference": "Patient/pat-1"
        },
        "status": "accepted"
      }
    ]
  }
}
```

## 3. Encounter
Endpoint:
```http
POST /api/v1/fhir/receive/Encounter
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Encounter",
    "id": "enc-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"
      ]
    },
    "status": "finished",
    "class": {
      "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      "code": "AMB"
    },
    "subject": {
      "reference": "Patient/pat-1"
    }
  }
}
```

## 4. Procedure
Endpoint:
```http
POST /api/v1/fhir/receive/Procedure
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Procedure",
    "id": "proc-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure"
      ]
    },
    "status": "completed",
    "code": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "80146002"
        }
      ]
    },
    "subject": {
      "reference": "Patient/pat-1"
    }
  }
}
```

## 5. Immunization
Endpoint:
```http
POST /api/v1/fhir/receive/Immunization
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Immunization",
    "id": "imm-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization"
      ]
    },
    "status": "completed",
    "vaccineCode": {
      "coding": [
        {
          "system": "http://hl7.org/fhir/sid/cvx",
          "code": "207"
        }
      ]
    },
    "patient": {
      "reference": "Patient/pat-1"
    },
    "occurrenceDateTime": "2026-02-17T09:00:00Z",
    "primarySource": true
  }
}
```

## 6. Observation
Endpoint:
```http
POST /api/v1/fhir/receive/Observation
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Observation",
    "id": "obs-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"
      ]
    },
    "status": "final",
    "code": {
      "coding": [
        {
          "system": "http://loinc.org",
          "code": "8480-6"
        }
      ]
    },
    "subject": {
      "reference": "Patient/pat-1"
    }
  }
}
```

## 7. Practitioner
Endpoint:
```http
POST /api/v1/fhir/receive/Practitioner
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Practitioner",
    "id": "prac-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner"
      ]
    },
    "identifier": [
      {
        "system": "http://example.org/fhir/Identifier/practitioner-id",
        "value": "PRAC-001"
      }
    ],
    "name": [
      {
        "family": "Santos",
        "given": ["Maria"]
      }
    ]
  }
}
```

## 8. Medication
Endpoint:
```http
POST /api/v1/fhir/receive/Medication
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Medication",
    "id": "med-1",
    "meta": {
      "profile": [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication"
      ]
    },
    "code": {
      "coding": [
        {
          "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
          "code": "1049502"
        }
      ]
    }
  }
}
```

## REJECTED / ERROR format (all resources)
Endpoint:
```http
POST /api/v1/fhir/receive/{resourceType}
```
Body:
```json
{
  "transactionId": "txn_xxx",
  "status": "REJECTED",
  "data": {
    "resourceType": "OperationOutcome",
    "issue": [
      {
        "severity": "error",
        "code": "not-found",
        "details": {
          "text": "Resource not found"
        }
      }
    ]
  }
}
```
