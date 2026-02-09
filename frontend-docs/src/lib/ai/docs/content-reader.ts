/**
 * Content Reader Module
 * Handles reading and parsing documentation page content from files
 */

import fs from "fs";
import path from "path";
import { parsePageContent } from "../docs-parser";
import { PAGE_REGISTRY, SECTION_REGISTRY } from "./registry";
import { extractResourceContent, readResourceFileContent } from "./resource-extractor";
import { resolveDocsPath, resolveDocsDir, resolveResourcesDataDir } from "./utils";

/**
 * Reads the actual content of a documentation page
 * Returns clean text content, not raw code.
 * If no section is specified, reads the first section.
 *
 * @param pageId - The page identifier (e.g., "architecture", "flow", "resources/patient")
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

  // Handle resources/[slug] pages (e.g., "resources/patient", "resources/medication")
  if (normalizedPageId.startsWith("resources/")) {
    const slug = normalizedPageId.replace("resources/", "");
    const resourceContent = extractResourceContent(slug);
    if (resourceContent) {
      return resourceContent;
    }
    // If extraction failed, return null - no fallback needed
    return null;
  }

  // Handle the main resources overview page
  if (normalizedPageId === "resources") {
    return readResourcesOverviewPage();
  }

  // Standard page handling for non-resource pages
  return readStandardPage(normalizedPageId, sectionId, sections);
}

/**
 * Reads a standard documentation page (non-resource)
 */
function readStandardPage(
  normalizedPageId: string,
  sectionId?: string,
  sections?: Array<{ id: string; name: string; description: string }>
): string | null {
  // Use robust path resolution
  const pageTsxPath = resolveDocsPath(normalizedPageId, "page.tsx");
  if (!pageTsxPath) {
    return null;
  }

  const pageContent = fs.readFileSync(pageTsxPath, "utf-8");

  // Read data.ts if it exists
  let dataContent: string | null = null;
  const dataTsPath = resolveDocsPath(normalizedPageId, "data.ts");
  if (dataTsPath) {
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

/**
 * Reads the resources overview page content
 */
function readResourcesOverviewPage(): string | null {
  // Use robust path resolution - directory is named "resources-data"
  const indexPath = resolveDocsPath("resources", "resources-data", "index.ts");

  if (!indexPath) {
    return null;
  }

  const indexContent = fs.readFileSync(indexPath, "utf-8");

  const lines: string[] = [
    "# FHIR Resources",
    "",
    "The WAH4PC Gateway supports 24 FHIR resource types, categorized into Philippine Core (PH Core) and Base R4 (Financial/Administrative & Clinical).",
    "",
    "## Supported Resources",
    "",
  ];

  // Dynamically extract all resource pages from the registry
  const resourcePages = Object.values(PAGE_REGISTRY).filter(
    (page) => page.id.startsWith("resources/") && page.id !== "resources"
  );

  // Group by category based on title prefix or known IDs
  const phCore = resourcePages.filter(p => p.title.startsWith("PH Core"));
  const others = resourcePages.filter(p => !p.title.startsWith("PH Core"));

  if (phCore.length > 0) {
    lines.push("### PH Core Resources");
    for (const page of phCore) {
      lines.push(`- **${page.title}** (\`${page.id}\`) - ${page.description}`);
    }
    lines.push("");
  }

  if (others.length > 0) {
    lines.push("### Base R4 Resources");
    for (const page of others) {
      lines.push(`- **${page.title}** (\`${page.id}\`) - ${page.description}`);
    }
  }

  lines.push("");

  // Extract code systems
  const codeSystemsMatch = indexContent.match(/commonCodeSystems:\s*CodeSystem\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (codeSystemsMatch) {
    lines.push("## Common Code Systems");
    lines.push("");

    const systemPattern = /name:\s*["']([^"']+)["'][^}]*url:\s*["']([^"']+)["'][^}]*description:\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = systemPattern.exec(codeSystemsMatch[1])) !== null) {
      lines.push(`- **${match[1]}** (\`${match[2]}\`): ${match[3]}`);
    }
  }

  return lines.join("\n");
}

