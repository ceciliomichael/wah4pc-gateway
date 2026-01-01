import type { EndpointCardProps } from "@/components/ui/endpoint-card";

// Import endpoint modules
import { healthEndpoints } from "./endpoints/health";
import { apikeysEndpoints } from "./endpoints/apikeys";
import { providersEndpoints } from "./endpoints/providers";
import { fhirEndpoints } from "./endpoints/fhir";
import { transactionsEndpoints } from "./endpoints/transactions";

// Endpoint categories with their items
export interface EndpointCategory {
  category: string;
  iconName: "Activity" | "Users" | "Server" | "FileText" | "Key";
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
    category: "API Keys",
    iconName: "Key",
    description: "Manage API keys for authentication (Admin only)",
    items: apikeysEndpoints,
  },
  {
    category: "Providers",
    iconName: "Users",
    description: "Manage healthcare provider registrations",
    items: providersEndpoints,
  },
  {
    category: "FHIR Gateway",
    iconName: "Server",
    description: "FHIR resource transfer endpoints using standard identifiers",
    items: fhirEndpoints,
  },
  {
    category: "Transactions",
    iconName: "FileText",
    description: "View and track FHIR transfer transactions (access controlled by API key role)",
    items: transactionsEndpoints,
  },
];

// Authentication information
export const authenticationInfo = {
  description: "Most endpoints require authentication via API key. Include your API key in the request header to access protected resources.",
  header: "X-API-Key",
  alternativeHeader: "Authorization: Bearer YOUR_API_KEY"
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
    code: 429,
    meaning: "Too Many Requests",
    causes: "Rate limit exceeded for your API key"
  },
  {
    code: 500,
    meaning: "Internal Server Error",
    causes: "An unexpected error occurred on the server"
  },
  {
    code: 503,
    meaning: "Service Unavailable",
    causes: "The gateway or target provider system is temporarily unavailable"
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