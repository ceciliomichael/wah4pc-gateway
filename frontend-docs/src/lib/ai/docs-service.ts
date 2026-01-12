/**
 * Documentation Service for AI Tools
 * Provides structured access to documentation content for the AI assistant
 */

import fs from "fs";
import path from "path";
import { parsePageContent } from "./docs-parser";

// ============================================================================
// TYPES
// ============================================================================

export interface PageInfo {
  id: string;
  title: string;
  description: string;
}

export interface SectionInfo {
  id: string;
  name: string;
  description: string;
}

export interface PageAnalysis {
  page: string;
  title: string;
  description: string;
  sections: SectionInfo[];
}

// ============================================================================
// PAGE REGISTRY - Structured metadata about each documentation page
// ============================================================================

const PAGE_REGISTRY: Record<string, PageInfo> = {
  introduction: {
    id: "introduction",
    title: "Introduction",
    description:
      "Overview of WAH4PC Gateway, core capabilities, system architecture diagram, quick start links, and supported FHIR resources",
  },
  architecture: {
    id: "architecture",
    title: "System Architecture",
    description:
      "Detailed system architecture with sequence diagrams, transaction states, data models (Provider, Transaction), and key architectural points",
  },
  "system-flow": {
    id: "system-flow",
    title: "System Flow",
    description:
      "High-level ecosystem lifecycle: Onboarding, Discovery, Security, Data Exchange, and Monitoring phases with diagrams and key concepts",
  },
  flow: {
    id: "flow",
    title: "Transaction Flow",
    description:
      "Detailed transaction lifecycle with step-by-step flow, JSON request/response examples, transaction ID importance, and error scenarios",
  },
  integration: {
    id: "integration",
    title: "Integration Guide",
    description:
      "Complete integration guide with webhook implementation, code examples (Node.js/TypeScript, Go), required headers, and best practices",
  },
  api: {
    id: "api",
    title: "API Reference",
    description:
      "Complete API documentation: Health, Providers, FHIR Gateway, and Transactions endpoints with authentication, rate limiting, and error codes",
  },
};

// ============================================================================
// SECTION REGISTRY - Maps to actual section IDs in page.tsx files
// These IDs correspond to <section id="..."> in the React components
// ============================================================================

