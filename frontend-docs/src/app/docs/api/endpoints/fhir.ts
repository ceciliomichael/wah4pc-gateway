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
];