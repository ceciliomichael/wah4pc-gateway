"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PractitionerDirectory } from "@/components/practitioners/practitioner-directory";
import { providerApi } from "@/lib/api";
import type { Provider } from "@/types";
import { LuCircleAlert, LuLoaderCircle } from "react-icons/lu";

function PractitionersPageContent() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderDirectory = useCallback(async () => {
    try {
      const data = await providerApi.getAllWithPractitioners();
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load practitioner directory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviderDirectory();
  }, [fetchProviderDirectory]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LuLoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Practitioner Directory</h1>
        <p className="text-sm text-slate-500">
          View providers, facility details, and synced practitioner lists in one screen.
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-600">
          <LuCircleAlert className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <PractitionerDirectory providers={providers} />
      )}
    </div>
  );
}

export default function PractitionersPage() {
  return (
    <AuthGuard allowedRoles={["admin", "user"]}>
      <DashboardShell>
        <PractitionersPageContent />
      </DashboardShell>
    </AuthGuard>
  );
}
