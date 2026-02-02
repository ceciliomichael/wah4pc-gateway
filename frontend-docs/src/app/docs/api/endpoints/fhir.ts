import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const fhirEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/api/v1/fhir/request/{resourceType}",
    description: "Initiate a FHIR resource request to another provider. Uses FHIR-compliant identifiers (system + value) to identify the patient across different healthcare systems.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type (e.g., Patient, Observation)",
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
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://hospital-b.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "reason": "Referral consultation",
  "notes": "Need latest lab results"
}`,
    responseStatus: 202,
    responseBody: `{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "requesterId": "your-provider-uuid",
    "targetId": "target-provider-uuid",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      },
      {
        "system": "http://hospital-b.com/mrn",
        "value": "MRN-12345"
      }
    ],
    "resourceType": "Patient",
    "status": "PENDING",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Need latest lab results"
    },
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}`,
    notes: [
      "Both requesterId and targetId must be registered providers",
      "identifiers is an array of FHIR-compliant identifiers (system + value pairs)",
      "At least one identifier is required",
      "Common systems: http://philhealth.gov.ph, http://psa.gov.ph/birth-certificate, or your hospital's MRN system",
      "The gateway forwards the request to the target's /fhir/process-query endpoint",
      "Results will be delivered to your /fhir/receive-results endpoint asynchronously",
      "**Idempotency**: Use `Idempotency-Key` header for safe retries. Keys are cached for 24 hours.",
      "**Duplicate Detection**: Identical requests (same requester, target, identifiers) within 5 minutes return 429.",
      "**Response Headers**: `Idempotency-Replayed: true` and `Idempotency-Original-Date` indicate cached responses.",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/receive/{resourceType}",
    description: "Endpoint for target providers to send data back to the gateway",
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
  "transactionId": "transaction-uuid-from-request",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "message": "result received and forwarded"
  }
}`,
    notes: [
      "The transactionId must match a PENDING transaction",
      "X-Provider-ID header is optional but recommended for security validation",
      "Valid status values: SUCCESS, REJECTED, ERROR",
      "The gateway forwards the data to the requester's /fhir/receive-results endpoint",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/push/{resourceType}",
    description: "Push a FHIR resource directly to another provider without a prior request. Useful for sending referrals, appointments, or unsolicited results.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type (e.g., Appointment, DocumentReference)",
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
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`,
    responseStatus: 200,
    responseBody: `{
  "id": "transaction-uuid",
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "status": "COMPLETED",
  "metadata": {
    "reason": "New Appointment Request",
    "notes": "Please confirm availability"
  },
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}`,
    notes: [
      "Target provider must support receiving unsolicited pushes via /fhir/receive-push",
      "Transaction status is immediately updated to COMPLETED upon successful delivery",
      "Data must be a valid FHIR resource matching the resourceType",
      "The senderId becomes the requesterId in the transaction record",
    ],
  },
];