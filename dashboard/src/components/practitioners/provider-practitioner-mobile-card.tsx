"use client";

import { Badge, ProviderTypeBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Provider } from "@/types";

interface ProviderPractitionerMobileCardProps {
  provider: Provider;
}

export function ProviderPractitionerMobileCard({
  provider,
}: ProviderPractitionerMobileCardProps) {
  const practitioners = provider.practitionerList || [];

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-800">
              {provider.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              Facility Code: {provider.facilityCode || "-"}
            </p>
            <p className="truncate text-xs text-slate-500">ID: {provider.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProviderTypeBadge type={provider.type} />
            <Badge variant={provider.isActive ? "success" : "default"}>
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
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
          <div className="space-y-2">
            {practitioners.map((practitioner) => (
              <div
                key={`${provider.id}-${practitioner.code}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <p className="text-sm font-medium text-slate-800">
                  {practitioner.display}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Code: {practitioner.code}
                </p>
                <div className="mt-2">
                  <Badge variant={practitioner.active ? "success" : "default"}>
                    {practitioner.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