const SECTION_REGISTRY: Record<string, SectionInfo[]> = {
  // Introduction page - no explicit section IDs, uses implicit sections
  introduction: [
    {
      id: "core-capabilities",
      name: "Core Capabilities",
      description:
        "Async transaction model, provider validation, multi-provider support, transaction logging",
    },
    {
      id: "system-architecture",
      name: "System Architecture",
      description:
        "High-level sequence diagram showing provider request flow through the gateway",
    },
    {
      id: "quick-start",
      name: "Quick Start",
      description:
        "Links to architecture, transaction flow, integration guide, and API reference",
    },
    {
      id: "fhir-resources",
      name: "Supported FHIR Resources",
      description:
        "List of supported FHIR R4 resources: Patient, Observation, DiagnosticReport, etc.",
    },
  ],
  // Architecture page - matches <section id="..."> in page.tsx
  architecture: [
    {
      id: "components",
      name: "System Components",
      description:
        "Sequence diagram showing provider request and response flows through the gateway",
    },
    {
      id: "transaction-flow",
      name: "Transaction Flow",
      description:
        "Detailed sequence diagram of query initiation, async processing, and data relay phases",
    },
    {
      id: "states",
      name: "Transaction States",
      description:
        "State machine: PENDING → RECEIVED → COMPLETED or FAILED with transitions",
    },
    {
      id: "models",
      name: "Data Models",
      description:
        "Provider and Transaction JSON structures with field descriptions",
    },
  ],
  // System-flow page sections
  "system-flow": [
    {
      id: "lifecycle-overview",
      name: "Lifecycle Overview",
      description:
        "5-phase ecosystem lifecycle: Onboard → Discover → Secure → Exchange → Monitor",
    },
    {
      id: "onboarding",
      name: "Phase 1: Onboarding",
      description:
        "Provider registration process: POST /api/v1/providers, receive Provider ID and API Key",
    },
    {
      id: "discovery",
      name: "Phase 2: Discovery",
      description:
        "Finding other providers: GET /api/v1/providers, search by type, get target IDs",
    },
    {
      id: "security",
      name: "Phase 3: Security",
      description:
        "Authentication flow: X-API-Key validation, rate limiting, authorization",
    },
    {
      id: "data-exchange",
      name: "Phase 4: Data Exchange",
      description:
        "Core FHIR data exchange orchestration between requester and target providers",
    },
    {
      id: "monitoring",
      name: "Phase 5: Monitoring",
      description:
        "Transaction status tracking, audit logs, GET /api/v1/transactions",
    },
    {
      id: "key-concepts",
      name: "Key Concepts",
      description:
        "Provider ID, API Key, Base URL, Transaction definitions and examples",
    },
  ],
  // Flow page sections
  flow: [
    {
      id: "flow-overview",
      name: "Flow Overview",
      description:
        "Complete transaction flow sequence diagram with 5 phases and numbered steps",
    },
    {
      id: "step-by-step",
      name: "Step-by-Step Walkthrough",
      description:
        "Detailed explanation of each step from request initiation to data retrieval",
    },
    {
      id: "json-examples",
      name: "JSON Examples",
      description:
        "Request/response payloads for each step: initial request, gateway response, webhook, callback",
    },
    {
      id: "transaction-id",
      name: "Transaction ID Importance",
      description:
        "Why transaction_id matters: correlation, async processing, audit trail, idempotency",
    },
    {
      id: "consistency-rules",
      name: "Consistency Rules",
      description:
        "Rules for handling transaction_id: never modify, always include, store locally, validate format",
    },
    {
      id: "error-scenarios",
      name: "Error Scenarios",
      description:
        "Common errors: missing transaction_id, transaction not found, with request/response examples",
    },
  ],
  // Integration page sections
  integration: [
    {
      id: "overview",
      name: "Integration Overview",
      description:
        "Complete integration flow diagram showing registration, requesting data, and providing data",
    },
    {
      id: "required-headers",
      name: "Required Headers",
      description:
        "X-API-Key, X-Provider-ID, Idempotency-Key headers for API requests",
    },
    {
      id: "webhook-handlers",
      name: "Webhook Handlers",
      description:
        "Two required webhooks: /fhir/process-query and /fhir/receive-results",
    },
    {
      id: "nodejs-example",
      name: "Node.js/TypeScript Example",
      description:
        "Production-ready Express.js implementation with Zod validation and error handling",
    },
    {
      id: "go-example",
      name: "Go Example",
      description:
        "Production-ready Go implementation with validation and middleware",
    },
    {
      id: "best-practices",
      name: "Best Practices",
      description:
        "Security, error handling, idempotency, and async processing recommendations",
    },
  ],
  // API page sections
  api: [
    {
      id: "health-endpoints",
      name: "Health Endpoints",
      description:
        "System health and status check endpoints (public, no auth required)",
    },
    {
      id: "provider-endpoints",
      name: "Provider Endpoints",
      description:
        "CRUD operations for healthcare provider registrations: list, get, create, update, delete",
    },
    {
      id: "fhir-endpoints",
      name: "FHIR Gateway Endpoints",
      description:
        "FHIR resource transfer: POST /api/v1/fhir/request/{type} and /receive/{type}",
    },
    {
      id: "transaction-endpoints",
      name: "Transaction Endpoints",
      description:
        "View and track transactions: list all, get by ID, filtered by requester/target",
    },
    {
      id: "authentication",
      name: "Authentication",
      description: "API key authentication via X-API-Key or Authorization header",
    },
    {
      id: "idempotency",
      name: "Idempotency",
      description:
        "Safe retries with Idempotency-Key header, 24-hour caching, duplicate prevention",
    },
    {
      id: "error-codes",
      name: "Error Codes",
      description:
        "HTTP status codes: 400, 401, 403, 404, 409, 429, 500, 503 with causes",
    },
    {
      id: "rate-limiting",
      name: "Rate Limiting",
      description:
        "Rate limit enforcement, 429 responses, exponential backoff recommendations",
    },
  ],
};

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

/**
 * list_pages - Returns a list of all available documentation pages
 */
export function listPages(): string {
  const pages = Object.values(PAGE_REGISTRY);
  
  const lines = [
    "# Documentation Pages",
    "",
    "The following documentation pages are available:",
    ""
  ];

  for (const page of pages) {
    lines.push(`- **${page.title}** (\`${page.id}\`)`);
    lines.push(`  ${page.description}`);
  }

  return lines.join("\n");
}

