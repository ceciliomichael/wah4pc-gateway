/**
 * Search Module
 * Handles searching across documentation pages with enhanced metadata matching
 */

import { PAGE_REGISTRY } from "./registry";
import { readFullPageContent, extractSnippet } from "./content-reader";
import type { PageSearchResult } from "./types";

/**
 * Searches for text across documentation pages.
 * Enhanced to also search page metadata (titles/descriptions) for better results.
 *
 * @param query - The search term to find
 * @param targetPage - Optional: specific page ID to search within
 * @returns Formatted search results with page matches and context
 */
export function searchPage(query: string, targetPage?: string): string {
  if (!query || query.trim().length === 0) {
    return "Error: Search query cannot be empty.";
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: PageSearchResult[] = [];

  // Determine which pages to search
  const pagesToSearch = targetPage
    ? [targetPage.toLowerCase().trim()]
    : Object.keys(PAGE_REGISTRY);

  // Validate target page if specified
  if (targetPage && !PAGE_REGISTRY[targetPage.toLowerCase().trim()]) {
    return `Error: Page "${targetPage}" not found. Available pages: ${Object.keys(PAGE_REGISTRY).join(", ")}`;
  }

  // Search through pages
  for (const pageId of pagesToSearch) {
    const pageInfo = PAGE_REGISTRY[pageId];
    if (!pageInfo) continue;

    const snippets: string[] = [];
    let matchCount = 0;
    let metadataMatch = false;

    // ENHANCEMENT: First, check page metadata (title and description)
    // This ensures we find pages even if file content reading fails
    const titleLower = pageInfo.title.toLowerCase();
    const descLower = pageInfo.description.toLowerCase();

    if (titleLower.includes(normalizedQuery)) {
      metadataMatch = true;
      matchCount++;
      snippets.push(`**Title match**: ${pageInfo.title}`);
    }

    if (descLower.includes(normalizedQuery)) {
      metadataMatch = true;
      // Count occurrences in description
      let descIndex = 0;
      while ((descIndex = descLower.indexOf(normalizedQuery, descIndex)) !== -1) {
        matchCount++;
        descIndex += normalizedQuery.length;
      }
      snippets.push(`**Description**: ${pageInfo.description}`);
    }

    // Then search file content
    const content = readFullPageContent(pageId);
    if (content) {
      const lowerContent = content.toLowerCase();

      // Find all matches and collect snippets
      let searchIndex = 0;

      while ((searchIndex = lowerContent.indexOf(normalizedQuery, searchIndex)) !== -1) {
        matchCount++;

        // Collect up to 3 unique content snippets per page (in addition to metadata)
        if (snippets.length < 5) {
          const snippet = extractSnippet(content, searchIndex, normalizedQuery.length);
          // Avoid duplicate or very similar snippets
          const isDuplicate = snippets.some(
            (s) =>
              s.includes(snippet.slice(10, 50)) ||
              snippet.includes(s.slice(10, 50))
          );
          if (!isDuplicate && !snippet.startsWith("**")) {
            snippets.push(snippet);
          }
        }

        searchIndex += normalizedQuery.length;
      }
    }

    if (matchCount > 0) {
      results.push({
        pageId,
        pageTitle: pageInfo.title,
        snippets,
        matchCount,
        metadataMatch,
      });
    }
  }

  // Format results
  if (results.length === 0) {
    const searchScope = targetPage
      ? `in page "${targetPage}"`
      : "across all documentation pages";
    return `# Search Results\n\nNo matches found for "${query}" ${searchScope}.\n\nTry different keywords or use \`list_pages\` to browse available documentation.`;
  }

  // Sort: metadata matches first, then by match count
  results.sort((a, b) => {
    // Prioritize metadata matches (title/description)
    if (a.metadataMatch && !b.metadataMatch) return -1;
    if (!a.metadataMatch && b.metadataMatch) return 1;
    // Then by match count
    return b.matchCount - a.matchCount;
  });

  const searchScope = targetPage ? ` in "${targetPage}"` : "";
  const lines = [
    `# Search Results for "${query}"${searchScope}`,
    "",
    `Found ${results.reduce((sum, r) => sum + r.matchCount, 0)} match(es) across ${results.length} page(s):`,
    "",
  ];

  for (let i = 0; i < results.length; i++) {
    const { pageId, pageTitle, snippets, matchCount, metadataMatch } = results[i];
    const metadataNote = metadataMatch ? " ⭐" : "";
    lines.push(
      `## ${i + 1}. ${pageTitle} (\`${pageId}\`) - ${matchCount} match(es)${metadataNote}`
    );
    lines.push("");
    for (const snippet of snippets) {
      if (snippet.startsWith("**")) {
        // Metadata snippets
        lines.push(snippet);
      } else {
        // Content snippets
        lines.push(`> ${snippet}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(
    "⭐ = Page title or description matches your query directly."
  );
  lines.push(
    "Use `read_page` with the page ID to read the full content, or use `search_page` with a specific page to narrow your search."
  );

  return lines.join("\n");
}