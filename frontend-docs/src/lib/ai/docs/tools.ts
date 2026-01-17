/**
 * Tool Implementations Module
 * Provides the documentation tools that the AI can use
 */

import { PAGE_REGISTRY, SECTION_REGISTRY } from "./registry";
import { readPage } from "./content-reader";
import { searchPage } from "./search";
import type { ToolName, ToolRequest, ToolResponse } from "./types";

/**
 * list_pages - Returns a list of all available documentation pages
 */
export function listPages(): string {
  const pages = Object.values(PAGE_REGISTRY);

  const lines = [
    "# Documentation Pages",
    "",
    "The following documentation pages are available:",
    "",
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
    "",
  ];

  for (const section of sections) {
    lines.push(`- **${section.name}** (\`${section.id}\`)`);
    lines.push(`  ${section.description}`);
  }

  return lines.join("\n");
}

/**
 * Executes a documentation tool based on the request
 * This is the main dispatcher used by the API route
 */
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
        return {
          success: false,
          tool,
          error: "Missing required parameter: page",
        };
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
        return {
          success: false,
          tool,
          error: "Missing required parameter: page",
        };
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
      return { success: true, tool, result };
    }

    case "search_page": {
      const query = params?.query;
      if (!query) {
        return {
          success: false,
          tool,
          error: "Missing required parameter: query",
        };
      }
      const page = params?.page;
      const result = searchPage(query, page);
      return { success: true, tool, result };
    }

    default:
      return { success: false, tool, error: `Unknown tool: ${tool}` };
  }
}