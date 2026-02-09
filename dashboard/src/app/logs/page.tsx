"use client";

import { useState, useEffect } from "react";
import { logsApi } from "@/lib/api";
import type { LogDate, LogSummary } from "@/types";
import { LogsTable } from "@/components/logs/logs-table";
import { LogViewer } from "@/components/logs/log-viewer";
import { Card } from "@/components/ui/card";
import { LuCalendar, LuLoader, LuRefreshCw, LuInfo } from "react-icons/lu";
import { clsx } from "clsx";
import { useAuth } from "@/stores/auth-store";

export default function LogsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [dates, setDates] = useState<LogDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogSummary | null>(null);
  
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dates on mount
  useEffect(() => {
    fetchDates();
  }, []);

  // Fetch logs when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchLogs(selectedDate);
    } else {
      setLogs([]);
    }
  }, [selectedDate]);

  const fetchDates = async () => {
    setLoadingDates(true);
    setError(null);
    try {
      const data = await logsApi.getDates();
      setDates(data);
      if (data.length > 0 && !selectedDate) {
        setSelectedDate(data[0].date);
      }
    } catch (err) {
      console.error("Failed to fetch log dates:", err);
      setError("Failed to load available dates. Ensure you have admin permissions.");
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchLogs = async (date: string) => {
    setLoadingLogs(true);
    // Keep selected log if it belongs to the new date, otherwise clear
    if (selectedLog && !selectedLog.timestamp.startsWith(date)) {
      setSelectedLog(null);
    }
    
    try {
      const data = await logsApi.getLogs(date);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError(`Failed to load logs for ${date}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefresh = () => {
    if (selectedDate) {
      fetchLogs(selectedDate);
    }
    fetchDates();
  };

  // Permission check
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <LuInfo className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md">
          System logs contain sensitive information and are restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail and diagnostic logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh logs"
          >
            <LuRefreshCw className={clsx("w-5 h-5", (loadingDates || loadingLogs) && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Sidebar: Dates */}
        <div className="w-64 flex flex-col gap-4 shrink-0">
          <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
            <div className="p-3 border-b border-slate-100 bg-slate-50 font-medium text-sm text-slate-700 flex items-center gap-2">
              <LuCalendar className="w-4 h-4 text-slate-500" />
              Date History
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingDates ? (
                <div className="p-4 text-center">
                  <LuLoader className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
                </div>
              ) : dates.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">
                  No logs available
                </div>
              ) : (
                dates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={clsx(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                      selectedDate === d.date
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{d.date}</span>
                    <span className={clsx(
                      "text-xs px-1.5 py-0.5 rounded bg-white border border-slate-100 group-hover:border-slate-200",
                      selectedDate === d.date ? "text-primary-600" : "text-slate-400"
                    )}>
                      {d.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Middle: Log List */}
        <div className={clsx("flex-1 flex flex-col min-w-0 transition-all duration-300", selectedLog ? "w-1/3" : "w-full")}>
          <LogsTable 
            logs={logs} 
            selectedId={selectedLog?.id} 
            onSelectLog={setSelectedLog}
            loading={loadingLogs}
          />
        </div>

        {/* Right: Log Detail (Conditional) */}
        {selectedLog && (
          <div className="w-1/2 flex flex-col min-w-0 animate-in slide-in-from-right-4 duration-200">
            <LogViewer 
              summary={selectedLog} 
              date={selectedDate || ""} 
              onClose={() => setSelectedLog(null)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}