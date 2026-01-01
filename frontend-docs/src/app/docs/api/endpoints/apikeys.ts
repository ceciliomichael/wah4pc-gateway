import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const apikeysEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/api/v1/apikeys",
    description: "Create a new API key. Contact your system administrator to obtain an API key.",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    requestBody: `{
  "owner": "Your Application Name",
  "providerId": "550e8400-e29b-41d4-a716-446655440001",
  "role": "user",
  "rateLimit": 10
}`,
    responseStatus: 201,
    responseBody: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "key": "wah_a1b2c3d4e5f6...",
    "prefix": "wah_a1b2c3d4",
    "owner": "Your Application Name",
    "providerId": "550e8400-e29b-41d4-a716-446655440001",
    "role": "user",
    "rateLimit": 10,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`,
    notes: [
      "Requires admin role",
      "IMPORTANT: The full API key is only returned once during creation. Store it securely!",
      "Valid roles: admin, user",
      "providerId is REQUIRED for 'user' role keys - must be a valid registered provider ID",
      "providerId links the API key to a specific provider for transaction access control",
      "rateLimit is requests per second (default: 10)",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/apikeys",
    description: "List all API keys. Only shows metadata, not the actual keys.",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "prefix": "wah_a1b2c3d4",
      "owner": "Your Application Name",
      "role": "admin",
      "rateLimit": 10,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "lastUsedAt": "2024-01-15T12:00:00Z"
    }
  ]
}`,
    notes: [
      "Requires admin role",
      "Key hashes are never exposed",
      "Use prefix to identify keys in logs",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/apikeys/{id}",
    description: "Get details of a specific API key",
    pathParams: [
      { name: "id", type: "string", description: "API Key UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prefix": "wah_a1b2c3d4",
    "owner": "Your Application Name",
    "role": "user",
    "rateLimit": 10,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastUsedAt": "2024-01-15T12:00:00Z"
  }
}`,
    notes: ["Requires admin role"],
  },
  {
    method: "POST",
    path: "/api/v1/apikeys/{id}/revoke",
    description: "Revoke an API key (soft delete - key becomes inactive)",
    pathParams: [
      { name: "id", type: "string", description: "API Key UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "message": "API key revoked"
  }
}`,
    notes: [
      "Requires admin role",
      "Cannot revoke your own key",
      "Revoked keys cannot be reactivated",
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/apikeys/{id}",
    description: "Permanently delete an API key",
    pathParams: [
      { name: "id", type: "string", description: "API Key UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    responseStatus: 204,
    responseBody: "(No Content)",
    notes: [
      "Requires admin role",
      "Cannot delete your own key",
      "This action cannot be undone",
    ],
  },
];