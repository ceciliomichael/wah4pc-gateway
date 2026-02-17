import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const fhirEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/api/v1/fhir/request/{resourceType}",
    description:
      "Initiate a FHIR query to another provider. Use the resource-specific request body format for the chosen resource type.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "Supported FHIR resource type (for this gateway's 25-resource allowlist)",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries. Required for mutating requests.",
      },
    ],
    requestBody: `{
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "patientIdentifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
  "reason": "Referral consultation",
  "notes": "Need latest lab results"
}`,
    responseStatus: 202,
    responseBody: `{
  "success": true,
  "data": {
    "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "requesterId": "your-provider-uuid",
    "targetId": "target-provider-uuid",
    "resourceType": "Patient",
    "status": "PENDING",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Need latest lab results"
    },
    "createdAt": "2026-02-17T11:00:00Z",
    "updatedAt": "2026-02-17T11:00:00Z"
  }
}`,
    notes: [
      "Use `/docs/request-formats` for all 25 request body formats.",
      "Both requesterId and targetId must be registered providers.",
      "Idempotency is required for safe retries on POST requests.",
      "The gateway forwards the query to target provider `/fhir/process-query`.",
      "Results are sent asynchronously to requester `/fhir/receive-results`.",
      "Duplicate requests inside the 5-minute window can return HTTP 429.",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/receive/{resourceType}",
    description: "Endpoint used by target providers to send result payloads back to the gateway.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type matching the original request",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "X-Provider-ID",
        value: "your-provider-uuid",
        required: false,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries when sending results back.",
      },
    ],
    requestBody: `{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "Observation",
          "status": "final",
          "code": {
            "coding": [
              {
                "system": "http://loinc.org",
                "code": "8480-6"
              }
            ]
          }
        }
      }
    ]
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "message": "result received and processed"
  }
}`,
    notes: [
      "transactionId must match a pending transaction.",
      "status values: SUCCESS, REJECTED, ERROR.",
      "For SUCCESS, send full FHIR resource payloads (Bundle or resource JSON).",
      "For REJECTED/ERROR, `data` must be a FHIR OperationOutcome.",
      "Gateway policy currently does not relay REJECTED to requester `/fhir/receive-results`.",
      "See `/docs/request-formats` and `format/provider-return-core8.md` for concrete payload formats.",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/push/{resourceType}",
    description:
      "Push a FHIR resource directly to another provider without a prior query (unsolicited transfer).",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type (e.g., Appointment, Observation)",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries. Required for mutating requests.",
      },
    ],
    requestBody: `{
  "senderId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resource": {
    "resourceType": "Appointment",
    "status": "proposed",
    "start": "2026-02-20T09:00:00Z"
  },
  "reason": "New appointment",
  "notes": "Please confirm availability"
}`,
    responseStatus: 200,
    responseBody: `{
  "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "status": "COMPLETED",
  "createdAt": "2026-02-17T11:00:00Z",
  "updatedAt": "2026-02-17T11:00:00Z"
}`,
    notes: [
      "Target provider must support `/fhir/receive-push`.",
      "`resource` must be valid FHIR JSON for the given resourceType.",
      "Top-level `resourceType` in body is not used. The URL path and `resource.resourceType` must match.",
      "Push transactions are completed immediately after successful forward.",
    ],
  },
];
