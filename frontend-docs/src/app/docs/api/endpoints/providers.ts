import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const providersEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/providers",
    description: "List providers. `practitionerList` is included only when authenticated with X-API-Key.",
    headers: [
      {
        name: "X-API-Key",
        required: false,
        description: "Optional. When present and valid, response includes each provider's practitionerList.",
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
      "facility_code": "HOSP-001",
      "location": "Quezon City",
      "baseUrl": "https://your-api.example.com",
      "practitionerListEndpoint": "/fhir/practitioners",
      "practitionerList": [
        {
          "code": "prac-001",
          "display": "Dr. Maria Santos",
          "active": true
        }
      ],
      "isActive": true
    }
  ]
}`,
  },
];
