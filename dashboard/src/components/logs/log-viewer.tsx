"use client";

import { useEffect, useState } from "react";
import { logsApi } from "@/lib/api";
import type { LogSummary, LogDetail } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LuX, LuCopy, LuCheck, LuLoader, LuDownload } from "react-icons/lu";

interface LogViewerProps {
  summary: LogSummary | null;
  date: string;
  onClose: () => void;
}

export function LogViewer({ summary, date, onClose }: LogViewerProps) {
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (summary && date) {
      setLoading(true);
      setError(null);
      setDetail(null);
      
      logsApi.getLogDetail(date, summary.id)
        .then(data => setDetail(data))
        .catch(err => setError("Failed to load log details"))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [summary, date]);

  if (!summary) {
    return (
      <Card className="h-full flex items-center justify-center bg-slate-50 border-dashed">
        <div className="text-center p-6 text-slate-400">
          <p>Select a log entry to view details</p>
        </div>
      </Card>
    );
  }

  const handleCopy = () => {
    if (detail?.content) {
      navigator.clipboard.writeText(detail.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (detail?.content) {
      const blob = new Blob([detail.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log_${date}_${summary.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg border-slate-200">
      <CardHeader className="bg-slate-50 py-3 px-4 border-b border-slate-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <Badge variant="default" className="font-mono text-xs shrink-0">
              {summary.id.slice(0, 8)}
            </Badge>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm text-slate-800 truncate" title={summary.url}>
                {summary.method} {summary.url}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(summary.timestamp).toLocaleString()} • {summary.clientIp}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={handleCopy}
              disabled={!detail}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <LuCheck className="w-4 h-4 text-emerald-600" /> : <LuCopy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              disabled={!detail}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Download log file"
            >
              <LuDownload className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close details"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-auto bg-slate-900 p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
            <LuLoader className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="flex items-center justify-center h-full text-red-400">
            <p>{error}</p>
          </div>
        ) : detail ? (
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
            {detail.content}
          </pre>
        ) : null}
      </div>
    </Card>
  );
}