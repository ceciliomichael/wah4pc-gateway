/**
 * Element handlers for HTML to Markdown conversion.
 * Each handler processes a specific HTML element type.
 */

import type { ConversionContext } from "./types";
import { getTextContent } from "./utils";

type NodeProcessor = (node: Node, context: ConversionContext) => string;
type ChildrenProcessor = (element: Element, context: ConversionContext) => string;

/**
 * Processes an HTML table element into Markdown table format.
 */
export function processTable(table: Element): string {
  const rows = table.querySelectorAll("tr");
  if (rows.length === 0) return "";

  const result: string[] = [];
  let headerProcessed = false;

  for (const row of Array.from(rows)) {
    const cells = row.querySelectorAll("th, td");
    const cellContents = Array.from(cells).map((cell) =>
      getTextContent(cell).replace(/\|/g, "\\|")
    );

    if (cellContents.length === 0) continue;

    result.push(`| ${cellContents.join(" | ")} |`);

    // Add separator after header row
    if (!headerProcessed && row.querySelector("th")) {
      const separator = cellContents.map(() => "---");
      result.push(`| ${separator.join(" | ")} |`);
      headerProcessed = true;
    } else if (!headerProcessed && result.length === 1) {
      // If no th elements, treat first row as header
      const separator = cellContents.map(() => "---");
      result.push(`| ${separator.join(" | ")} |`);
      headerProcessed = true;
    }
  }

  return `\n${result.join("\n")}\n\n`;
}

/**
 * Handles heading elements (h1-h6).
 */
export function handleHeading(
  element: Element,
  level: number
): string {
  const prefix = "#".repeat(level);
  return `\n${prefix} ${getTextContent(element)}\n\n`;
}

/**
 * Handles paragraph elements.
 */
export function handleParagraph(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  return `\n${processChildren(element, context).trim()}\n\n`;
}

/**
 * Handles bold/strong elements.
 */
export function handleStrong(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  return `**${processChildren(element, context).trim()}**`;
}

/**
 * Handles italic/emphasis elements.
 */
export function handleEmphasis(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  return `*${processChildren(element, context).trim()}*`;
}

/**
 * Handles inline code elements.
 */
export function handleInlineCode(element: Element): string {
  const parent = element.parentElement;
  // If inside pre, it's a code block - handle at pre level
  if (parent?.tagName.toLowerCase() === "pre") {
    return element.textContent || "";
  }
  return `\`${element.textContent || ""}\``;
}

/**
 * Handles code block (pre) elements.
 */
export function handleCodeBlock(element: Element): string {
  const codeElement = element.querySelector("code");
  const code = codeElement?.textContent || element.textContent || "";
  // Try to detect language from class
  const langClass = codeElement?.className.match(/language-(\w+)/);
  const lang = langClass ? langClass[1] : "";
  return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
}

/**
 * Handles link elements.
 */
export function handleLink(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const href = element.getAttribute("href") || "";
  const text = processChildren(element, context).trim();
  if (href && text) {
    return `[${text}](${href})`;
  }
  return text;
}

/**
 * Handles image elements.
 */
export function handleImage(element: Element): string {
  const src = element.getAttribute("src") || "";
  const alt = element.getAttribute("alt") || "image";
  return `![${alt}](${src})`;
}

/**
 * Handles unordered list elements.
 */
export function handleUnorderedList(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const newContext = {
    ...context,
    listDepth: context.listDepth + 1,
  };
  return `\n${processChildren(element, newContext)}\n`;
}

/**
 * Handles ordered list elements.
 */
export function handleOrderedList(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const newContext = {
    ...context,
    listDepth: context.listDepth + 1,
    orderedListCounters: [...context.orderedListCounters, 0],
  };
  return `\n${processChildren(element, newContext)}\n`;
}

/**
 * Handles list item elements.
 */
export function handleListItem(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const indent = "  ".repeat(Math.max(0, context.listDepth - 1));
  const parent = element.parentElement;
  const isOrdered = parent?.tagName.toLowerCase() === "ol";

  let prefix = "- ";
  if (isOrdered) {
    // Find position in parent
    const siblings = Array.from(parent?.children || []);
    const index = siblings.indexOf(element) + 1;
    prefix = `${index}. `;
  }

  const content = processChildren(element, context).trim();
  return `${indent}${prefix}${content}\n`;
}

/**
 * Handles blockquote elements.
 */
export function handleBlockquote(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const content = processChildren(element, context).trim();
  const lines = content.split("\n").map((line) => `> ${line}`);
  return `\n${lines.join("\n")}\n\n`;
}

/**
 * Handles definition list elements (dl, dt, dd).
 */
export function handleDefinitionTerm(element: Element): string {
  return `\n**${getTextContent(element)}**\n`;
}

export function handleDefinitionDescription(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  return `: ${processChildren(element, context).trim()}\n`;
}

/**
 * Handles block-level structural elements (div, section, article, etc.).
 * CRITICAL FIX: These elements now properly preserve newlines to prevent
 * multi-line content from being squashed into a single line.
 */
export function handleBlockElement(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  const content = processChildren(element, context);
  // Only add newlines if there is actual content to avoid empty gaps
  if (content.trim()) {
    return `\n${content}\n`;
  }
  return "";
}

/**
 * Handles inline container elements (span, label).
 * These don't add any formatting, just process children.
 */
export function handleInlineElement(
  element: Element,
  context: ConversionContext,
  processChildren: ChildrenProcessor
): string {
  return processChildren(element, context);
}