"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { providerApi } from "@/lib/api";
import type { Provider } from "@/types";
import { LuPlus, LuLoaderCircle, LuCircleAlert } from "react-icons/lu";
import { ProviderDialog } from "@/components/providers/provider-dialog";
import { ProviderList } from "@/components/providers/provider-list";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Button } from "@/components/ui/button";

function ProvidersContent() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const data = await providerApi.getAll();
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCreate = () => {
    setEditingProvider(null);
    setDialogOpen(true);
  };

  const handleEdit = async (provider: Provider) => {
    try {
      const fullProvider = await providerApi.getById(provider.id);
      setEditingProvider(fullProvider);
      setDialogOpen(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load provider details");
    }
  };

  const handleDeleteClick = (provider: Provider) => {
    setDeletingProvider(provider);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (provider: Provider) => {
    try {
      await providerApi.setActive(provider.id, !provider.isActive);
      fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update provider status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProvider) return;

    setIsDeleting(true);
    try {
      await providerApi.delete(deletingProvider.id);
      setDeleteDialogOpen(false);
      setDeletingProvider(null);
      fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProvider(null);
  };

  const handleDialogSuccess = () => {
    handleDialogClose();
    fetchProviders();
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
          Manage healthcare providers connected to the gateway
        </p>
        <Button
          onClick={handleCreate}
          leftIcon={<LuPlus className="w-4 h-4" />}
        >
          Add Provider
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <LuCircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Providers List */}
      <ProviderList
        providers={providers}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleActive={handleToggleActive}
        onCreate={handleCreate}
      />

      {/* Summary */}
      {providers.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          {providers.length} provider{providers.length !== 1 ? "s" : ""} registered
        </div>
      )}

      {/* Provider Dialog */}
      <ProviderDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        provider={editingProvider}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Provider"
        message={`Are you sure you want to delete "${deletingProvider?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <ProvidersContent />
      </DashboardShell>
    </AuthGuard>
  );
}
