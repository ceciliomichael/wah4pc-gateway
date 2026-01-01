"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { apiKeyApi, providerApi } from "@/lib/api";
import type { ApiKey, Provider } from "@/types";
import {
  LuPlus,
  LuTrash2,
  LuLoaderCircle,
  LuCircleAlert,
  LuKey,
  LuCopy,
  LuCheck,
  LuShieldOff,
  LuEllipsisVertical,
} from "react-icons/lu";
import { CreateApiKeyDialog } from "@/components/apikeys/create-key-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";

function ApiKeysContent() {
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

      {/* API Keys Table */}
      <Card padding="none">
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
              <LuKey className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No API keys created yet</p>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Generate your first key
            </button>
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {key.prefix}...
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyPrefix(key.prefix, key.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy prefix"
                        >
                          {copiedId === key.id ? (
                            <LuCheck className="w-4 h-4 text-green-600" />
                          ) : (
                            <LuCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-800">{key.owner}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={key.role === "admin" ? "primary" : "info"}>
                        {key.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {getProviderName(key.providerId)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={key.isActive ? "success" : "error"}>
                        {key.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(key.createdAt)}
                      </span>
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
                              icon={<LuCopy className="w-4 h-4" />}
                              onClick={() => handleCopyPrefix(key.prefix, key.id)}
                            >
                              Copy Prefix
                            </DropdownItem>
                            {key.isActive && (
                              <DropdownItem
                                icon={<LuShieldOff className="w-4 h-4" />}
                                onClick={() => handleRevokeClick(key)}
                              >
                                Revoke Key
                              </DropdownItem>
                            )}
                            <DropdownSeparator />
                            <DropdownItem
                              icon={<LuTrash2 className="w-4 h-4" />}
                              variant="destructive"
                              onClick={() => handleDeleteClick(key)}
                            >
                              Delete Key
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
      {apiKeys.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          {apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""} registered
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