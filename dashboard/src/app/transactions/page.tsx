"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { transactionApi, providerApi } from "@/lib/api";
import type { Transaction, Provider, Identifier } from "@/types";
import { LuLoaderCircle, LuCircleAlert, LuRefreshCw } from "react-icons/lu";
import { clsx } from "clsx";

import { Button } from "@/components/ui/button";
import {
  TransactionFilters,
  type StatusFilterValue,
} from "@/components/transactions/transaction-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LuLoaderCircle className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <LuCircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        providers={providers}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Showing {filteredTransactions.length} of {transactions.length} transactions
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