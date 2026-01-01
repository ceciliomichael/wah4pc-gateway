/**
 * Converts HTML DOM elements to LLM-friendly Markdown format.
 * Preserves structure, code blocks, tables, and semantic meaning.
 */

interface ConversionContext {
  listDepth: number;
  orderedListCounters: number[];
}

function escapeMarkdown(text: string): string {
  // Escape special markdown characters in regular text
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, "\\$1");
}

function getTextContent(node: Node): string {
  return node.textContent?.trim() || "";
}

function processChildren(element: Element, context: ConversionContext): string {
  let result = "";
  for (const child of Array.from(element.childNodes)) {
    result += nodeToMarkdown(child, context);
  }
  return result;
}

function nodeToMarkdown(node: Node, context: ConversionContext): string {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    // Preserve whitespace structure but normalize excessive spaces
    return text.replace(/\s+/g, " ");
  }

  // Handle element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    // Headings
    case "h1":
      return `\n# ${getTextContent(element)}\n\n`;
    case "h2":
      return `\n## ${getTextContent(element)}\n\n`;
    case "h3":
      return `\n### ${getTextContent(element)}\n\n`;
    case "h4":
      return `\n#### ${getTextContent(element)}\n\n`;
    case "h5":
      return `\n##### ${getTextContent(element)}\n\n`;
    case "h6":
      return `\n###### ${getTextContent(element)}\n\n`;

    // Paragraphs
    case "p":
      return `\n${processChildren(element, context).trim()}\n\n`;

    // Line breaks
    case "br":
      return "\n";

    // Horizontal rule
    case "hr":
      return "\n---\n\n";

    // Bold/Strong
    case "strong":
    case "b":
      return `**${processChildren(element, context).trim()}**`;

    // Italic/Emphasis
    case "em":
    case "i":
      return `*${processChildren(element, context).trim()}*`;

    // Inline code
    case "code": {
      const parent = element.parentElement;
      // If inside pre, it's a code block - handle at pre level
      if (parent?.tagName.toLowerCase() === "pre") {
        return element.textContent || "";
      }
      return `\`${element.textContent || ""}\``;
    }

    // Code blocks
    case "pre": {
      const codeElement = element.querySelector("code");
      const code = codeElement?.textContent || element.textContent || "";
      // Try to detect language from class
      const langClass = codeElement?.className.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : "";
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    }

    // Links
    case "a": {
      const href = element.getAttribute("href") || "";
      const text = processChildren(element, context).trim();
      if (href && text) {
        return `[${text}](${href})`;
      }
      return text;
    }

    // Images
    case "img": {
      const src = element.getAttribute("src") || "";
      const alt = element.getAttribute("alt") || "image";
      return `![${alt}](${src})`;
    }

    // Unordered lists
    case "ul": {
      const newContext = {
        ...context,
        listDepth: context.listDepth + 1,
      };
      return `\n${processChildren(element, newContext)}\n`;
    }

    // Ordered lists
    case "ol": {
      const newContext = {
        ...context,
        listDepth: context.listDepth + 1,
        orderedListCounters: [...context.orderedListCounters, 0],
      };
      return `\n${processChildren(element, newContext)}\n`;
    }

    // List items
    case "li": {
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

    // Blockquotes
    case "blockquote": {
      const content = processChildren(element, context).trim();
      const lines = content.split("\n").map((line) => `> ${line}`);
      return `\n${lines.join("\n")}\n\n`;
    }

    // Tables
    case "table": {
      return processTable(element);
    }

    // Definition lists
    case "dl": {
      return `\n${processChildren(element, context)}\n`;
    }
    case "dt": {
      return `\n**${getTextContent(element)}**\n`;
    }
    case "dd": {
      return `: ${processChildren(element, context).trim()}\n`;
    }

    // Divs, sections, articles - structural elements
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
      return processChildren(element, context);

    // Spans - inline container
    case "span":
    case "label":
      return processChildren(element, context);

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

function processTable(table: Element): string {
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

function cleanupMarkdown(markdown: string): string {
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

/**
 * Converts an HTML element and its children to Markdown format.
 * Optimized for LLM consumption - preserves structure and context.
 *
 * @param element - The HTML element to convert
 * @returns Markdown string representation
 */
export function htmlToMarkdown(element: Element): string {
  const context: ConversionContext = {
    listDepth: 0,
    orderedListCounters: [],
  };

  const rawMarkdown = nodeToMarkdown(element, context);
  return cleanupMarkdown(rawMarkdown);
}

/**
 * Extracts and formats the main content area for copying.
 * Adds a header with page title and URL for context.
 *
 * @param mainElement - The main content element
 * @param pageTitle - Optional page title to include
 * @returns Formatted Markdown with metadata header
 */
export function formatPageForLLM(
  mainElement: Element,
  pageTitle?: string
): string {
  const title = pageTitle || document.title || "Documentation";
  const url = typeof window !== "undefined" ? window.location.href : "";
  const timestamp = new Date().toISOString().split("T")[0];

  const contentMarkdown = htmlToMarkdown(mainElement);

  const header = [
    `# ${title}`,
    "",
    `> **Source:** ${url}`,
    `> **Copied:** ${timestamp}`,
    "",
    "---",
    "",
  ].join("\n");

  return header + contentMarkdown;
}