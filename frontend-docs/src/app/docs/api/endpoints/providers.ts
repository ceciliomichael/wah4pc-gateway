import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const providersEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/providers",
    description: "List all registered healthcare providers",
    headers: [],
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
    method: "GET",
    path: "/api/v1/providers/facilities/{facilityCode}/practitioners",
    description: "Fetch practitioners for a facility as selector-ready options",
    headers: ["X-API-Key: your-api-key"],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "prac-123",
      "reference": "Practitioner/prac-123",
      "display": "Dr. Juan Dela Cruz",
      "identifiers": [
        {
          "system": "http://prc.gov.ph/license",
          "value": "PRC-001"
        }
      ]
    }
  ]
}`,
  },
];
