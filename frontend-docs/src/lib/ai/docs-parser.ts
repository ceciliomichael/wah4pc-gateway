/**
 * Documentation Parser
 * Converts React/JSX documentation pages to clean, readable text for AI consumption.
 * Handles section extraction, data resolution, and JSX-to-text conversion.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Map of exported constant names to their string values */
export type DataMap = Record<string, string>;

/** Result of parsing a page section */
export interface ParsedSection {
  title?: string;
  description?: string;
  content: string;
}

// ============================================================================
// DATA FILE PARSING
// ============================================================================

/**
 * Extracts exported constants from a data.ts file.
 * Focuses on string constants (especially backtick template literals for diagrams).
 * 
 * @param dataContent - Raw content of a data.ts file
 * @returns Map of variable names to their string values
 */
export function extractDataConstants(dataContent: string): DataMap {
  const dataMap: DataMap = {};

  // Pattern 1: Backtick template literals (diagrams)
  // export const varName = `...`;
  const backtickPattern = /export\s+const\s+(\w+)\s*=\s*`([\s\S]*?)`;/g;
  let match: RegExpExecArray | null;

  while ((match = backtickPattern.exec(dataContent)) !== null) {
    const [, varName, value] = match;
    dataMap[varName] = value.trim();
  }

  // Pattern 2: Simple string literals
  // export const varName = "..." or '...'
  const stringPattern = /export\s+const\s+(\w+)\s*=\s*["']([^"']+)["'];/g;
  while ((match = stringPattern.exec(dataContent)) !== null) {
    const [, varName, value] = match;
    if (!dataMap[varName]) {
      dataMap[varName] = value;
    }
  }

  // Pattern 3: Array of strings (like keyPoints)
  // export const varName = ["...", "..."] as const;
  const arrayPattern = /export\s+const\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*as\s+const)?;/g;
  while ((match = arrayPattern.exec(dataContent)) !== null) {
    const [, varName, arrayContent] = match;
    // Extract string items from the array
    const items: string[] = [];
    const itemPattern = /["'`]([^"'`]+)["'`]/g;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemPattern.exec(arrayContent)) !== null) {
      items.push(itemMatch[1]);
    }
    if (items.length > 0) {
      dataMap[varName] = items.map((item) => `• ${item}`).join("\n");
    }
  }

  // Pattern 4: Object with code property (like dataModels)
  // Look for objects that have a "code" field with backticks
  const objectCodePattern = /(\w+):\s*\{[^}]*code:\s*`([\s\S]*?)`[^}]*\}/g;
  while ((match = objectCodePattern.exec(dataContent)) !== null) {
    const [, objKey, codeValue] = match;
    dataMap[`${objKey}_code`] = codeValue.trim();
  }

  // Pattern 5: Objects with title and code (for data models)
  const dataModelPattern = /(\w+):\s*\{\s*title:\s*["']([^"']+)["'][^}]*code:\s*`([\s\S]*?)`/g;
  while ((match = dataModelPattern.exec(dataContent)) !== null) {
    const [, key, title, code] = match;
    dataMap[`${key}_title`] = title;
    dataMap[`${key}_code`] = code.trim();
  }

  // Pattern 6: Transaction states data (array of objects)
  const statesDataPattern = /export\s+const\s+(\w+):\s*\w+\[\]\s*=\s*\[([\s\S]*?)\];/g;
  while ((match = statesDataPattern.exec(dataContent)) !== null) {
    const [, varName, arrayContent] = match;
    // Extract status and description from each object
    const rows: string[] = [];
    const rowPattern = /status:\s*["'](\w+)["'][^}]*description:\s*["']([^"']+)["']/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowPattern.exec(arrayContent)) !== null) {
      rows.push(`• ${rowMatch[1]}: ${rowMatch[2]}`);
    }
    if (rows.length > 0) {
      dataMap[varName] = rows.join("\n");
    }
  }

  return dataMap;
}

// ============================================================================
// JSX SECTION EXTRACTION
// ============================================================================

/**
 * Extracts a specific section from a page.tsx file by its id attribute.
 * If no sectionId is provided, extracts the first section or the full article content.
 * 
 * @param pageContent - Raw content of a page.tsx file
 * @param sectionId - Optional section ID to target (e.g., "components", "transaction-flow")
 * @returns The JSX content of the section, or null if not found
 */
export function extractJsxSection(pageContent: string, sectionId?: string): string | null {
  // If a specific section is requested, try to find it by id
  if (sectionId) {
    // Match <section id="sectionId" ...>...</section>
    // This regex handles nested tags by being greedy but stopping at matching </section>
    const sectionPattern = new RegExp(
      `<section[^>]*id=["']${escapeRegExp(sectionId)}["'][^>]*>([\\s\\S]*?)</section>`,
      "i"
    );
    const match = pageContent.match(sectionPattern);
    if (match) {
      return match[0]; // Return the full section including tags
    }

    // Try without quotes (JSX shorthand)
    const sectionPatternAlt = new RegExp(
      `<section[^>]*id=\\{["']${escapeRegExp(sectionId)}["']\\}[^>]*>([\\s\\S]*?)</section>`,
      "i"
    );
    const matchAlt = pageContent.match(sectionPatternAlt);
    if (matchAlt) {
      return matchAlt[0];
    }

    return null;
  }

  // No section specified - try to get the first section
  const firstSectionMatch = pageContent.match(/<section[^>]*>([\s\S]*?)<\/section>/);
  if (firstSectionMatch) {
    return firstSectionMatch[0];
  }

  // No sections found - extract content inside the main return statement
  const returnMatch = pageContent.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*\}/);
  if (returnMatch) {
    return returnMatch[1];
  }

  return null;
}

