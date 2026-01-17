/**
 * Resource Extractor Module
 * Parses FHIR resource data files and formats them for AI consumption
 */

import fs from "fs";
import path from "path";
import { PAGE_REGISTRY } from "./registry";

/** Field definition extracted from resource data */
interface ExtractedField {
  name: string;
  description: string;
  type: string;
  required: boolean;
  binding?: {
    strength: string;
    valueSet: string;
    displayName?: string;
  };
}

/**
 * Gets the path to the resources data directory
 */
function getResourcesDataDir(): string {
  return path.join(process.cwd(), "src", "app", "docs", "resources", "data");
}

/**
 * Reads and parses a specific resource file (e.g., patient.ts, medication.ts)
 * Extracts the resource definition and formats it as clean markdown
 *
 * @param slug - The resource slug (e.g., "patient", "medication")
 * @returns Formatted markdown content or null if not found
 */
export function extractResourceContent(slug: string): string | null {
  const resourcesDataDir = getResourcesDataDir();
  const resourceFilePath = path.join(resourcesDataDir, `${slug}.ts`);

  if (!fs.existsSync(resourceFilePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(resourceFilePath, "utf-8");
  return parseResourceFile(slug, fileContent);
}

/**
 * Parses a resource TypeScript file and extracts structured content
 *
 * @param slug - The resource slug
 * @param fileContent - Raw content of the resource .ts file
 * @returns Formatted markdown content
 */
function parseResourceFile(slug: string, fileContent: string): string | null {
  const lines: string[] = [];

  // Get page info from registry for header
  const pageInfo = PAGE_REGISTRY[`resources/${slug}`];
  if (pageInfo) {
    lines.push(`# ${pageInfo.title}`);
    lines.push("");
    lines.push(pageInfo.description);
    lines.push("");
  }

  // Extract title from file
  const titleMatch = fileContent.match(/title:\s*["']([^"']+)["']/);
  if (titleMatch && !pageInfo) {
    lines.push(`# ${titleMatch[1]}`);
    lines.push("");
  }

  // Extract description - handle multiline descriptions
  const descMatch = fileContent.match(/description:\s*["']([^"']+)["']/);
  if (descMatch && !pageInfo) {
    lines.push(descMatch[1].replace(/\\n/g, " ").trim());
    lines.push("");
  }

  // Extract profile URL
  const profileMatch = fileContent.match(/profileUrl:\s*["']([^"']+)["']/);
  if (profileMatch) {
    lines.push("## Profile URL");
    lines.push("");
    lines.push("**Required in `meta.profile`:**");
    lines.push(`\`${profileMatch[1]}\``);
    lines.push("");
  }

  // Extract fields
  const fields = extractFields(fileContent);

  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  if (requiredFields.length > 0) {
    lines.push("## Required Fields");
    lines.push("");
    for (const field of requiredFields) {
      lines.push(`- **\`${field.name}\`** (${field.type}): ${field.description}`);
      if (field.binding) {
        lines.push(`  - Binding: ${field.binding.strength} to \`${field.binding.valueSet}\``);
      }
    }
    lines.push("");
  }

  if (optionalFields.length > 0) {
    lines.push("## Optional Fields");
    lines.push("");
    for (const field of optionalFields) {
      lines.push(`- **\`${field.name}\`** (${field.type}): ${field.description}`);
      if (field.binding) {
        lines.push(`  - Binding: ${field.binding.strength} to \`${field.binding.valueSet}\``);
      }
    }
    lines.push("");
  }

  // Extract JSON template
  const templateMatch = fileContent.match(/jsonTemplate:\s*`([\s\S]*?)`/);
  if (templateMatch) {
    lines.push("## JSON Template");
    lines.push("");
    lines.push("Use this as a starting point for creating valid resources:");
    lines.push("");
    lines.push("```json");
    lines.push(templateMatch[1].trim());
    lines.push("```");
    lines.push("");
  }

  // Add validation note
  lines.push("## Validation");
  lines.push("");
  lines.push(
    "This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity)."
  );

  if (lines.length <= 5) {
    return null;
  }

  return lines.join("\n");
}

/**
 * Extracts field definitions from the resource file content
 */
function extractFields(fileContent: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Match the fields array content
  const fieldsArrayMatch = fileContent.match(/fields:\s*\[([\s\S]*?)\],\s*jsonTemplate:/);
  if (!fieldsArrayMatch) {
    return fields;
  }

  const fieldsContent = fieldsArrayMatch[1];

  // Match individual field objects - be careful with nested objects
  const fieldPattern = /\{\s*name:\s*["']([^"']+)["'][^}]*?type:\s*["']([^"']+)["'][^}]*?description:\s*["']([^"']+)["'][^}]*?required:\s*(true|false)/g;

  let match: RegExpExecArray | null;
  while ((match = fieldPattern.exec(fieldsContent)) !== null) {
    const [fullMatch, name, type, description, required] = match;

    const field: ExtractedField = {
      name,
      type,
      description,
      required: required === "true",
    };

    // Check for binding in this field's scope
    const bindingMatch = fullMatch.match(
      /binding:\s*\{[^}]*strength:\s*["']([^"']+)["'][^}]*valueSet:\s*["']([^"']+)["']/
    );
    if (bindingMatch) {
      field.binding = {
        strength: bindingMatch[1],
        valueSet: bindingMatch[2],
      };
    }

    fields.push(field);
  }

  return fields;
}

/**
 * Reads the full content of a resource file for searching
 * Returns the raw file content for text matching
 *
 * @param slug - The resource slug
 * @returns Raw file content or null
 */
export function readResourceFileContent(slug: string): string | null {
  const resourcesDataDir = getResourcesDataDir();
  const resourceFilePath = path.join(resourcesDataDir, `${slug}.ts`);

  if (!fs.existsSync(resourceFilePath)) {
    return null;
  }

  return fs.readFileSync(resourceFilePath, "utf-8");
}

/**
 * Gets a list of all available resource slugs by reading the data directory
 */
export function getAvailableResourceSlugs(): string[] {
  const resourcesDataDir = getResourcesDataDir();

  if (!fs.existsSync(resourcesDataDir)) {
    return [];
  }

  const files = fs.readdirSync(resourcesDataDir);
  return files
    .filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "types.ts")
    .map((f) => f.replace(".ts", ""));
}