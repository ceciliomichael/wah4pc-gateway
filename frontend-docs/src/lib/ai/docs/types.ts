/**
 * Type definitions for the Documentation AI Tools
 */

/**
 * Metadata about a documentation page
 */
export interface PageInfo {
  id: string;
  title: string;
  description: string;
}

/**
 * Metadata about a section within a page
 */
export interface SectionInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Result of analyzing a page's structure
 */
export interface PageAnalysis {
  page: string;
  title: string;
  description: string;
  sections: SectionInfo[];
}

/**
 * Available tool names for the documentation service
 */
export type ToolName = "list_pages" | "analyze_page" | "read_page" | "search_page";

/**
 * Request structure for executing a documentation tool
 */
export interface ToolRequest {
  tool: ToolName;
  params?: Record<string, string>;
}

/**
 * Response structure from a documentation tool execution
 */
export interface ToolResponse {
  success: boolean;
  tool: ToolName;
  result?: string;
  error?: string;
}

/**
 * Search result for a single page
 */
export interface PageSearchResult {
  pageId: string;
  pageTitle: string;
  snippets: string[];
  matchCount: number;
  metadataMatch: boolean;
}