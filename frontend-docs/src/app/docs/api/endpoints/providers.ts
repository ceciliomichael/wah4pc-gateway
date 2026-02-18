import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const providersEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/providers",
    description: "List providers for discovery. Response intentionally excludes internal callback routing fields.",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: false,
        description: "Optional. Public and authenticated responses share the same provider list shape.",
      },
    ],
    responseStatus: 200,
    responseBody: `[
    {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Hospital",
    "type": "hospital",
    "facility_code": "HOSP-001",
    "location": "Quezon City",
    "isActive": true
    }
  ]
]`,
    notes: [
      "The provider list does not expose internal fields such as `baseUrl`, `gatewayAuthKey`, `practitionerListEndpoint`, or `practitionerList`.",
      "Use this endpoint for discovery (`id`, `facility_code`, and `isActive`) before calling data exchange endpoints.",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/providers/{id}/practitioners/webhook",
    description:
      "Provider-triggered sync hook. Call this after creating/updating practitioners so the gateway refreshes the cached practitioner list for this provider.",
    pathParams: [
      {
        name: "id",
        type: "string",
        description: "Provider ID (UUID). For user API keys, this must match the key's provider scope.",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
        description: "Required. Admin keys can sync any provider; user keys can sync only their own provider ID.",
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Example Hospital",
  "type": "hospital",
  "facility_code": "HOSP-001",
  "location": "Quezon City",
  "isActive": true
}`,
    notes: [
      "This webhook triggers the gateway to fetch your configured practitioner list endpoint and update cached practitioners.",
      "Recommended trigger timing: immediately after practitioner create, update, or deactivate operations.",
    ],
  },
];
