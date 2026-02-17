# Profile Normalization Report

## Purpose

The gateway now normalizes `meta.profile` URIs for successful query responses before relaying data to the requester.

Normalization point:

- `target -> gateway (/api/v1/fhir/receive/{resourceType}) -> requester (/fhir/receive-results)`

No normalization is applied to `REJECTED`/`ERROR` query results or push flows.

## Canonical URI Rules

1. PH Core resource types are rewritten to PH Core canonical URIs:
   - Patient, Encounter, Procedure, Immunization, Observation, Medication, Location, Organization, Practitioner
2. Other allowed gateway resource types are rewritten to base FHIR R4 URI format:
   - `http://hl7.org/fhir/StructureDefinition/{ResourceType}`

## Example Incoming Request Body (from target to gateway)

`POST /api/v1/fhir/receive/Observation`

```json
{
  "transactionId": "txn-profile-phcore",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Observation",
    "id": "obs-1",
    "meta": {
      "profile": ["http://provider.local/StructureDefinition/custom-observation"]
    }
  }
}
```

## Example Relayed Payload (gateway to requester)

```json
{
  "transactionId": "txn-profile-phcore",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "Observation",
          "id": "obs-1",
          "meta": {
            "profile": ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"]
          }
        }
      }
    ]
  }
}
```

## Transaction Metadata Audit Fields

When normalization changes are applied, transaction metadata now records:

- `profileNormalizationApplied`
- `originalProfiles`
- `normalizedProfiles`

## Automated Tests Added

- `internal/service/profile_normalizer_test.go`
- `internal/service/gateway_service_process_response_test.go` (normalization scenarios for PH Core and base R4 fallback)

