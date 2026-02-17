"use client";

import type { Provider } from "@/types";
import { Card } from "@/components/ui/card";
import { ProviderTypeBadge, Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  LuBuilding2,
  LuExternalLink,
  LuEllipsisVertical,
  LuPencil,
  LuPower,
  LuPowerOff,
  LuTrash2,
} from "react-icons/lu";

interface ProviderListProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onToggleActive: (provider: Provider) => void;
  onCreate: () => void;
}

function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onToggleActive: (provider: Provider) => void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: Name and Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-800 truncate">{provider.name}</h3>
            <CopyButton value={provider.id} label="Provider ID" />
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
                icon={<LuPencil className="w-4 h-4" />}
                onClick={() => onEdit(provider)}
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
                onClick={() => onToggleActive(provider)}
              >
                {provider.isActive ? "Deactivate" : "Activate"}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                icon={<LuTrash2 className="w-4 h-4" />}
                variant="destructive"
                onClick={() => onDelete(provider)}
              >
                Delete Provider
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Type Badge */}
        <div>
          <ProviderTypeBadge type={provider.type} />
        </div>

        {/* Base URL */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Facility Code</p>
          <p className="text-sm text-slate-700 break-all">{provider.facilityCode || "-"}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
          <p className="text-sm text-slate-700 break-all">{provider.location || "-"}</p>
        </div>

        {/* Base URL */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Base URL</p>
          <a
            href={provider.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 break-all"
          >
            <span>{provider.baseUrl}</span>
            <LuExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
          <button
            type="button"
            onClick={() => onToggleActive(provider)}
            title={provider.isActive ? "Click to deactivate" : "Click to activate"}
          >
            <Badge
              variant={provider.isActive ? "success" : "default"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
          </button>
        </div>
      </div>
    </Card>
  );
}

export function ProviderList({
  providers,
  onEdit,
  onDelete,
  onToggleActive,
  onCreate,
}: ProviderListProps) {
  // Empty state
  if (providers.length === 0) {
    return (
      <Card padding="none">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
            <LuBuilding2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">No providers registered yet</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first provider
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
                  Provider
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Facility Code
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
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
                      <CopyButton value={provider.id} label="Provider ID" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ProviderTypeBadge type={provider.type} />
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">{provider.facilityCode || "-"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">{provider.location || "-"}</p>
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
                      onClick={() => onToggleActive(provider)}
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
                            onClick={() => onEdit(provider)}
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
                            onClick={() => onToggleActive(provider)}
                          >
                            {provider.isActive ? "Deactivate" : "Activate"}
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<LuTrash2 className="w-4 h-4" />}
                            variant="destructive"
                            onClick={() => onDelete(provider)}
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
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>
    </>
  );
}
