/**
 * Utility functions for HTML to Markdown conversion.
 */

/**
 * Escapes special Markdown characters in regular text.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, "\\$1");
}

/**
 * Extracts and trims text content from a DOM node.
 */
export function getTextContent(node: Node): string {
  return node.textContent?.trim() || "";
}

/**
 * Cleans up generated Markdown by normalizing whitespace.
 * - Collapses 3+ consecutive newlines to 2
 * - Trims trailing whitespace from lines
 * - Trims overall content
 */
export function cleanupMarkdown(markdown: string): string {
  return (
    markdown
      // Remove excessive blank lines (more than 2)
      .replace(/\n{3,}/g, "\n\n")
      // Trim leading/trailing whitespace from lines
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      // Trim overall
      .trim()
  );
}