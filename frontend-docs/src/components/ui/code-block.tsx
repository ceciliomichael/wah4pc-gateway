"use client";

import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";

interface CodeBlockProps {
  code: string;
  title?: string;
  language?: string;
  className?: string;
  showCopyButton?: boolean;
  variant?: "dark" | "light"; // Deprecated but kept for compatibility, always light now
}

export function CodeBlock({
  code,
  title,
  language,
  className = "",
  showCopyButton = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`max-w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {title}
            </span>
            {language && (
              <span className="text-xs text-slate-400">({language})</span>
            )}
          </div>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              {copied ? (
                <><Check className="h-3 w-3 text-green-600" /> <span className="text-green-600">Copied</span></>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
          )}
        </div>
      )}
      
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-800 bg-transparent">
          {code}
        </pre>
        
        {/* If no title, show floating copy button */}
        {!title && showCopyButton && (
           <button
             onClick={handleCopy}
             className="absolute top-2 right-2 p-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors shadow-md"
             title="Copy to clipboard"
           >
             {copied ? (
               <Check className="h-3.5 w-3.5 text-green-600" />
             ) : (
               <Copy className="h-3.5 w-3.5" />
             )}
           </button>
        )}
      </div>
    </div>
  );
}

interface CodeBlockWithHeaderProps {
  code: string;
  header: string;
  className?: string;
}

// Keeping this for backward compatibility but making it look like the new design
export function CodeBlockWithHeader({
  code,
  header,
  className = "",
}: CodeBlockWithHeaderProps) {
  return (
    <div className={`max-w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg ${className}`}>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{header}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-800">
        {code}
      </pre>
    </div>
  );
}