"use client";

import { useState } from "react";
import { apiKeyApi } from "@/lib/api";
import type { Provider, ApiKeyRole, ApiKeyCreateRequest, ApiKeyCreateResponse } from "@/types";
import { LuCircleAlert, LuCopy, LuCheck, LuKey } from "react-icons/lu";
import { clsx } from "clsx";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

interface CreateApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  providers: Provider[];
}

export function CreateApiKeyDialog({
  open,
  onClose,
  onSuccess,
  providers,
}: CreateApiKeyDialogProps) {
  const [formData, setFormData] = useState<ApiKeyCreateRequest>({
    owner: "",
    role: "user",
    providerId: "",
    rateLimit: 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFormData({
      owner: "",
      role: "user",
      providerId: "",
      rateLimit: 100,
    });
    setError(null);
    setCreatedKey(null);
    setCopied(false);
  };

  const handleClose = () => {
    if (!createdKey) {
      resetForm();
      onClose();
    }
  };

  const handleSuccess = () => {
    resetForm();
    onSuccess();
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.owner.trim()) {
      setError("Owner name is required");
      return;
    }

    // User role requires a provider
    if (formData.role === "user" && !formData.providerId) {
      setError("Provider is required for user role keys");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ApiKeyCreateRequest = {
        owner: formData.owner.trim(),
        role: formData.role,
        rateLimit: formData.rateLimit,
      };

      // Only include providerId for user role
      if (formData.role === "user" && formData.providerId) {
        payload.providerId = formData.providerId;
      }

      const response = await apiKeyApi.create(payload);
      setCreatedKey(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build provider options
  const providerOptions: SelectOption[] = [
    { value: "", label: "Select a provider...", disabled: true },
    ...providers.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader onClose={handleClose} showCloseButton={!createdKey && !isSubmitting}>
        <DialogTitle>
          {createdKey ? "API Key Created" : "Generate API Key"}
        </DialogTitle>
      </DialogHeader>

      {createdKey ? (
        // Success state - show the key
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="p-2 rounded-lg bg-green-100">
              <LuKey className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-green-700">
              Your API key has been created successfully. Make sure to copy it now - you won't be able to see it again!
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-slate-100 rounded-lg text-sm font-mono text-slate-800 break-all">
                {createdKey.key}
              </code>
              <button
                type="button"
                onClick={handleCopyKey}
                className={clsx(
                  "p-3 rounded-lg transition-colors",
                  copied
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                title="Copy to clipboard"
              >
                {copied ? (
                  <LuCheck className="w-5 h-5" />
                ) : (
                  <LuCopy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Owner</p>
              <p className="font-medium text-slate-800">{createdKey.owner}</p>
            </div>
            <div>
              <p className="text-slate-500">Role</p>
              <Badge variant={createdKey.role === "admin" ? "primary" : "info"}>
                {createdKey.role}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500">Rate Limit</p>
              <p className="font-medium text-slate-800">
                {createdKey.rateLimit === 0 ? "Unlimited" : `${createdKey.rateLimit} req/s`}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Prefix</p>
              <code className="font-mono text-slate-800">{createdKey.prefix}</code>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSuccess}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        // Form state
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg">
                <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Owner */}
            <Input
              label="Owner Name"
              name="owner"
              type="text"
              value={formData.owner}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, owner: e.target.value }))
              }
              placeholder="e.g., Integration Service"
              disabled={isSubmitting}
            />

            {/* Role */}
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as ApiKeyRole,
                  // Clear provider if switching to admin
                  providerId: value === "admin" ? "" : prev.providerId,
                }))
              }
              options={ROLE_OPTIONS}
              hint={
                formData.role === "admin"
                  ? "Admin keys have full access to all resources"
                  : "User keys are scoped to a specific provider"
              }
              disabled={isSubmitting}
            />

            {/* Provider (only for user role) */}
            {formData.role === "user" && (
              <div>
                <Select
                  label="Provider"
                  name="providerId"
                  value={formData.providerId || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, providerId: value }))
                  }
                  options={providerOptions}
                  disabled={isSubmitting}
                />
                {providers.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No providers available. Create a provider first.
                  </p>
                )}
              </div>
            )}

            {/* Rate Limit */}
            <Input
              label="Rate Limit (requests/second)"
              name="rateLimit"
              type="number"
              min={0}
              max={10000}
              value={formData.rateLimit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rateLimit: parseInt(e.target.value, 10) || 0,
                }))
              }
              hint="Set to 0 for unlimited requests"
              disabled={isSubmitting}
            />
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Generate Key
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}