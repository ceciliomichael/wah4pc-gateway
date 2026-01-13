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
  // Introduction page - no explicit section IDs in the page
  introduction: [],
  
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
  
  // System-flow page sections - matches actual section IDs
  "system-flow": [
    {
      id: "intro",
      name: "Introduction",
      description:
        "Overview of the WAH4PC Gateway and comparison between System Flow and Transaction Flow",
    },
    {
      id: "lifecycle",
      name: "The Provider Lifecycle",
      description:
        "5-phase ecosystem lifecycle: Onboard → Discover → Secure → Exchange → Monitor",
    },
    {
      id: "phases",
      name: "Phase-by-Phase Breakdown",
      description:
        "Detailed breakdown of each phase with diagrams and key insights",
    },
    {
      id: "comparison",
      name: "System Flow vs Transaction Flow",
      description:
        "Comparison table explaining the difference between macro and micro level flows",
    },
    {
      id: "concepts",
      name: "Key Concepts",
      description:
        "Provider ID, API Key, Base URL, Transaction definitions and examples",
    },
    {
      id: "quick-start",
      name: "Quick Start Path",
      description:
        "Step-by-step guide from registration to first data exchange",
    },
    {
      id: "next-steps",
      name: "Next Steps",
      description:
        "Links to Provider Integration and Transaction Flow documentation",
    },
  ],
  
  // Flow page sections - matches actual section IDs
  flow: [
    {
      id: "intro",
      name: "Introduction",
      description:
        "Overview of the asynchronous request/response model and transaction_id importance",
    },
    {
      id: "transaction-id",
      name: "The Transaction ID",
      description:
        "Why transaction_id matters: correlation, async processing, audit trail, idempotency",
    },
    {
      id: "lifecycle",
      name: "Complete Transaction Lifecycle",
      description:
        "Complete flow sequence diagram from request initiation to final response",
    },
    {
      id: "step-by-step",
      name: "Step-by-Step with JSON Examples",
      description:
        "Detailed walkthrough with request/response payloads for each step",
    },
    {
      id: "consistency",
      name: "Consistency Rules",
      description:
        "Rules for handling transaction_id: never modify, always include, store locally",
    },
    {
      id: "errors",
      name: "Common Error Scenarios",
      description:
        "Common errors: missing transaction_id, transaction not found, with examples",
    },
    {
      id: "steps",
      name: "Detailed Step Reference",
      description:
        "Comprehensive breakdown of each step in the transaction lifecycle",
    },
    {
      id: "summary",
      name: "Summary",
      description:
        "Key takeaways about transaction_id handling and async processing",
    },
  ],
  
  // Integration page sections - matches actual section IDs
  integration: [
    {
      id: "prerequisites",
      name: "Prerequisites",
      description:
        "Requirements before starting integration: HTTPS endpoint, FHIR knowledge, etc.",
    },
    {
      id: "flow",
      name: "Integration Flow Overview",
      description:
        "Complete integration flow diagram showing registration, requesting, and providing data",
    },
    {
      id: "registration",
      name: "Register Your Organization",
      description:
        "Step 1: POST /api/v1/providers to create a provider record",
    },
    {
      id: "webhooks",
      name: "Implement Webhook Endpoints",
      description:
        "Step 2: Two required webhooks - /fhir/process-query and /fhir/receive-results",
    },
    {
      id: "identifiers",
      name: "Understanding Patient Identifiers",
      description:
        "FHIR-compliant identifiers with system URIs and matching logic",
    },
    {
      id: "requests",
      name: "Request Data from Other Providers",
      description:
        "Step 3: Initiate queries using POST /api/v1/fhir/request/{resourceType}",
    },
    {
      id: "best-practices",
      name: "Best Practices",
      description:
        "Security, error handling, idempotency, and async processing recommendations",
    },
    {
      id: "pitfalls",
      name: "Common Pitfalls to Avoid",
      description:
        "Common mistakes and how to avoid them during integration",
    },
    {
      id: "security",
      name: "Security Considerations",
      description:
        "Security best practices for API keys, HTTPS, and data protection",
    },
    {
      id: "examples",
      name: "Complete Webhook Implementation",
      description:
        "Production-ready code examples in Node.js, Go, Python, and Dart",
    },
    {
      id: "checklist",
      name: "Integration Checklist",
      description:
        "Final checklist to verify your integration is complete",
    },
  ],
  
  // API page sections - matches actual section IDs
  api: [
    {
      id: "base-url",
      name: "Base URL",
      description:
        "Gateway base URL for all API requests",
    },
    {
      id: "auth",
      name: "Authentication",
      description:
        "API key authentication via X-API-Key or Authorization header",
    },
    {
      id: "endpoints",
      name: "API Endpoints",
      description:
        "All available endpoints: Health, Providers, FHIR Gateway, and Transactions",
    },
    {
      id: "errors",
      name: "Error Responses",
      description:
        "Standard error format and HTTP status codes: 400, 401, 403, 404, 429, 500, etc.",
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