"use client";

import { useState, useCallback } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { formatPageForLLM } from "@/utils/markdown";

type CopyState = "idle" | "copied" | "error";

interface CopyPageButtonProps {
  /** Selector for the content element to copy. Defaults to 'main' */
  contentSelector?: string;
  /** Optional page title override */
  pageTitle?: string;
}

export function CopyPageButton({
  contentSelector = "main",
  pageTitle,
}: CopyPageButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    try {
      const contentElement = document.querySelector(contentSelector);

      if (!contentElement) {
        console.error(`Content element not found: ${contentSelector}`);
        setCopyState("error");
        setTimeout(() => setCopyState("idle"), 2000);
        return;
      }

      // Convert to LLM-friendly Markdown
      const markdown = formatPageForLLM(contentElement, pageTitle);

      // Copy to clipboard
      await navigator.clipboard.writeText(markdown);

      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [contentSelector, pageTitle]);

  const getIcon = () => {
    switch (copyState) {
      case "copied":
        return <Check className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Copy className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (copyState) {
      case "copied":
        return "Copied!";
      case "error":
        return "Failed";
      default:
        return "Copy Page";
    }
  };

  const getStyles = () => {
    const base =
      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200";

    switch (copyState) {
      case "copied":
        return `${base} border-green-200 bg-green-50 text-green-700`;
      case "error":
        return `${base} border-red-200 bg-red-50 text-red-700`;
      default:
        return `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900`;
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={getStyles()}
      aria-label={getLabel()}
    >
      {getIcon()}
      <span className="text-xs sm:text-sm">{getLabel()}</span>
    </button>
  );
}