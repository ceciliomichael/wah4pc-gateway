"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { providerApi } from "@/lib/api";
import type { Provider } from "@/types";
import { LuPlus, LuLoaderCircle, LuCircleAlert, LuSearch } from "react-icons/lu";
import { ProviderDialog } from "@/components/providers/provider-dialog";
import { ProviderList } from "@/components/providers/provider-list";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function ProvidersContent() {
  const ITEMS_PER_PAGE = 20;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccessDialogOpen, setSaveSuccessDialogOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
    const message = editingProvider
      ? "Provider changes were saved successfully."
      : "Provider was added successfully.";
    handleDialogClose();
    setSaveSuccessMessage(message);
    setSaveSuccessDialogOpen(true);
    fetchProviders();
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProviders = providers.filter((provider) => {
    if (!normalizedQuery) return true;
    const statusText = provider.isActive ? "active" : "inactive";
    return (
      provider.id.toLowerCase().includes(normalizedQuery) ||
      provider.name.toLowerCase().includes(normalizedQuery) ||
      provider.type.toLowerCase().includes(normalizedQuery) ||
      (provider.facilityCode || "").toLowerCase().includes(normalizedQuery) ||
      (provider.location || "").toLowerCase().includes(normalizedQuery) ||
      provider.baseUrl.toLowerCase().includes(normalizedQuery) ||
      statusText.includes(normalizedQuery)
    );
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProviders.length / ITEMS_PER_PAGE)
  );
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

      <Input
        type="text"
        placeholder="Search by ID, name, type, facility, location, URL..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<LuSearch className="w-4 h-4" />}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <LuCircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Providers List */}
      {providers.length === 0 ? (
        <ProviderList
          providers={providers}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleActive={handleToggleActive}
          onCreate={handleCreate}
        />
      ) : filteredProviders.length > 0 ? (
        <ProviderList
          providers={paginatedProviders}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleActive={handleToggleActive}
          onCreate={handleCreate}
        />
      ) : (
        <Card padding="none">
          <div className="p-10 text-center text-slate-500">
            No providers matched your search
          </div>
        </Card>
      )}

      {/* Summary */}
      {providers.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredProviders.length)} of{" "}
          {filteredProviders.length} provider
          {providers.length !== 1 ? "s" : ""}
        </div>
      )}

      {filteredProviders.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 sm:gap-3">
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
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
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

      <SuccessDialog
        open={saveSuccessDialogOpen}
        onClose={() => setSaveSuccessDialogOpen(false)}
        title="Saved Successfully"
        message={saveSuccessMessage}
      />
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardShell>
        <ProvidersContent />
      </DashboardShell>
    </AuthGuard>
  );
}
