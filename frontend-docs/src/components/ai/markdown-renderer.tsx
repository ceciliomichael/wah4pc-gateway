"use client";

import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileCode, ExternalLink, Square, CheckSquare } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Memoized code block with copy functionality
const CodeBlock = memo(function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline code
  if (inline) {
    return (
      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-pink-600 border border-slate-200">
        {children}
      </code>
    );
  }

  // Block code
  return (
    <div className="group relative my-3 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className={`font-mono text-slate-800 ${className || ""}`}>
          {children}
        </code>
      </pre>
    </div>
  );
});

export const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  className = "" 
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content text-sm text-slate-700 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings - minimal spacing, feels more conversational
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-slate-900 mt-3 mb-1 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-slate-900 mt-3 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-800 mt-2 mb-0.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-medium text-slate-800 mt-2 mb-0.5 first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium text-slate-700 mt-1.5 first:mt-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-slate-600 mt-1.5 first:mt-0">
              {children}
            </h6>
          ),

          // Paragraphs - natural flow with soft breaks
          p: ({ children }) => (
            <p className="my-1.5 first:mt-0 last:mb-0">
              {children}
            </p>
          ),

          // Lists - tighter spacing
          ul: ({ children, className }) => {
            const isTaskList = className?.includes("contains-task-list");
            return (
              <ul className={`my-1.5 space-y-0.5 ${isTaskList ? "list-none pl-0" : "list-disc pl-5 marker:text-slate-400"}`}>
                {children}
              </ul>
            );
          },
          ol: ({ children }) => (
            <ol className="my-1.5 pl-5 list-decimal space-y-0.5 marker:text-slate-500">
              {children}
            </ol>
          ),
          li: ({ children, className }) => {
            const isTaskItem = className?.includes("task-list-item");
            if (isTaskItem) {
              return (
                <li className="flex items-start gap-2">
                  {children}
                </li>
              );
            }
            return <li>{children}</li>;
          },
          input: ({ type, checked }) => {
            if (type === "checkbox") {
              return checked ? (
                <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              );
            }
            return null;
          },

          // Code
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,

          // Links - inline, no icon clutter
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
            >
              {children}
            </a>
          ),

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Blockquote - subtle
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-600 italic">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-slate-200" />,

          // Tables - compact
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left text-xs font-medium text-slate-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-slate-700">
              {children}
            </td>
          ),

          // Images
          img: ({ src, alt }) => (
            <span className="my-2 block">
              <img
                src={src}
                alt={alt || ""}
                className="max-w-full rounded border border-slate-200"
              />
            </span>
          ),

          // Strikethrough
          del: ({ children }) => (
            <del className="text-slate-500 line-through">{children}</del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});