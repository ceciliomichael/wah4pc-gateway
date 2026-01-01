import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const healthEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/health",
    description: "Check if the gateway is running and healthy. This endpoint does not require authentication.",
    responseStatus: 200,
    responseBody: `{
  "status": "healthy",
  "service": "wah4pc-gateway"
}`,
  },
];