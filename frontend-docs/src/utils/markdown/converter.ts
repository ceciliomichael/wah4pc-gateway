/**
 * Core HTML to Markdown conversion logic.
 * Converts HTML DOM elements to LLM-friendly Markdown format.
 */

import type { ConversionContext } from "./types";
import { createConversionContext } from "./types";
import { cleanupMarkdown } from "./utils";
import {
  processTable,
  handleHeading,
  handleParagraph,
  handleStrong,
  handleEmphasis,
  handleInlineCode,
  handleCodeBlock,
  handleLink,
  handleImage,
  handleUnorderedList,
  handleOrderedList,
  handleListItem,
  handleBlockquote,
  handleDefinitionTerm,
  handleDefinitionDescription,
  handleBlockElement,
  handleInlineElement,
} from "./handlers";

/**
 * Processes all child nodes of an element and concatenates their Markdown output.
 */
function processChildren(element: Element, context: ConversionContext): string {
  let result = "";
  for (const child of Array.from(element.childNodes)) {
    result += nodeToMarkdown(child, context);
  }
  return result;
}

/**
 * Converts a single DOM node to its Markdown representation.
 */
function nodeToMarkdown(node: Node, context: ConversionContext): string {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    // Preserve whitespace structure but normalize excessive spaces
    return text.replace(/\s+/g, " ");
  }

  // Handle element nodes only
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    // Headings
    case "h1":
      return handleHeading(element, 1);
    case "h2":
      return handleHeading(element, 2);
    case "h3":
      return handleHeading(element, 3);
    case "h4":
      return handleHeading(element, 4);
    case "h5":
      return handleHeading(element, 5);
    case "h6":
      return handleHeading(element, 6);

    // Paragraphs
    case "p":
      return handleParagraph(element, context, processChildren);

    // Line breaks
    case "br":
      return "\n";

    // Horizontal rule
    case "hr":
      return "\n---\n\n";

    // Bold/Strong
    case "strong":
    case "b":
      return handleStrong(element, context, processChildren);

    // Italic/Emphasis
    case "em":
    case "i":
      return handleEmphasis(element, context, processChildren);

    // Inline code
    case "code":
      return handleInlineCode(element);

    // Code blocks
    case "pre":
      return handleCodeBlock(element);

    // Links
    case "a":
      return handleLink(element, context, processChildren);

    // Images
    case "img":
      return handleImage(element);

    // Unordered lists
    case "ul":
      return handleUnorderedList(element, context, processChildren);

    // Ordered lists
    case "ol":
      return handleOrderedList(element, context, processChildren);

    // List items
    case "li":
      return handleListItem(element, context, processChildren);

    // Blockquotes
    case "blockquote":
      return handleBlockquote(element, context, processChildren);

    // Tables
    case "table":
      return processTable(element);

    // Definition lists
    case "dl":
      return `\n${processChildren(element, context)}\n`;
    case "dt":
      return handleDefinitionTerm(element);
    case "dd":
      return handleDefinitionDescription(element, context, processChildren);

    // Block-level structural elements - FIXED: Now properly preserves newlines
    case "div":
    case "section":
    case "article":
    case "main":
    case "aside":
    case "nav":
    case "header":
    case "footer":
    case "figure":
    case "figcaption":
      return handleBlockElement(element, context, processChildren);

    // Inline containers
    case "span":
    case "label":
      return handleInlineElement(element, context, processChildren);

    // Skip script, style, and hidden elements
    case "script":
    case "style":
    case "noscript":
    case "template":
      return "";

    // Skip buttons and interactive elements
    case "button":
    case "input":
    case "select":
    case "textarea":
      return "";

    // SVG and canvas - skip
    case "svg":
    case "canvas":
      return "";

    // Default: process children
    default:
      return processChildren(element, context);
  }
}

/**
 * Converts an HTML element and its children to Markdown format.
 * Optimized for LLM consumption - preserves structure and context.
 *
 * @param element - The HTML element to convert
 * @returns Markdown string representation
 */
export function htmlToMarkdown(element: Element): string {
  const context = createConversionContext();
  const rawMarkdown = nodeToMarkdown(element, context);
  return cleanupMarkdown(rawMarkdown);
}

/**
 * Extracts and formats the main content area for copying.
 * Converts HTML to clean Markdown without metadata headers.
 *
 * @param mainElement - The main content element
 * @param pageTitle - Optional page title (unused, kept for backward compatibility)
 * @returns Clean Markdown content
 */
export function formatPageForLLM(
  mainElement: Element,
  pageTitle?: string
): string {
  return htmlToMarkdown(mainElement);
}