/**
 * Extracts the DocsHeader information from a page.
 * 
 * @param pageContent - Raw content of a page.tsx file
 * @returns Object with title and description, or null
 */
export function extractDocsHeader(pageContent: string): { title: string; description: string } | null {
  // Match DocsHeader component with its props
  const headerPattern = /<DocsHeader[\s\S]*?title=["']([^"']+)["'][\s\S]*?description=["']([^"']+)["'][\s\S]*?\/>/;
  const match = pageContent.match(headerPattern);
  
  if (match) {
    return {
      title: match[1],
      description: match[2],
    };
  }

  // Try alternate prop order
  const headerPatternAlt = /<DocsHeader[\s\S]*?description=["']([^"']+)["'][\s\S]*?title=["']([^"']+)["'][\s\S]*?\/>/;
  const matchAlt = pageContent.match(headerPatternAlt);
  
  if (matchAlt) {
    return {
      title: matchAlt[2],
      description: matchAlt[1],
    };
  }

  return null;
}

// ============================================================================
// JSX TO TEXT CONVERSION
// ============================================================================

/**
 * Converts JSX content to clean, readable text.
 * Resolves variable references using the provided data map.
 * 
 * @param jsxContent - Raw JSX content from a section
 * @param dataMap - Map of variable names to their values
 * @returns Clean text representation
 */
