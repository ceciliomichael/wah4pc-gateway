"use client";

import type { TransactionStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { LuSearch } from "react-icons/lu";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "RECEIVED", label: "Received" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export type StatusFilterValue = TransactionStatus | "ALL";

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilterValue;
  onStatusChange: (value: StatusFilterValue) => void;
}

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search by ID, identifier, resource type, or provider..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<LuSearch className="w-4 h-4" />}
        />
      </div>

      {/* Status Filter */}
      <div className="sm:w-48">
        <Select
          value={statusFilter}
          onChange={(value) => onStatusChange(value as StatusFilterValue)}
          options={STATUS_OPTIONS}
        />
      </div>
    </div>
  );
}