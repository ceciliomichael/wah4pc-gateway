import type { EndpointCardProps } from "@/components/ui/endpoint-card";

// Import endpoint modules
import { healthEndpoints } from "./endpoints/health";
import { providersEndpoints } from "./endpoints/providers";
import { fhirEndpoints } from "./endpoints/fhir";
import { transactionsEndpoints } from "./endpoints/transactions";
import { webhookEndpoints } from "./endpoints/webhooks";

// Endpoint categories with their items
export interface EndpointCategory {
  category: string;
  iconName: "Activity" | "Users" | "Server" | "FileText" | "Webhook";
  description: string;
  items: EndpointCardProps[];
}

export const endpoints: EndpointCategory[] = [
  {
    category: "Health",
    iconName: "Activity",
    description: "System health and status (public endpoint)",
    items: healthEndpoints,
  },
  {
    category: "Providers",
    iconName: "Users",
    description: "List registered healthcare providers (public endpoint)",
    items: providersEndpoints,
  },
  {
    category: "FHIR Gateway",
    iconName: "Server",
    description: "FHIR resource transfer endpoints using resource-specific request formats",
    items: fhirEndpoints,
  },
  {
    category: "Transactions",
    iconName: "FileText",
    description: "View and track FHIR transfer transactions (access controlled by API key role)",
    items: transactionsEndpoints,
  },
  {
    category: "Provider Webhooks",
    iconName: "Webhook",
    description: "Endpoints you must implement to receive gateway events",
    items: webhookEndpoints,
  },
];

// Authentication information
export const authenticationInfo = {
  description: "Most endpoints require authentication via API key. Include your API key in the request header to access protected resources.",
  header: "X-API-Key",
  alternativeHeader: "Authorization: Bearer YOUR_API_KEY"
};

// Idempotency information
export const idempotencyInfo = {
  description: "For safe retries on mutating requests (POST, PUT, PATCH, DELETE), include an Idempotency-Key header. The gateway caches responses for 24 hours, preventing duplicate processing.",
  header: "Idempotency-Key",
  valueFormat: "UUID v4 (e.g., 550e8400-e29b-41d4-a716-446655440000)",
  responseHeaders: {
    replayed: "Idempotency-Replayed",
    originalDate: "Idempotency-Original-Date"
  },
  notes: [
    "Generate a unique UUID for each logical operation",
    "Reuse the same key when retrying a failed request",
    "Keys are valid for 24 hours after first use",
    "If the original request is still processing, you'll receive a 409 Conflict"
  ]
};

// Error response data
export const errorData = [
  {
    code: 400,
    meaning: "Bad Request",
    causes: "Invalid request parameters or malformed request body"
  },
  {
    code: 401,
    meaning: "Unauthorized",
    causes: "Missing or invalid API key"
  },
  {
    code: 403,
    meaning: "Forbidden",
    causes: "Valid API key but insufficient permissions for this resource"
  },
  {
    code: 404,
    meaning: "Not Found",
    causes: "The requested resource does not exist"
  },
  {
    code: 409,
    meaning: "Conflict",
    causes: "Idempotency key is currently being processed. Retry after a short delay."
  },
  {
    code: 429,
    meaning: "Too Many Requests",
    causes: "Rate limit exceeded OR duplicate request detected within 5-minute window"
  },
  {
    code: 500,
    meaning: "Internal Server Error",
    causes: "An unexpected error occurred on the server"
  },
  {
    code: 502,
    meaning: "Bad Gateway",
    causes: "Upstream provider forwarding failed or upstream returned an error"
  }
];

// Rate limiting guidelines
export const rateLimitingGuidelines = [
  "Rate limits are enforced per API key and configured during key creation",
  "Default limit is typically 100 requests per minute (subject to configuration)",
  "When rate limit is exceeded, the gateway returns HTTP 429 with retry-after information",
  "Implement exponential backoff in your client when receiving 429 responses",
  "Contact your administrator to increase rate limits if needed for your use case"
];
