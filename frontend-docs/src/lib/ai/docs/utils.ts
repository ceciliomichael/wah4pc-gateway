/**
 * Utility functions for the Documentation AI Tools
 */

import fs from "fs";
import path from "path";

/**
 * Possible root paths to check when resolving documentation paths.
 * This handles different execution contexts:
 * - Standard Next.js app root (process.cwd() is the app directory)
 * - Monorepo root (process.cwd() is the parent workspace)
 * - Docker/container environments
 */
const ROOT_CANDIDATES = [
  "", // process.cwd() is the app root (e.g., frontend-docs/)
  "frontend-docs", // process.cwd() is the monorepo root
];

/**
 * Resolves a documentation path by trying multiple root candidates.
 * This ensures the code works regardless of where process.cwd() points to.
 *
 * @param segments - Path segments relative to src/app/docs (e.g., ["resources", "data", "index.ts"])
 * @returns The full resolved path if found, or null if not found
 *
 * @example
 * resolveDocsPath(["resources", "data", "index.ts"])
 * // Returns: "/path/to/frontend-docs/src/app/docs/resources/resources-data/index.ts"
 */
export function resolveDocsPath(...segments: string[]): string | null {
  const cwd = process.cwd();

  for (const rootCandidate of ROOT_CANDIDATES) {
    const fullPath = path.join(cwd, rootCandidate, "src", "app", "docs", ...segments);

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Resolves the base docs directory path.
 * 
 * @returns The full path to src/app/docs if found, or null
 */
export function resolveDocsDir(): string | null {
  const cwd = process.cwd();

  for (const rootCandidate of ROOT_CANDIDATES) {
    const docsDir = path.join(cwd, rootCandidate, "src", "app", "docs");

    if (fs.existsSync(docsDir)) {
      return docsDir;
    }
  }

  return null;
}

/**
 * Resolves the resources data directory path.
 * Note: The directory is named "resources-data" not "data"
 * 
 * @returns The full path to src/app/docs/resources/resources-data if found, or null
 */
export function resolveResourcesDataDir(): string | null {
  return resolveDocsPath("resources", "resources-data");
}