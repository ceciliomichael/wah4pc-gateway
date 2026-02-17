"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { apiKeyApi, providerApi } from "@/lib/api";
import type { ApiKey, Provider } from "@/types";
import { LuPlus, LuLoaderCircle, LuCircleAlert } from "react-icons/lu";
import { CreateApiKeyDialog } from "@/components/apikeys/create-key-dialog";
import { ApiKeyList } from "@/components/apikeys/apikey-list";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Button } from "@/components/ui/button";

function ApiKeysContent() {
  const ITEMS_PER_PAGE = 20;

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [deleteSuccessDialogOpen, setDeleteSuccessDialogOpen] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [keysData, providersData] = await Promise.all([
        apiKeyApi.getAll(),
        providerApi.getAll(),
      ]);
      setApiKeys(keysData);
      setProviders(providersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyPrefix = async (prefix: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prefix);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleDeleteClick = (key: ApiKey) => {
    setDeletingKey(key);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingKey) return;

    setIsDeleting(true);
    try {
      await apiKeyApi.delete(deletingKey.id);
      setDeleteDialogOpen(false);
      setDeletingKey(null);
      setDeleteSuccessMessage("API key was deleted successfully.");
      setDeleteSuccessDialogOpen(true);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevokeClick = (key: ApiKey) => {
    setRevokingKey(key);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokingKey) return;

    setIsRevoking(true);
    try {
      await apiKeyApi.revoke(revokingKey.id);
      setRevokeDialogOpen(false);
      setRevokingKey(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setIsRevoking(false);
    }
  };

  const getProviderName = (providerId?: string) => {
    if (!providerId) return "-";
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || providerId.slice(0, 8) + "...";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalPages = Math.max(1, Math.ceil(apiKeys.length / ITEMS_PER_PAGE));
  const paginatedApiKeys = apiKeys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          Manage API keys for authentication and access control
        </p>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          leftIcon={<LuPlus className="w-4 h-4" />}
        >
          Generate Key
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <LuCircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* API Keys List */}
      <ApiKeyList
        apiKeys={paginatedApiKeys}
        providers={providers}
        copiedId={copiedId}
        onCopy={handleCopyPrefix}
        onRevoke={handleRevokeClick}
        onDelete={handleDeleteClick}
        onCreate={() => setCreateDialogOpen(true)}
      />

      {/* Summary */}
      {apiKeys.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {Math.min(currentPage * ITEMS_PER_PAGE, apiKeys.length)} of{" "}
          {apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""} registered
        </div>
      )}

      {apiKeys.length > ITEMS_PER_PAGE && (
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

      {/* Create API Key Dialog */}
      <CreateApiKeyDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchData();
        }}
        providers={providers}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete API Key"
        message={`Are you sure you want to delete the API key "${deletingKey?.prefix}..."? This action cannot be undone.`}
      />

      {/* Revoke Confirmation Dialog */}
      <DeleteConfirmDialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        onConfirm={handleRevokeConfirm}
        isDeleting={isRevoking}
        title="Revoke API Key"
        message={`Are you sure you want to revoke the API key "${revokingKey?.prefix}..."? The key will no longer be usable for authentication.`}
      />

      <SuccessDialog
        open={deleteSuccessDialogOpen}
        onClose={() => setDeleteSuccessDialogOpen(false)}
        title="Deleted"
        message={deleteSuccessMessage}
      />

    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <ApiKeysContent />
      </DashboardShell>
    </AuthGuard>
  );
}
