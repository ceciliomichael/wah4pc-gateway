"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

interface JsonViewerProps {
  data: string | object;
  title?: string;
  initialExpanded?: boolean;
  className?: string;
}

export function JsonViewer({ data, title, initialExpanded = true, className = "" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  
  // Parse if string
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = { error: "Invalid JSON", raw: data };
    }
  }

  const handleCopy = async () => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg ${className}`}>
      {(title || true) && ( // Always show header for copy button
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {title || "JSON Payload"}
          </span>
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
        </div>
      )}
      
      <div className="p-4 text-xs font-mono leading-relaxed overflow-x-hidden text-slate-800">
        <JsonNode node={parsedData} depth={0} initialExpanded={initialExpanded} isLast={true} />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  node: unknown;
  depth: number;
  initialExpanded: boolean;
  isLast: boolean;
}

function JsonNode({ node, depth, initialExpanded, isLast }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  if (node === null) return <span className="text-slate-500">null{!isLast && ","}</span>;
  if (typeof node === "boolean") return <span className="text-purple-600">{node.toString()}{!isLast && ","}</span>;
  if (typeof node === "number") return <span className="text-amber-600">{node}{!isLast && ","}</span>;
  if (typeof node === "string") return <span className="text-green-600 break-all whitespace-pre-wrap">"{node}"{!isLast && ","}</span>;

  if (typeof node !== "object" || node === null) {
    return <span className="text-slate-500">{String(node)}{!isLast && ","}</span>;
  }

  const isArray = Array.isArray(node);
  const entries = Object.entries(node as Record<string, unknown>);
  const isEmpty = entries.length === 0;
  
  if (isEmpty) {
    return <span className="text-slate-500">{isArray ? "[]" : "{}"}{!isLast && ","}</span>;
  }

  return (
    <div className="ml-1">
      <div className="flex items-start">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mr-1 mt-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <span>
          <span className="text-slate-500">{isArray ? "[" : "{"}</span>
          {!expanded && <span className="text-slate-400 mx-1">...</span>}
        </span>
      </div>

      {expanded && (
        <div className="border-l border-slate-200 ml-1.5 pl-2">
          {entries.map(([key, value], idx) => (
            <div key={key} className="my-1">
              {!isArray && (
                <span className="text-blue-600 mr-1.5">"{key}":</span>
              )}
              <JsonNode 
                node={value} 
                depth={depth + 1} 
                initialExpanded={initialExpanded}
                isLast={idx === entries.length - 1}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="ml-1">
        <span className="text-slate-500">{isArray ? "]" : "}"}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    </div>
  );
}