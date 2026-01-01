import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const providersEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/providers",
    description: "List all registered healthcare providers",
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
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Example Hospital",
      "type": "hospital",
      "baseUrl": "https://your-api.example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/v1/providers",
    description: "Register a new healthcare provider",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    requestBody: `{
  "name": "Example Hospital",
  "type": "hospital",
  "baseUrl": "https://your-api.example.com",
  "gatewayAuthKey": "your-secret-key-here"
}`,
    responseStatus: 201,
    responseBody: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Hospital",
    "type": "hospital",
    "baseUrl": "https://your-api.example.com",
    "gatewayAuthKey": "your-secret-key-here",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}`,
    notes: [
      "Valid types: clinic, hospital, laboratory, pharmacy",
      "baseUrl must be publicly accessible",
      "Save the returned id for future requests",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/providers/{id}",
    description: "Get a specific provider by ID",
    pathParams: [
      { name: "id", type: "string", description: "Provider UUID" },
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
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Hospital",
    "type": "hospital",
    "baseUrl": "https://your-api.example.com",
    "gatewayAuthKey": "your-secret-key-here",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}`,
  },
  {
    method: "PUT",
    path: "/api/v1/providers/{id}",
    description: "Update an existing provider",
    pathParams: [
      { name: "id", type: "string", description: "Provider UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    requestBody: `{
  "name": "Example Hospital - Updated",
  "type": "hospital",
  "baseUrl": "https://your-api-v2.example.com"
}`,
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Hospital - Updated",
    "type": "hospital",
    "baseUrl": "https://your-api-v2.example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}`,
    notes: ["All fields are optional - only provided fields will be updated"],
  },
  {
    method: "DELETE",
    path: "/api/v1/providers/{id}",
    description: "Remove a provider from the registry",
    pathParams: [
      { name: "id", type: "string", description: "Provider UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    responseStatus: 204,
    responseBody: "(No Content)",
    notes: [
      "This action cannot be undone",
      "Active transactions may fail if provider is deleted",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/providers/{id}/status",
    description: "Enable or disable a provider. Disabled providers cannot participate in data exchanges.",
    pathParams: [
      { name: "id", type: "string", description: "Provider UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-admin-api-key",
        required: true,
      },
    ],
    requestBody: `{
  "active": true
}`,
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Hospital",
    "type": "hospital",
    "baseUrl": "https://your-api.example.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:00:00Z"
  }
}`,
    notes: [
      "Requires admin role",
      "Set active: false to temporarily disable a provider",
      "Set active: true to re-enable a disabled provider",
      "Disabled providers will reject incoming FHIR requests",
    ],
  },
];