"use client";

import type { Transaction, Provider, Identifier } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LuArrowLeftRight, LuInfo } from "react-icons/lu";

interface TransactionsListProps {
  transactions: Transaction[];
  providers: Provider[];
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

// Helper to format identifier for display
function formatIdentifier(identifier: Identifier): string {
  const systemName = identifier.system
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(".")[0];
  return `${systemName}: ${identifier.value}`;
}

// Helper to get primary identifier display
function getPrimaryIdentifierDisplay(identifiers: Identifier[]): string {
  if (!identifiers || identifiers.length === 0) {
    return "No identifiers";
  }
  return formatIdentifier(identifiers[0]);
}

// Component to display identifiers with tooltip
function IdentifiersCell({ identifiers }: { identifiers: Identifier[] }) {
  if (!identifiers || identifiers.length === 0) {
    return <span className="text-slate-400 italic">None</span>;
  }

  const primaryDisplay = getPrimaryIdentifierDisplay(identifiers);
  const hasMore = identifiers.length > 1;

  return (
    <div className="group relative">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-slate-700 font-mono truncate max-w-32">
          {primaryDisplay}
        </span>
        {hasMore && (
          <span className="flex items-center gap-0.5 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            <LuInfo className="w-3 h-3" />
            +{identifiers.length - 1}
          </span>
        )}
      </div>
      
      {/* Tooltip showing all identifiers */}
      {hasMore && (
        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block">
          <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg min-w-48">
            <p className="font-medium mb-2">All Identifiers:</p>
            <ul className="space-y-1">
              {identifiers.map((id, idx) => (
                <li key={idx} className="font-mono">
                  <span className="text-slate-400">{id.system.replace(/^https?:\/\//, "").split("/")[0]}:</span>{" "}
                  {id.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile card component
function TransactionCard({
  transaction,
  providers,
  getProviderName,
  formatRelativeTime,
  formatDate,
}: {
  transaction: Transaction;
  providers: Provider[];
  getProviderName: (id: string) => string;
  formatRelativeTime: (date: string) => string;
  formatDate: (date: string) => string;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: ID and Status */}
        <div className="flex items-start justify-between gap-3">
          <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {transaction.id.slice(0, 8)}...
          </code>
          <StatusBadge status={transaction.status} />
        </div>

        {/* From -> To */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transfer</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-800 truncate">
              {getProviderName(transaction.requesterId)}
            </span>
            <span className="text-slate-400">→</span>
            <span className="font-medium text-slate-800 truncate">
              {getProviderName(transaction.targetId)}
            </span>
          </div>
        </div>

        {/* Resource Type */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Resource</p>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {transaction.resourceType}
          </span>
        </div>

        {/* Identifiers */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Identifiers</p>
          <IdentifiersCell identifiers={transaction.identifiers} />
        </div>

        {/* Time */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Time</span>
          <div className="text-right text-sm">
            <p className="text-slate-800">{formatRelativeTime(transaction.createdAt)}</p>
            <p className="text-xs text-slate-400">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TransactionsList({
  transactions,
  providers,
  onClearFilters,
  hasFilters = false,
}: TransactionsListProps) {
  // Helper to get provider name
  const getProviderName = (providerId: string): string => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || providerId.slice(0, 8) + "...";
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Format full date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card padding="none">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
            <LuArrowLeftRight className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">
            {hasFilters
              ? "No transactions match your filters"
              : "No transactions recorded yet"}
          </p>
          {hasFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <Card padding="none" className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  From → To
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Identifiers
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Transaction ID */}
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {tx.id.slice(0, 8)}...
                    </code>
                  </td>

                  {/* From -> To */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="font-medium text-slate-800 truncate max-w-24"
                        title={getProviderName(tx.requesterId)}
                      >
                        {getProviderName(tx.requesterId)}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span
                        className="font-medium text-slate-800 truncate max-w-24"
                        title={getProviderName(tx.targetId)}
                      >
                        {getProviderName(tx.targetId)}
                      </span>
                    </div>
                  </td>

                  {/* Resource Type */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {tx.resourceType}
                    </span>
                  </td>

                  {/* Identifiers */}
                  <td className="px-5 py-4">
                    <IdentifiersCell identifiers={tx.identifiers} />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={tx.status} />
                  </td>

                  {/* Time */}
                  <td className="px-5 py-4">
                    <div className="text-sm">
                      <p className="text-slate-800">{formatRelativeTime(tx.createdAt)}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            providers={providers}
            getProviderName={getProviderName}
            formatRelativeTime={formatRelativeTime}
            formatDate={formatDate}
          />
        ))}
      </div>
    </>
  );
}