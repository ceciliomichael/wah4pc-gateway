"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { providerApi, apiKeyApi, transactionApi } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";
import type { Provider, ApiKey, Transaction, DashboardStats } from "@/types";
import {
  LuBuilding2,
  LuKeyRound,
  LuArrowLeftRight,
  LuCircleCheck,
  LuClock,
  LuCircleX,
  LuCircleAlert,
  LuTrendingUp,
  LuActivity,
  LuZap,
  LuShieldCheck,
} from "react-icons/lu";
import { clsx } from "clsx";
import { StatusBadge } from "@/components/ui/badge";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedValue, setCachedValue } from "@/lib/indexed-cache";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "emerald" | "amber" | "violet";
  trend?: string;
  description?: string;
}

interface DashboardCachePayload {
  stats: DashboardStats;
  recentTransactions: Transaction[];
}

const DASHBOARD_CACHE_TTL_MS = 60_000;

function StatCard({ label, value, icon: Icon, color, trend, description }: StatCardProps) {
  const colorConfig = {
    primary: {
      bg: "bg-primary-50",
      icon: "bg-primary-100 text-primary-600",
      accent: "text-primary-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      accent: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      accent: "text-amber-600",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "bg-violet-100 text-violet-600",
      accent: "text-violet-600",
    },
  };

  const config = colorConfig[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-elevated transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("p-2.5 rounded-xl", config.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
            <LuTrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

function calculateStats(
  providers: Provider[],
  apiKeys: ApiKey[],
  transactions: Transaction[]
): DashboardStats {
  return {
    totalProviders: providers.length,
    activeProviders: providers.filter((p) => p.isActive).length,
    totalApiKeys: apiKeys.length,
    activeApiKeys: apiKeys.filter((k) => k.isActive).length,
    totalTransactions: transactions.length,
    pendingTransactions: transactions.filter((t) => t.status === "PENDING").length,
    completedTransactions: transactions.filter((t) => t.status === "COMPLETED").length,
    failedTransactions: transactions.filter((t) => t.status === "FAILED").length,
  };
}

function DashboardContent() {
  const { identity } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const transactions = await transactionApi.getAll();
      let resolvedStats: DashboardStats;
      if (identity?.role === "admin") {
        const [providers, apiKeys] = await Promise.all([
          providerApi.getAll(),
          apiKeyApi.getAll(),
        ]);
        resolvedStats = calculateStats(providers, apiKeys, transactions);
      } else {
        resolvedStats = calculateStats([], [], transactions);
      }
      setStats(resolvedStats);
      setRecentTransactions(transactions.slice(0, 5));
      setError(null);

      const cacheKey =
        identity?.role === "admin"
          ? "dashboard:admin"
          : `dashboard:provider:${identity?.providerId ?? "self"}`;
      const cachePayload: DashboardCachePayload = {
        stats: resolvedStats,
        recentTransactions: transactions.slice(0, 5),
      };
      await setCachedValue(cacheKey, cachePayload, DASHBOARD_CACHE_TTL_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [identity?.providerId, identity?.role]);

  useEffect(() => {
    let isMounted = true;
    const cacheKey =
      identity?.role === "admin"
        ? "dashboard:admin"
        : `dashboard:provider:${identity?.providerId ?? "self"}`;

    const hydrateFromCache = async () => {
      try {
        const cached = await getCachedValue<DashboardCachePayload>(cacheKey);
        if (!cached || !isMounted) return;
        setStats(cached.stats);
        setRecentTransactions(cached.recentTransactions);
        setIsLoading(false);
      } catch (_error) {
      }
    };

    hydrateFromCache();
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  useRealtimeEvents(() => {
    fetchData();
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <LuCircleAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Failed to load</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-5 lg:pb-0">
      {/* Welcome Banner */}
      <div className="bg-primary-600 rounded-2xl p-6 shadow-soft relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Gateway Overview</h2>
            <p className="text-primary-100 text-sm">Monitor your healthcare data exchange in real-time</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
            <LuShieldCheck className="w-5 h-5 text-primary-200" />
            <span className="text-sm font-medium text-white">System Healthy</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {identity?.role === "admin" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Healthcare Providers"
            value={stats.totalProviders}
            icon={LuBuilding2}
            color="primary"
            description={`${stats.activeProviders} active`}
          />
          <StatCard
            label="Active API Keys"
            value={stats.activeApiKeys}
            icon={LuKeyRound}
            color="emerald"
            description={`${stats.totalApiKeys} total`}
          />
          <StatCard
            label="Total Transactions"
            value={stats.totalTransactions}
            icon={LuArrowLeftRight}
            color="amber"
            description="All time"
          />
          <StatCard
            label="Success Rate"
            value={stats.totalTransactions > 0 ? `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}%` : "0%"}
            icon={LuZap}
            color="violet"
            description={`${stats.completedTransactions} completed`}
            trend={stats.totalTransactions > 0 ? `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}%` : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Transactions"
            value={stats.totalTransactions}
            icon={LuArrowLeftRight}
            color="amber"
            description="Your provider scope"
          />
          <StatCard
            label="Success Rate"
            value={stats.totalTransactions > 0 ? `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}%` : "0%"}
            icon={LuZap}
            color="violet"
            description={`${stats.completedTransactions} completed`}
            trend={stats.totalTransactions > 0 ? `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}%` : undefined}
          />
        </div>
      )}

      {/* Transaction Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-elevated transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100">
                <LuClock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                  {stats.pendingTransactions}
                </p>
                <p className="text-sm font-medium text-slate-500">Pending</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              In Queue
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-elevated transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <LuCircleCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                  {stats.completedTransactions}
                </p>
                <p className="text-sm font-medium text-slate-500">Completed</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              Success
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-elevated transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <LuCircleX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                  {stats.failedTransactions}
                </p>
                <p className="text-sm font-medium text-slate-500">Failed</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
              Errors
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest FHIR resource transfers</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
            <LuActivity className="w-3.5 h-3.5" />
            Live
          </div>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-4">
              <LuArrowLeftRight className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">Transactions will appear here once initiated</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentTransactions.map((tx, index) => (
              <div 
                key={tx.id} 
                className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
                    <LuArrowLeftRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {tx.resourceType}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {tx.identifiers?.[0]?.value || tx.id.slice(0, 12)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-medium text-slate-600 truncate max-w-32">
                      {tx.requesterId.slice(0, 8)}... → {tx.targetId.slice(0, 8)}...
                    </p>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <DashboardContent />
      </DashboardShell>
    </AuthGuard>
  );
}
