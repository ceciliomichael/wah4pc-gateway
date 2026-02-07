import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const transactionsEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/transactions",
    description: "List transactions. Admin keys see all transactions. User keys only see transactions where their linked provider is the requester or target.",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "requesterId": "provider-uuid-1",
      "targetId": "provider-uuid-2",
      "identifiers": [
        {
          "system": "http://philhealth.gov.ph",
          "value": "12-345678901-2"
        }
      ],
      "resourceType": "Patient",
      "status": "COMPLETED",
      "metadata": {
        "reason": "Referral",
        "notes": ""
      },
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:05:00Z"
    }
  ]
}`,
    notes: [
      "Admin API keys: Returns ALL transactions in the system",
      "User API keys: Returns only transactions where the linked provider is requester or target",
      "Access control is automatic based on the providerId linked to your API key",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/transactions/{id}",
    description: "Get details of a specific transaction. User keys can only access transactions where their linked provider is involved.",
    pathParams: [
      { name: "id", type: "string", description: "Transaction UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "requesterId": "provider-uuid-1",
    "targetId": "provider-uuid-2",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      },
      {
        "system": "http://hospital-metro.com/mrn",
        "value": "MRN-12345"
      }
    ],
    "resourceType": "Patient",
    "status": "COMPLETED",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Urgent request for patient records"
    },
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:05:00Z"
  }
}`,
    notes: [
      "Admin API keys can access any transaction",
      "User API keys can only access transactions where their provider is requester or target",
      "Returns 403 Forbidden if user attempts to access unauthorized transaction",
    ],
  },
];