/**
 * analyze_page - Returns detailed section information for a specific page
 */
export function analyzePage(pageId: string): string | null {
  const normalizedId = pageId.toLowerCase().trim();
  const pageInfo = PAGE_REGISTRY[normalizedId];
  const sections = SECTION_REGISTRY[normalizedId];

  if (!pageInfo || !sections) {
    return null;
  }

  const lines = [
    `# ${pageInfo.title} (\`${pageInfo.id}\`)`,
    "",
    pageInfo.description,
    "",
    "## Sections",
    "",
    "The following sections can be read individually:",
    ""
  ];

  for (const section of sections) {
    lines.push(`- **${section.name}** (\`${section.id}\`)`);
    lines.push(`  ${section.description}`);
  }

  return lines.join("\n");
}

/**
 * read_page - Reads the actual content of a documentation page
 * Returns clean text content, not raw code.
 * If no section is specified, reads the first section.
 * 
 * @param pageId - The page identifier (e.g., "architecture", "flow")
 * @param sectionId - Optional section ID to target specific content
 * @returns Clean text content or null if page not found
 */
export function readPage(pageId: string, sectionId?: string): string | null {
  const normalizedPageId = pageId.toLowerCase().trim();
  const pageInfo = PAGE_REGISTRY[normalizedPageId];
  const sections = SECTION_REGISTRY[normalizedPageId];

  if (!pageInfo) {
    return null;
  }

  // Build paths to the page files
  const docsDir = path.join(process.cwd(), "src", "app", "docs", normalizedPageId);

  // Read page.tsx
  const pageTsxPath = path.join(docsDir, "page.tsx");
  let pageContent: string | null = null;
  if (fs.existsSync(pageTsxPath)) {
    pageContent = fs.readFileSync(pageTsxPath, "utf-8");
  }

  if (!pageContent) {
    return null;
  }

  // Read data.ts if it exists
  const dataTsPath = path.join(docsDir, "data.ts");
  let dataContent: string | null = null;
  if (fs.existsSync(dataTsPath)) {
    dataContent = fs.readFileSync(dataTsPath, "utf-8");
  }

  // Determine the target section
  let targetSection = sectionId;
  
  // If no section specified, default to the first section
  if (!targetSection && sections && sections.length > 0) {
    targetSection = sections[0].id;
  }

  // Parse and return clean content
  const cleanContent = parsePageContent(
    pageContent,
    dataContent,
    targetSection,
    !sectionId // Include header only when reading full page (no specific section)
  );

  if (!cleanContent || cleanContent.trim().length === 0) {
    // Fallback: if parsing yields empty, try without section targeting
    return parsePageContent(pageContent, dataContent, undefined, true);
  }

  return cleanContent;
}

// ============================================================================
// TOOL DISPATCHER - Used by the API route
// ============================================================================

export type ToolName = "list_pages" | "analyze_page" | "read_page";

export interface ToolRequest {
  tool: ToolName;
  params?: Record<string, string>;
}

export interface ToolResponse {
  success: boolean;
  tool: ToolName;
  result?: string;
  error?: string;
}

export function executeDocsTool(request: ToolRequest): ToolResponse {
  const { tool, params } = request;

  switch (tool) {
    case "list_pages": {
      const result = listPages();
      return { success: true, tool, result };
    }

    case "analyze_page": {
      const page = params?.page;
      if (!page) {
        return { success: false, tool, error: "Missing required parameter: page" };
      }
      const result = analyzePage(page);
      if (!result) {
        return {
          success: false,
          tool,
          error: `Page not found: ${page}. Available pages: ${Object.keys(PAGE_REGISTRY).join(", ")}`,
        };
      }
      return { success: true, tool, result };
    }

    case "read_page": {
      const page = params?.page;
      if (!page) {
        return { success: false, tool, error: "Missing required parameter: page" };
      }
      const section = params?.section;
      const result = readPage(page, section);
      if (!result) {
        return {
          success: false,
          tool,
          error: `Page not found: ${page}. Available pages: ${Object.keys(PAGE_REGISTRY).join(", ")}`,
        };
      }
      // Return the clean text content directly as the result
      return { success: true, tool, result };
    }

    default:
      return { success: false, tool, error: `Unknown tool: ${tool}` };
  }
}