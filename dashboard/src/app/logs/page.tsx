"use client";

import { useState, useEffect } from "react";
import { logsApi } from "@/lib/api";
import type { LogDate, LogSummary } from "@/types";
import { LogsTable } from "@/components/logs/logs-table";
import { LogViewer } from "@/components/logs/log-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuCalendar, LuLoader, LuRefreshCw, LuChevronDown } from "react-icons/lu";
import { clsx } from "clsx";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

function LogsContent() {
  const [dates, setDates] = useState<LogDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogSummary | null>(null);
  
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mobile: show date dropdown instead of sidebar
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const shouldHideLog = (url: string): boolean => {
    const path = url.split("?")[0];
    return (
      path === "/api/v1/transactions" ||
      path.startsWith("/api/v1/transactions/") ||
      path === "/providers" ||
      path === "/api/v1/providers" ||
      path.startsWith("/api/v1/providers/") ||
      path === "/api/v1/apikeys" ||
      path.startsWith("/api/v1/apikeys/") ||
      path === "/settings" ||
      path === "/api/v1/settings"
    );
  };

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
      setError("Failed to load available dates.");
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
      const filteredLogs = data.filter((log) => !shouldHideLog(log.url));
      setLogs(filteredLogs);
      if (selectedLog && !filteredLogs.some((log) => log.id === selectedLog.id)) {
        setSelectedLog(null);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError(`Failed to load logs for ${date}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      selectedDate ? fetchLogs(selectedDate) : Promise.resolve(),
      fetchDates()
    ]).finally(() => setIsRefreshing(false));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDateDropdown(false);
  };

  // Loading state
  if (loadingDates && dates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LuLoader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 mb-5">
        <p className="text-slate-500">
          Audit trail and diagnostic logs
        </p>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
          leftIcon={
            <LuRefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
          }
        >
          Refresh
        </Button>
      </div>

      {/* Mobile Date Selector */}
      <div className="lg:hidden shrink-0 mb-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
          >
            <div className="flex items-center gap-2">
              <LuCalendar className="w-4 h-4 text-slate-500" />
              <span>{selectedDate || "Select Date"}</span>
              {selectedDate && dates.find(d => d.date === selectedDate) && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {dates.find(d => d.date === selectedDate)?.count} logs
                </span>
              )}
            </div>
            <LuChevronDown className={clsx("w-4 h-4 transition-transform", showDateDropdown && "rotate-180")} />
          </button>
          
          {showDateDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
              {dates.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">
                  No logs available
                </div>
              ) : (
                dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => handleSelectDate(d.date)}
                    className={clsx(
                      "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between border-b border-slate-100 last:border-b-0",
                      selectedDate === d.date
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{d.date}</span>
                    <span className={clsx(
                      "text-xs px-1.5 py-0.5 rounded",
                      selectedDate === d.date ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {d.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium shrink-0">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 lg:gap-6 min-h-0">
        {/* Left Sidebar: Dates (Desktop only) */}
        <div className="hidden lg:flex w-56 flex-col shrink-0">
          <Card className="h-full flex flex-col overflow-hidden" padding="none">
            <div className="p-3 border-b border-slate-100 bg-slate-50 font-medium text-sm text-slate-700 flex items-center gap-2 shrink-0">
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
                    type="button"
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
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          selectedLog ? "hidden lg:flex lg:w-2/5" : "w-full"
        )}>
          <LogsTable 
            logs={logs} 
            selectedId={selectedLog?.id} 
            onSelectLog={setSelectedLog}
            loading={loadingLogs}
          />
        </div>

        {/* Right: Log Detail (Conditional) */}
        {selectedLog && (
          <div className={clsx(
            "flex flex-col min-w-0",
            "fixed inset-0 z-30 bg-white lg:relative lg:inset-auto lg:z-auto lg:bg-transparent",
            "lg:w-3/5 lg:animate-in lg:slide-in-from-right-4 lg:duration-200"
          )}>
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

export default function LogsPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <LogsContent />
      </DashboardShell>
    </AuthGuard>
  );
}
