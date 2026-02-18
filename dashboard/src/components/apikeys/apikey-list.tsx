"use client";

import {
  LuCheck,
  LuCopy,
  LuEllipsisVertical,
  LuKey,
  LuRefreshCw,
  LuShieldOff,
  LuTrash2,
} from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import type { ApiKey, Provider } from "@/types";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  providers: Provider[];
  copiedId: string | null;
  onCopy: (prefix: string, id: string) => void;
  onRotate: (key: ApiKey) => void;
  onRevoke: (key: ApiKey) => void;
  onDelete: (key: ApiKey) => void;
  onCreate: () => void;
}

function ApiKeyCard({
  apiKey,
  providers,
  copiedId,
  onCopy,
  onRotate,
  onRevoke,
  onDelete,
}: {
  apiKey: ApiKey;
  providers: Provider[];
  copiedId: string | null;
  onCopy: (prefix: string, id: string) => void;
  onRotate: (key: ApiKey) => void;
  onRevoke: (key: ApiKey) => void;
  onDelete: (key: ApiKey) => void;
}) {
  const getProviderName = (providerId?: string) => {
    if (!providerId) return "-";
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || `${providerId.slice(0, 8)}...`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: Key Prefix and Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                {apiKey.prefix}...
              </code>
              <button
                type="button"
                onClick={() => onCopy(apiKey.prefix, apiKey.id)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy prefix"
              >
                {copiedId === apiKey.id ? (
                  <LuCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <LuCopy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Owner: {apiKey.owner}</p>
          </div>
          <Dropdown
            trigger={
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <LuEllipsisVertical className="w-4 h-4" />
              </button>
            }
            align="end"
          >
            <DropdownMenu>
              <DropdownItem
                icon={<LuCopy className="w-4 h-4" />}
                onClick={() => onCopy(apiKey.prefix, apiKey.id)}
              >
                Copy Prefix
              </DropdownItem>
              {apiKey.isActive && (
                <DropdownItem
                  icon={<LuRefreshCw className="w-4 h-4" />}
                  onClick={() => onRotate(apiKey)}
                >
                  Rotate Key
                </DropdownItem>
              )}
              {apiKey.isActive && (
                <DropdownItem
                  icon={<LuShieldOff className="w-4 h-4" />}
                  onClick={() => onRevoke(apiKey)}
                >
                  Revoke Key
                </DropdownItem>
              )}
              <DropdownSeparator />
              <DropdownItem
                icon={<LuTrash2 className="w-4 h-4" />}
                variant="destructive"
                onClick={() => onDelete(apiKey)}
              >
                Delete Key
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Role and Status Badges */}
        <div className="flex items-center gap-2">
          <Badge variant={apiKey.role === "admin" ? "primary" : "info"}>
            {apiKey.role}
          </Badge>
          <Badge variant={apiKey.isActive ? "success" : "error"}>
            {apiKey.isActive ? "Active" : "Revoked"}
          </Badge>
        </div>

        {/* Provider and Created Date */}
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Provider
            </p>
            <p className="text-sm text-slate-700">
              {getProviderName(apiKey.providerId)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Created
            </p>
            <p className="text-sm text-slate-700">
              {formatDate(apiKey.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ApiKeyList({
  apiKeys,
  providers,
  copiedId,
  onCopy,
  onRotate,
  onRevoke,
  onDelete,
  onCreate,
}: ApiKeyListProps) {
  const getProviderName = (providerId?: string) => {
    if (!providerId) return "-";
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || `${providerId.slice(0, 8)}...`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Empty state
  if (apiKeys.length === 0) {
    return (
      <Card padding="none">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
            <LuKey className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">No API keys created yet</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Generate your first key
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <Card padding="none" className="hidden md:block">
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
                <tr
                  key={key.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {key.prefix}...
                      </code>
                      <button
                        type="button"
                        onClick={() => onCopy(key.prefix, key.id)}
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
                            onClick={() => onCopy(key.prefix, key.id)}
                          >
                            Copy Prefix
                          </DropdownItem>
                          {key.isActive && (
                            <DropdownItem
                              icon={<LuRefreshCw className="w-4 h-4" />}
                              onClick={() => onRotate(key)}
                            >
                              Rotate Key
                            </DropdownItem>
                          )}
                          {key.isActive && (
                            <DropdownItem
                              icon={<LuShieldOff className="w-4 h-4" />}
                              onClick={() => onRevoke(key)}
                            >
                              Revoke Key
                            </DropdownItem>
                          )}
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<LuTrash2 className="w-4 h-4" />}
                            variant="destructive"
                            onClick={() => onDelete(key)}
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
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {apiKeys.map((key) => (
          <ApiKeyCard
            key={key.id}
            apiKey={key}
            providers={providers}
            copiedId={copiedId}
            onCopy={onCopy}
            onRotate={onRotate}
            onRevoke={onRevoke}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}