export function cleanJsxToText(jsxContent: string, dataMap: DataMap = {}): string {
  let text = jsxContent;

  // Step 1: Handle special components first (before stripping tags)
  
  // DiagramContainer: Extract title and resolve chart variable
  text = text.replace(
    /<DiagramContainer[\s\S]*?chart=\{(\w+)\}[\s\S]*?title=["']([^"']+)["'][\s\S]*?\/>/g,
    (_, varName, title) => {
      const diagramContent = dataMap[varName];
      if (diagramContent) {
        return `\n\n### ${title}\n\`\`\`mermaid\n${diagramContent}\n\`\`\`\n`;
      }
      return `\n\n### ${title}\n[Diagram]\n`;
    }
  );

  // MermaidDiagram: Similar handling
  text = text.replace(
    /<MermaidDiagram[\s\S]*?chart=\{(\w+)\}[\s\S]*?\/>/g,
    (_, varName) => {
      const diagramContent = dataMap[varName];
      if (diagramContent) {
        return `\n\`\`\`mermaid\n${diagramContent}\n\`\`\`\n`;
      }
      return "\n[Diagram]\n";
    }
  );

  // JsonViewer: Extract title and data
  text = text.replace(
    /<JsonViewer[\s\S]*?data=\{([^}]+)\}[\s\S]*?title=["']([^"']+)["'][\s\S]*?\/>/g,
    (_, dataExpr, title) => {
      // Try to resolve the data expression
      const cleanExpr = dataExpr.trim();
      // Check for nested property access like dataModels.provider.code
      const parts = cleanExpr.split(".");
      if (parts.length >= 2) {
        const key = `${parts[parts.length - 2]}_code`;
        if (dataMap[key]) {
          return `\n\n**${title}**\n\`\`\`json\n${dataMap[key]}\n\`\`\`\n`;
        }
      }
      return `\n\n**${title}**\n`;
    }
  );

  // AlertBlock: Convert to callout
  text = text.replace(
    /<AlertBlock[\s\S]*?title=["']([^"']+)["'][\s\S]*?>([\s\S]*?)<\/AlertBlock>/g,
    (_, title, content) => {
      return `\n\n> **${title}**\n${cleanJsxToText(content, dataMap)}\n`;
    }
  );

  // DataTable: Just note that there's a table
  text = text.replace(
    /<DataTable[\s\S]*?data=\{(\w+)\}[\s\S]*?\/>/g,
    (_, varName) => {
      const tableData = dataMap[varName];
      if (tableData) {
        return `\n\n${tableData}\n`;
      }
      return "\n[Data Table]\n";
    }
  );

  // FeatureCard: Extract title and description
  text = text.replace(
    /<FeatureCard[\s\S]*?title=["']([^"']+)["'][\s\S]*?description=["']([^"']+)["'][\s\S]*?\/>/g,
    (_, title, description) => `\n• **${title}**: ${description}\n`
  );

  // Step 2: Handle standard HTML-like elements
  
  // Headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Paragraphs
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");

  // Lists
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, "$1");
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, "$1");
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "• $1\n");

  // Strong/Bold
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");

  // Emphasis/Italic
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Code
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // Links
  text = text.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Step 3: Handle JSX expressions with arrays (like map functions)
  
  // {items.map((item) => (...))} - often contains the actual content we want
  // We'll extract the content being rendered
  text = text.replace(
    /\{[\w.]+\.map\([^)]*\)\s*=>\s*\(\s*([\s\S]*?)\s*\)\s*\)\}/g,
    (_, content) => cleanJsxToText(content, dataMap)
  );

  // {variable} references - try to resolve from dataMap
  text = text.replace(/\{(\w+)\}/g, (match, varName) => {
    return dataMap[varName] || "";
  });

  // Step 4: Strip remaining JSX/HTML tags
  
  // Self-closing tags (icons, etc.)
  text = text.replace(/<\w+[^>]*\/>/g, "");
  
  // Opening and closing container tags (div, section, article, span, etc.)
  text = text.replace(/<\/?\w+[^>]*>/g, "");

  // Step 5: Clean up JSX artifacts
  
  // Remove className attributes that might be leftover
  text = text.replace(/className=["'][^"']*["']/g, "");
  text = text.replace(/className=\{[^}]*\}/g, "");
  
  // Remove other common JSX attributes
  text = text.replace(/\w+=\{[^}]*\}/g, "");
  text = text.replace(/\w+=["'][^"']*["']/g, "");

  // Remove JSX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Step 6: Clean up whitespace
  
  // Normalize line breaks
  text = text.replace(/\n{3,}/g, "\n\n");
  
  // Trim lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, array) => {
      // Remove consecutive empty lines during split
      if (line === "" && array[index - 1] === "") {
        return false;
      }
      return true;
    })
    .join("\n");
  
  // Remove empty bullet points
  text = text.replace(/•\s*\n/g, "");

  // Final cleanup of multiple newlines one last time
  text = text.replace(/\n{3,}/g, "\n\n");
  
  // Final trim
  text = text.trim();

  return text;
}

// ============================================================================
// HIGH-LEVEL PARSING FUNCTIONS
// ============================================================================

/**
 * Parses a documentation page and returns clean text content.
 * This is the main entry point for the AI tools.
 * 
 * @param pageContent - Raw content of page.tsx
 * @param dataContent - Raw content of data.ts (optional)
 * @param sectionId - Optional section ID to target
 * @param includeHeader - Whether to include the page header
 * @returns Clean text content
 */
export function parsePageContent(
  pageContent: string,
  dataContent: string | null,
  sectionId?: string,
  includeHeader: boolean = true
): string {
  // Extract data constants for variable resolution
  const dataMap = dataContent ? extractDataConstants(dataContent) : {};

  // Build the output
  const parts: string[] = [];

  // Include header if requested and no specific section
  if (includeHeader && !sectionId) {
    const header = extractDocsHeader(pageContent);
    if (header) {
      parts.push(`# ${header.title}\n\n${header.description}`);
    }
  }

  // Extract the target section
  const sectionJsx = extractJsxSection(pageContent, sectionId);
  if (sectionJsx) {
    const sectionText = cleanJsxToText(sectionJsx, dataMap);
    if (sectionText) {
      parts.push(sectionText);
    }
  }

  return parts.join("\n\n");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}