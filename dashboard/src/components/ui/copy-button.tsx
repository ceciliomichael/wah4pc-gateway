"use client";

import { useState } from "react";
import { LuCopy, LuCheck } from "react-icons/lu";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors ${className}`}
      title={`Copy ${label || "value"}`}
    >
      <span className="truncate max-w-[200px]">{value}</span>
      {copied ? (
        <LuCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <LuCopy className="w-3.5 h-3.5 flex-shrink-0" />
      )}
    </button>
  );
}