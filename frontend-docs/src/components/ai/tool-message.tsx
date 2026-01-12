"use client";

import { useState, memo } from "react";
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type ToolStatus = "pending" | "running" | "success" | "error";

/** JSON-serializable tool result from API */
export type ToolResult = string | number | boolean | null | ToolResult[] | { [key: string]: ToolResult };

export interface ToolCall {
  id: string;
  name: string;
  params?: Record<string, string>;
  status: ToolStatus;
  result?: ToolResult;
  errorMessage?: string;
}

interface ToolMessageProps {
  toolCall: ToolCall;
}

interface ToolResultDropdownProps {
  result: ToolResult;
  isOpen: boolean;
  onToggle: () => void;
}

// ============================================================================
// TOOL STATUS INDICATOR
// ============================================================================

function ToolStatusIcon({ status }: { status: ToolStatus }) {
  switch (status) {
    case "pending":
      return <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-pulse" />;
    case "running":
      return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
    case "success":
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    case "error":
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  }
}

function getStatusColor(status: ToolStatus): string {
  switch (status) {
    case "pending":
      return "bg-slate-50 border-slate-200";
    case "running":
      return "bg-blue-50 border-blue-200";
    case "success":
      return "bg-green-50 border-green-200";
    case "error":
      return "bg-red-50 border-red-200";
  }
}

function getStatusLabel(status: ToolStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running...";
    case "success":
      return "Completed";
    case "error":
      return "Failed";
  }
}

// ============================================================================
// TOOL RESULT DROPDOWN
// ============================================================================

const ToolResultDropdown = memo(function ToolResultDropdown({
  result,
  isOpen,
  onToggle,
}: ToolResultDropdownProps) {
  const formattedResult = typeof result === "string" 
    ? result 
    : JSON.stringify(result, null, 2);

  // Truncate for preview
  const preview = formattedResult.length > 100 
    ? formattedResult.slice(0, 100) + "..." 
    : formattedResult;

  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">View Result</span>
        {!isOpen && (
          <span className="text-slate-400 font-mono truncate max-w-[200px]">
            {preview}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="max-h-[300px] overflow-auto p-3">
            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">
              {formattedResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// TOOL NAME DISPLAY
// ============================================================================

function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatParams(params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return "";
  
  return Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ToolMessage = memo(function ToolMessage({ toolCall }: ToolMessageProps) {
  const [isResultOpen, setIsResultOpen] = useState(false);

  const { name, params, status, result, errorMessage } = toolCall;
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <div className={`rounded-lg border p-3 ${statusColor} transition-colors`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm">
          <Wrench className="h-3.5 w-3.5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">
              {formatToolName(name)}
            </span>
            <div className="flex items-center gap-1">
              <ToolStatusIcon status={status} />
              <span className="text-xs text-slate-500">{statusLabel}</span>
            </div>
          </div>
          {params && Object.keys(params).length > 0 && (
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
              {formatParams(params)}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-2 rounded-md bg-red-100 border border-red-200 px-3 py-2">
          <p className="text-xs text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Result Dropdown */}
      {status === "success" && result && (
        <ToolResultDropdown
          result={result}
          isOpen={isResultOpen}
          onToggle={() => setIsResultOpen(!isResultOpen)}
        />
      )}
    </div>
  );
});

// ============================================================================
// TOOL CALLS CONTAINER - For rendering multiple tool calls
// ============================================================================

interface ToolCallsContainerProps {
  toolCalls: ToolCall[];
}

export const ToolCallsContainer = memo(function ToolCallsContainer({
  toolCalls,
}: ToolCallsContainerProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="space-y-2 my-2">
      {toolCalls.map((toolCall) => (
        <ToolMessage key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  );
});