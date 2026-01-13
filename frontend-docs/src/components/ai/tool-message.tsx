"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Wrench, CheckCircle, XCircle, Loader2 } from "lucide-react";

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
// NAVIGATION HELPER
// ============================================================================

/** Tools that support click-to-navigate behavior */
const NAVIGABLE_TOOLS = ["read_page", "analyze_page"] as const;

/**
 * Constructs a navigation URL from tool parameters
 * @returns URL path or null if tool is not navigable
 */
function getNavigationUrl(toolCall: ToolCall): string | null {
  const { name, params } = toolCall;
  
  if (!NAVIGABLE_TOOLS.includes(name as typeof NAVIGABLE_TOOLS[number])) {
    return null;
  }
  
  const page = params?.page;
  if (!page) return null;
  
  const section = params?.section;
  const basePath = `/docs/${page}`;
  
  return section ? `${basePath}#${section}` : basePath;
}

/**
 * Gets the display label for navigable tools
 * - read_page: shows "page > section" or just "page"
 * - analyze_page: shows "page"
 * @returns Display label or null if not a navigable tool
 */
function getNavigableToolLabel(toolCall: ToolCall): string | null {
  const { name, params } = toolCall;
  
  if (!NAVIGABLE_TOOLS.includes(name as typeof NAVIGABLE_TOOLS[number])) {
    return null;
  }
  
  const page = params?.page;
  if (!page) return null;
  
  const section = params?.section;
  
  if (name === "read_page" && section) {
    return `${page} › ${section}`;
  }
  
  return page;
}

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
  const router = useRouter();
  
  const { name, status, errorMessage } = toolCall;
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const navigationUrl = getNavigationUrl(toolCall);
  const isClickable = navigationUrl !== null;
  const navigableLabel = getNavigableToolLabel(toolCall);

  const handleClick = () => {
    if (navigationUrl) {
      router.push(navigationUrl);
    }
  };

  // For navigable tools (read_page, analyze_page), show page/section instead of status
  const showNavigableLabel = navigableLabel && status === "success";
  
  // Hide status for list_pages tool when successful
  const hideStatusForListPages = name === "list_pages" && status === "success";

  return (
    <div
      className={`rounded-lg border p-3 ${statusColor} transition-all ${
        isClickable 
          ? "cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-[0.99]" 
          : ""
      }`}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && handleClick() : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm">
          <Wrench className="h-3.5 w-3.5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-900">
              {formatToolName(name)}
            </span>
            {showNavigableLabel ? (
              <span className="text-sm text-slate-500 font-mono truncate">
                {navigableLabel}
              </span>
            ) : hideStatusForListPages ? null : (
              <div className="flex items-center gap-1">
                <ToolStatusIcon status={status} />
                <span className="text-xs text-slate-500">{statusLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-2 rounded-md bg-red-100 border border-red-200 px-3 py-2">
          <p className="text-xs text-red-700">{errorMessage}</p>
        </div>
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