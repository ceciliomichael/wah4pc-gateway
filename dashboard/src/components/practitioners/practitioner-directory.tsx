"use client";

import { useMemo, useState } from "react";
import { LuBuilding2, LuSearch, LuStethoscope, LuUsers } from "react-icons/lu";
import { Badge, ProviderTypeBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Provider } from "@/types";

interface PractitionerDirectoryProps {
  providers: Provider[];
}

function getPractitionerCount(providers: Provider[]): number {
  return providers.reduce(
    (total, provider) => total + (provider.practitionerList?.length || 0),
    0,
  );
}

export function PractitionerDirectory({
  providers,
}: PractitionerDirectoryProps) {
  const [query, setQuery] = useState("");

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return providers;

    return providers.filter((provider) => {
      const baseMatch =
        provider.name.toLowerCase().includes(normalizedQuery) ||
        provider.id.toLowerCase().includes(normalizedQuery) ||
        (provider.facilityCode || "").toLowerCase().includes(normalizedQuery) ||
        (provider.location || "").toLowerCase().includes(normalizedQuery);

      if (baseMatch) return true;

      const practitioners = provider.practitionerList || [];
      return practitioners.some(
        (practitioner) =>
          practitioner.code.toLowerCase().includes(normalizedQuery) ||
          practitioner.display.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [providers, query]);

  const totalPractitioners = getPractitionerCount(filteredProviders);
  const activeProviders = filteredProviders.filter(
    (provider) => provider.isActive,
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <LuBuilding2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Providers
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {filteredProviders.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <LuUsers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Active Providers
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {activeProviders}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <LuStethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Practitioners
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {totalPractitioners}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by provider, facility code, practitioner code, or practitioner name..."
        leftIcon={<LuSearch className="h-4 w-4" />}
      />

      {filteredProviders.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">
              No providers or practitioners matched your search.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProviders.map((provider) => {
            const practitioners = provider.practitionerList || [];
            return (
              <Card
                key={provider.id}
                padding="none"
                className="overflow-hidden"
              >
                <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 md:px-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-800">
                        {provider.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Facility Code: {provider.facilityCode || "-"} • ID:{" "}
                        {provider.id}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ProviderTypeBadge type={provider.type} />
                      <Badge
                        variant={provider.isActive ? "success" : "default"}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 md:px-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Practitioner List
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      {practitioners.length} total
                    </p>
                  </div>

                  {practitioners.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No practitioners synced for this provider yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[560px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-white">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Practitioner
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Code
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Active
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {practitioners.map((practitioner) => (
                            <tr
                              key={`${provider.id}-${practitioner.code}`}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-4 py-3 text-sm text-slate-800">
                                {practitioner.display}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {practitioner.code}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    practitioner.active ? "success" : "default"
                                  }
                                >
                                  {practitioner.active ? "Yes" : "No"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
