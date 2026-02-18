"use client";

import type { LogSummary } from "@/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LuFileText } from "react-icons/lu";
import { clsx } from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

interface LogsTableProps {
  logs: LogSummary[];
  selectedId?: string;
  onSelectLog: (log: LogSummary) => void;
  loading?: boolean;
  refreshing?: boolean;
}

function getStatusVariant(statusCode: number): BadgeVariant {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "info";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  if (statusCode >= 500) return "error";
  return "default";
}

function formatMethod(method: string) {
  return method.toUpperCase();
}

function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET": return "text-blue-600 bg-blue-50";
    case "POST": return "text-emerald-600 bg-emerald-50";
    case "PUT": return "text-amber-600 bg-amber-50";
    case "DELETE": return "text-red-600 bg-red-50";
    default: return "text-slate-600 bg-slate-50";
  }
}

export function LogsTable({
  logs,
  selectedId,
  onSelectLog,
  loading = false,
  refreshing = false,
}: LogsTableProps) {
  // Format time (e.g., "11:34 AM")
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Empty state
  if (!loading && logs.length === 0) {
    return (
      <Card padding="none" className="h-full">
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
            <LuFileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No logs found for this date</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different date</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-[80px_70px_1fr_60px_70px] text-sm">
          <div className="px-3 py-3 font-medium text-slate-500">Time</div>
          <div className="px-3 py-3 font-medium text-slate-500">Method</div>
          <div className="px-3 py-3 font-medium text-slate-500">Path</div>
          <div className="px-3 py-3 font-medium text-slate-500">Status</div>
          <div className="px-3 py-3 font-medium text-slate-500 text-right">Duration</div>
        </div>
      </div>
      
      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {refreshing && logs.length > 0 && (
          <div className="p-2 space-y-2 border-b border-slate-100 bg-slate-50/60">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`logs-refreshing-${index}`} className="grid grid-cols-[80px_70px_1fr_60px_70px] gap-2">
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-full rounded-md" />
              </div>
            ))}
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            onClick={() => onSelectLog(log)}
            onKeyDown={(e) => e.key === "Enter" && onSelectLog(log)}
            role="button"
            tabIndex={0}
            className={clsx(
              "grid grid-cols-[80px_70px_1fr_60px_70px] text-sm cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-100",
              selectedId === log.id ? "bg-primary-50 hover:bg-primary-50" : ""
            )}
          >
            <div className="px-3 py-2.5 whitespace-nowrap text-slate-600 font-mono text-xs">
              {formatTime(log.timestamp)}
            </div>
            <div className="px-3 py-2.5 whitespace-nowrap">
              <span className={clsx(
                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                getMethodColor(log.method)
              )}>
                {formatMethod(log.method)}
              </span>
            </div>
            <div className="px-3 py-2.5 text-slate-700 truncate" title={log.url}>
              {log.url}
            </div>
            <div className="px-3 py-2.5 whitespace-nowrap">
              <Badge variant={getStatusVariant(log.statusCode)} size="sm">
                {log.statusCode}
              </Badge>
            </div>
            <div className="px-3 py-2.5 whitespace-nowrap text-right text-slate-500 text-xs">
              {log.durationMs}ms
            </div>
          </div>
        ))}
        {loading && logs.length === 0 && (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`logs-loading-${index}`} className="grid grid-cols-[80px_70px_1fr_60px_70px] gap-2">
                <Skeleton className="h-6 w-full rounded-md" />
                <Skeleton className="h-6 w-full rounded-md" />
                <Skeleton className="h-6 w-full rounded-md" />
                <Skeleton className="h-6 w-full rounded-md" />
                <Skeleton className="h-6 w-full rounded-md" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
