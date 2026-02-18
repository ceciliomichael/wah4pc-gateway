"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { transactionApi, providerApi } from "@/lib/api";
import type { Transaction, Provider, Identifier } from "@/types";
import { LuCircleAlert, LuRefreshCw } from "react-icons/lu";
import { clsx } from "clsx";

import { Button } from "@/components/ui/button";
import {
  TransactionFilters,
  type StatusFilterValue,
} from "@/components/transactions/transaction-filters";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedValue, setCachedValue } from "@/lib/indexed-cache";

interface TransactionsCachePayload {
  transactions: Transaction[];
  providers: Provider[];
}

const TRANSACTIONS_CACHE_TTL_MS = 45_000;

// Helper to search within identifiers array
function identifiersMatchSearch(identifiers: Identifier[], query: string): boolean {
  if (!identifiers || identifiers.length === 0) return false;
  return identifiers.some(
    (id) =>
      id.system.toLowerCase().includes(query) ||
      id.value.toLowerCase().includes(query)
  );
}

function TransactionsContent() {
  const ITEMS_PER_PAGE = 20;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [txData, providerData] = await Promise.all([
        transactionApi.getAll(),
        providerApi.getAll(),
      ]);
      setTransactions(txData);
      setProviders(providerData);
      setError(null);
      await setCachedValue<TransactionsCachePayload>(
        "transactions:list",
        {
          transactions: txData,
          providers: providerData,
        },
        TRANSACTIONS_CACHE_TTL_MS
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const hydrateFromCache = async () => {
      try {
        const cached = await getCachedValue<TransactionsCachePayload>("transactions:list");
        if (!cached || !isMounted) return;
        setTransactions(cached.transactions);
        setProviders(cached.providers);
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
    fetchData(true);
  });

  // Helper to get provider name for search
  const getProviderName = useCallback(
    (providerId: string): string => {
      const provider = providers.find((p) => p.id === providerId);
      return provider?.name || providerId;
    },
    [providers]
  );

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Status filter
    if (statusFilter !== "ALL" && tx.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(query) ||
        tx.resourceType.toLowerCase().includes(query) ||
        getProviderName(tx.requesterId).toLowerCase().includes(query) ||
        getProviderName(tx.targetId).toLowerCase().includes(query) ||
        identifiersMatchSearch(tx.identifiers, query)
      );
    }

    return true;
  });

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "ALL";
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  );
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <p className="text-slate-500">
          View and monitor FHIR resource transfer transactions
        </p>
        <Button
          variant="secondary"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          leftIcon={
            <LuRefreshCw
              className={clsx("w-4 h-4", isRefreshing && "animate-spin")}
            />
          }
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="shrink-0 mt-5">
        <TransactionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg shrink-0 mt-5">
          <LuCircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions List */}
      <div className="flex-1 min-h-0 mt-5">
        <TransactionsList
          transactions={paginatedTransactions}
          providers={providers}
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="text-sm text-slate-500 text-center shrink-0 mt-4">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{" "}
          {filteredTransactions.length} transactions
        </div>
      )}

      {filteredTransactions.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 shrink-0 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-slate-600 min-w-24 text-center">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <TransactionsContent />
      </DashboardShell>
    </AuthGuard>
  );
}
