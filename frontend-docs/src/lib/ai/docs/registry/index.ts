/**
 * Registry Module - Main Entry Point
 * Re-exports page and section registries with helper functions
 */

export { PAGE_REGISTRY } from "./pages";
export { SECTION_REGISTRY } from "./sections";

import { PAGE_REGISTRY } from "./pages";

/**
 * Generates a formatted string listing all available pages
 * Used for injecting into the AI system prompt
 */
export function getPagesContextString(): string {
  const pages = Object.values(PAGE_REGISTRY);
  const lines: string[] = [];

  for (const page of pages) {
    lines.push(`- **${page.title}** (\`${page.id}\`): ${page.description}`);
  }

  return lines.join("\n");
}

/**
 * Get all page IDs as an array
 */
export function getAllPageIds(): string[] {
  return Object.keys(PAGE_REGISTRY);
}

/**
 * Check if a page exists in the registry
 */
export function isValidPage(pageId: string): boolean {
  return pageId.toLowerCase().trim() in PAGE_REGISTRY;
}