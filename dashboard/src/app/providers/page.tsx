"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { providerApi } from "@/lib/api";
import type { Provider } from "@/types";
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuLoaderCircle,
  LuCircleAlert,
  LuBuilding2,
  LuExternalLink,
  LuEllipsisVertical,
  LuPower,
  LuPowerOff,
} from "react-icons/lu";
import { ProviderDialog } from "@/components/providers/provider-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProviderTypeBadge, Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";

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

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setDialogOpen(true);
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

      {/* Providers Table */}
      <Card padding="none">
        {providers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
              <LuBuilding2 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No providers registered yet</p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first provider
            </button>
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Base URL
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{provider.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{provider.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ProviderTypeBadge type={provider.type} />
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={provider.baseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <span className="truncate max-w-xs">{provider.baseUrl}</span>
                        <LuExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(provider)}
                        title={provider.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        <Badge
                          variant={provider.isActive ? "success" : "default"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {provider.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <Dropdown
                          trigger={
                            <button
                              type="button"
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <LuEllipsisVertical className="w-4 h-4" />
                            </button>
                          }
                          align="end"
                        >
                          <DropdownMenu>
                            <DropdownItem
                              icon={<LuPencil className="w-4 h-4" />}
                              onClick={() => handleEdit(provider)}
                            >
                              Edit Provider
                            </DropdownItem>
                            <DropdownItem
                              icon={
                                provider.isActive ? (
                                  <LuPowerOff className="w-4 h-4" />
                                ) : (
                                  <LuPower className="w-4 h-4" />
                                )
                              }
                              onClick={() => handleToggleActive(provider)}
                            >
                              {provider.isActive ? "Deactivate" : "Activate"}
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem
                              icon={<LuTrash2 className="w-4 h-4" />}
                              variant="destructive"
                              onClick={() => handleDeleteClick(provider)}
                            >
                              Delete Provider
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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