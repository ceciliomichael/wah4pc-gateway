"use client";

import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuCircleAlert, LuCopy, LuKey } from "react-icons/lu";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { apiKeyApi } from "@/lib/api";
import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyRole,
  Provider,
} from "@/types";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

interface CreateApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (createdKey: ApiKeyCreateResponse) => void | Promise<void>;
  providers: Provider[];
  title?: string;
  submitLabel?: string;
  successHint?: string;
  initialValues?: Partial<ApiKeyCreateRequest>;
}

interface ApiKeyFormErrors {
  owner?: string;
  role?: string;
  providerId?: string;
  rateLimit?: string;
}

export function CreateApiKeyDialog({
  open,
  onClose,
  onSuccess,
  providers,
  title,
  submitLabel,
  successHint,
  initialValues,
}: CreateApiKeyDialogProps) {
  const initialFormData = useMemo<ApiKeyCreateRequest>(
    () => ({
      owner: initialValues?.owner ?? "",
      role: initialValues?.role ?? "user",
      providerId: initialValues?.providerId ?? "",
      rateLimit: initialValues?.rateLimit ?? 100,
    }),
    [initialValues],
  );

  const [formData, setFormData] =
    useState<ApiKeyCreateRequest>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiKeyFormErrors>({});
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setError(null);
    setFieldErrors({});
    setCreatedKey(null);
    setCopied(false);
  };

  const dialogTitle = title ?? "Generate API Key";
  const actionLabel = submitLabel ?? "Generate Key";

  useEffect(() => {
    if (!open || createdKey) {
      return;
    }
    setFormData(initialFormData);
    setError(null);
    setFieldErrors({});
  }, [open, createdKey, initialFormData]);

  const validateForm = (): boolean => {
    const nextErrors: ApiKeyFormErrors = {};
    const owner = formData.owner.trim();
    const rateLimit = formData.rateLimit ?? 0;

    if (!owner) {
      nextErrors.owner = "Owner name is required";
    }
    if (!formData.role) {
      nextErrors.role = "Role is required";
    }
    if (formData.role === "user" && !formData.providerId) {
      nextErrors.providerId = "Provider is required for user role keys";
    }
    if (!Number.isInteger(rateLimit) || rateLimit < 0 || rateLimit > 10000) {
      nextErrors.rateLimit =
        "Rate limit must be a whole number between 0 and 10000";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (!createdKey) {
      resetForm();
      onClose();
    }
  };

  const handleSuccess = async () => {
    if (!createdKey) return;
    setIsFinalizing(true);
    try {
      await onSuccess(createdKey);
      resetForm();
    } finally {
      setIsFinalizing(false);
    }
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ApiKeyCreateRequest = {
        owner: formData.owner.trim(),
        role: formData.role,
        rateLimit: formData.rateLimit ?? 0,
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

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as ApiKeyRole,
      providerId: value === "admin" ? "" : prev.providerId,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      role: undefined,
      providerId: undefined,
    }));
    setError(null);
  };

  const handleProviderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, providerId: value }));
    setFieldErrors((prev) => ({ ...prev, providerId: undefined }));
    setError(null);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader
        onClose={handleClose}
        showCloseButton={!createdKey && !isSubmitting}
      >
        <DialogTitle>
          {createdKey ? "API Key Created" : dialogTitle}
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
              {successHint ??
                "Your API key has been created successfully. Make sure to copy it now - you won't be able to see it again!"}
            </p>
          </div>

          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">
              Your API Key
            </p>
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
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
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
                {createdKey.rateLimit === 0
                  ? "Unlimited"
                  : `${createdKey.rateLimit} req/s`}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Prefix</p>
              <code className="font-mono text-slate-800">
                {createdKey.prefix}
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSuccess} isLoading={isFinalizing}>
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
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, owner: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, owner: undefined }));
                setError(null);
              }}
              placeholder="e.g., Integration Service"
              disabled={isSubmitting}
              required
              error={fieldErrors.owner}
            />

            {/* Role */}
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              options={ROLE_OPTIONS}
              hint={
                formData.role === "admin"
                  ? "Admin keys have full access to all resources"
                  : "User keys are scoped to a specific provider"
              }
              disabled={isSubmitting}
              required
              error={fieldErrors.role}
            />

            {/* Provider (only for user role) */}
            {formData.role === "user" && (
              <div>
                <Select
                  label="Provider"
                  name="providerId"
                  value={formData.providerId || ""}
                  onChange={handleProviderChange}
                  options={providerOptions}
                  disabled={isSubmitting}
                  required
                  error={fieldErrors.providerId}
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
              value={formData.rateLimit ?? 0}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                setFormData((prev) => ({
                  ...prev,
                  rateLimit: Number.isNaN(parsed) ? 0 : parsed,
                }));
                setFieldErrors((prev) => ({ ...prev, rateLimit: undefined }));
                setError(null);
              }}
              hint="Set to 0 for unlimited requests"
              disabled={isSubmitting}
              required
              error={fieldErrors.rateLimit}
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
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}
