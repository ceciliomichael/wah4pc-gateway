/**
 * Documentation AI Tools - Main Entry Point
 * Re-exports all modules for convenient importing
 */

// Types
export type {
  PageInfo,
  SectionInfo,
  PageAnalysis,
  ToolName,
  ToolRequest,
  ToolResponse,
  PageSearchResult,
} from "./types";

// Registry
export {
  PAGE_REGISTRY,
  SECTION_REGISTRY,
  getPagesContextString,
  getAllPageIds,
  isValidPage,
} from "./registry";

// Resource extraction
export {
  extractResourceContent,
  readResourceFileContent,
  getAvailableResourceSlugs,
} from "./resource-extractor";

// Content reading
export {
  readPage,
  readFullPageContent,
  extractSnippet,
} from "./content-reader";

// Search
export { searchPage } from "./search";

// Tools
export { listPages, analyzePage, executeDocsTool } from "./tools";