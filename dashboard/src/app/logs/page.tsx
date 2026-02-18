"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logsApi } from "@/lib/api";
import type { LogDate, LogSummary } from "@/types";
import { LogsTable } from "@/components/logs/logs-table";
import { LogViewer } from "@/components/logs/log-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuCalendar, LuRefreshCw, LuChevronDown } from "react-icons/lu";
import { clsx } from "clsx";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedValue, setCachedValue } from "@/lib/indexed-cache";

const LOG_DATES_CACHE_TTL_MS = 45_000;
const LOG_ITEMS_CACHE_TTL_MS = 30_000;

function LogsContent() {
  const [dates, setDates] = useState<LogDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogSummary | null>(null);
  
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false);
  
  // Mobile: show date dropdown instead of sidebar
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const selectedDateRef = useRef<string | null>(null);
  const selectedLogRef = useRef<LogSummary | null>(null);
  const datesRequestIdRef = useRef(0);
  const logsRequestIdRef = useRef(0);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    selectedLogRef.current = selectedLog;
  }, [selectedLog]);

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
  const fetchDates = useCallback(async (options?: { background?: boolean }) => {
    const requestId = ++datesRequestIdRef.current;
    if (!options?.background) {
      setLoadingDates(true);
    }
    setError(null);
    try {
      const data = await logsApi.getDates();
      if (requestId !== datesRequestIdRef.current) return;

      setDates(data);
      await setCachedValue<LogDate[]>("logs:dates", data, LOG_DATES_CACHE_TTL_MS);

      const currentSelectedDate = selectedDateRef.current;
      if (data.length === 0) {
        if (currentSelectedDate) {
          setSelectedDate(null);
          setLogs([]);
        }
        return;
      }

      if (!currentSelectedDate || !data.some((d) => d.date === currentSelectedDate)) {
        setSelectedDate(data[0].date);
      }
    } catch (err) {
      if (requestId !== datesRequestIdRef.current) return;
      console.error("Failed to fetch log dates:", err);
      setError("Failed to load available dates.");
    } finally {
      if (requestId !== datesRequestIdRef.current) return;
      setLoadingDates(false);
    }
  }, []);

  const fetchLogs = useCallback(async (date: string, options?: { background?: boolean }) => {
    const requestId = ++logsRequestIdRef.current;
    if (!options?.background) {
      setLoadingLogs(true);
    }
    // Keep selected log if it belongs to the new date, otherwise clear
    const currentSelectedLog = selectedLogRef.current;
    if (currentSelectedLog && !currentSelectedLog.timestamp.startsWith(date)) {
      setSelectedLog(null);
    }
    
    try {
      const data = await logsApi.getLogs(date);
      if (requestId !== logsRequestIdRef.current || selectedDateRef.current !== date) return;

      const filteredLogs = data.filter((log) => !shouldHideLog(log.url));
      setLogs(filteredLogs);
      await setCachedValue<LogSummary[]>(`logs:date:${date}`, filteredLogs, LOG_ITEMS_CACHE_TTL_MS);
      const selected = selectedLogRef.current;
      if (selected && !filteredLogs.some((log) => log.id === selected.id)) {
        setSelectedLog(null);
      }
    } catch (err) {
      if (requestId !== logsRequestIdRef.current || selectedDateRef.current !== date) return;
      console.error("Failed to fetch logs:", err);
      setError(`Failed to load logs for ${date}`);
    } finally {
      if (requestId !== logsRequestIdRef.current || selectedDateRef.current !== date) return;
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const hydrateDatesFromCache = async () => {
      try {
        const cachedDates = await getCachedValue<LogDate[]>("logs:dates");
        if (!cachedDates || !isMounted) return;
        setDates(cachedDates);
        if (cachedDates.length > 0 && !selectedDateRef.current) {
          setSelectedDate(cachedDates[0].date);
        }
        setLoadingDates(false);
      } catch (_error) {
      }
    };
    hydrateDatesFromCache();
    fetchDates();
    return () => {
      isMounted = false;
    };
  }, [fetchDates]);

  // Fetch logs when date changes
  useEffect(() => {
    if (selectedDate) {
      const requestedDate = selectedDate;
      const hydrateLogsFromCache = async () => {
        try {
          const cachedLogs = await getCachedValue<LogSummary[]>(`logs:date:${requestedDate}`);
          if (!cachedLogs) return;
          if (selectedDateRef.current !== requestedDate) return;
          setLogs(cachedLogs);
          setLoadingLogs(false);
        } catch (_error) {
        }
      };
      hydrateLogsFromCache();
      fetchLogs(selectedDate);
    } else {
      setLogs([]);
    }
  }, [selectedDate, fetchLogs]);

  useRealtimeEvents(() => {
    const activeDate = selectedDateRef.current;
    setIsRealtimeUpdating(true);
    if (activeDate) {
      fetchLogs(activeDate, { background: true }).finally(() => {
        setIsRealtimeUpdating(false);
      });
    } else {
      setIsRealtimeUpdating(false);
    }
    fetchDates({ background: true });
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    const activeDate = selectedDateRef.current;
    Promise.all([
      activeDate ? fetchLogs(activeDate, { background: true }) : Promise.resolve(),
      fetchDates({ background: true })
    ]).finally(() => setIsRefreshing(false));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDateDropdown(false);
  };

  // Loading state
  if (loadingDates && dates.length === 0) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-40" />
        <div className="flex gap-4">
          <Skeleton className="hidden lg:block h-[560px] w-56 rounded-2xl" />
          <Skeleton className="h-[560px] flex-1 rounded-2xl" />
        </div>
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
          leftIcon={<LuRefreshCw className="w-4 h-4" />}
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
              {loadingDates ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
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
                <div className="space-y-2 p-1">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
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
            refreshing={isRealtimeUpdating || isRefreshing}
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