/**
 * Reads the FULL content of a documentation page including ALL sections and data files.
 * This returns CLEAN TEXT (Markdown), not raw code.
 *
 * @param pageId - The page identifier
 * @returns Complete page content including all sections and data file content
 */
export function readFullPageContent(pageId: string): string | null {
  const normalizedPageId = pageId.toLowerCase().trim();
  const pageInfo = PAGE_REGISTRY[normalizedPageId];

  if (!pageInfo) {
    return null;
  }

  // 1. Resources Sub-pages (already returns Markdown)
  if (normalizedPageId.startsWith("resources/")) {
    const slug = normalizedPageId.replace("resources/", "");
    return extractResourceContent(slug);
  }

  // 2. Resources Overview (already returns Markdown)
  if (normalizedPageId === "resources") {
    return readResourcesOverviewPage();
  }

  // 3. Standard Pages (Architecture, Flow, API, etc.)
  const pageTsxPath = resolveDocsPath(normalizedPageId, "page.tsx");
  if (!pageTsxPath) {
    return null;
  }

  const pageContent = fs.readFileSync(pageTsxPath, "utf-8");

  // Read data.ts if it exists
  let dataContent: string | null = null;
  const dataTsPath = resolveDocsPath(normalizedPageId, "data.ts");
  if (dataTsPath) {
    dataContent = fs.readFileSync(dataTsPath, "utf-8");
  }

  // Parse the main page content (JSX -> Markdown)
  // Passing undefined for sectionId to extract full content
  let content = parsePageContent(pageContent, dataContent, undefined, true);

  // 4. API Page Special Handling
  // Extract endpoint information from the endpoints directory to append to the docs
  if (normalizedPageId === "api") {
    const endpointsDir = resolveDocsPath(normalizedPageId, "endpoints");
    if (endpointsDir && fs.existsSync(endpointsDir)) {
      const endpointFiles = fs.readdirSync(endpointsDir);
      const endpointTexts: string[] = [];

      for (const file of endpointFiles) {
        if (file.endsWith(".ts")) {
          const filePath = path.join(endpointsDir, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");
          
          // Simple extraction of endpoint definitions to avoid raw code
          // Look for: { method: "...", path: "...", description: "..." }
          const objectRegex = /\{\s*method:\s*["']([^"']+)["'][\s\S]*?path:\s*["']([^"']+)["'][\s\S]*?description:\s*["']([^"']+)["']/g;
          
          let match: RegExpExecArray | null;
          while ((match = objectRegex.exec(fileContent)) !== null) {
            const [, method, path, description] = match;
            endpointTexts.push(`### ${method} ${path}\n\n${description.replace(/\\n/g, " ")}`);
          }
        }
      }

      if (endpointTexts.length > 0) {
        content += "\n\n## Endpoints\n\n" + endpointTexts.join("\n\n");
      }
    }
  }

  if (!content || content.trim().length === 0) {
    return null;
  }

  return content;
}

/**
 * Extracts a readable snippet from content around a match.
 * Cleans up code artifacts and formats nicely.
 */
export function extractSnippet(
  content: string,
  matchIndex: number,
  queryLength: number
): string {
  const snippetRadius = 100;
  const snippetStart = Math.max(0, matchIndex - snippetRadius);
  const snippetEnd = Math.min(content.length, matchIndex + queryLength + snippetRadius);

  let snippet = content.slice(snippetStart, snippetEnd).trim();

  // Clean up: remove code artifacts, normalize whitespace
  snippet = snippet
    .replace(/[{}[\]`;]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Add ellipsis if truncated
  if (snippetStart > 0) snippet = "..." + snippet;
  if (snippetEnd < content.length) snippet = snippet + "...";

  return snippet;
}