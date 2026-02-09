"use client";

import type { LogSummary } from "@/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LuFileText } from "react-icons/lu";
import { clsx } from "clsx";

interface LogsTableProps {
  logs: LogSummary[];
  selectedId?: string;
  onSelectLog: (log: LogSummary) => void;
  loading?: boolean;
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
}: LogsTableProps) {
  // Format time (HH:mm:ss.ms)
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + "." + date.getMilliseconds().toString().padStart(3, "0");
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
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-24">Time</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-20">Method</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Path</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-24">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500 w-20">Dur.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onSelectLog(log)}
                className={clsx(
                  "cursor-pointer transition-colors hover:bg-slate-50",
                  selectedId === log.id ? "bg-primary-50 hover:bg-primary-50" : ""
                )}
              >
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                  {formatTime(log.timestamp)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                    getMethodColor(log.method)
                  )}>
                    {formatMethod(log.method)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 truncate max-w-[200px]" title={log.url}>
                  {log.url}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={getStatusVariant(log.statusCode)} size="sm">
                    {log.statusCode}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500 text-xs">
                  {log.durationMs}ms
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading logs...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}