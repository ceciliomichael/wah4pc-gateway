"use client";

import { useState, useEffect } from "react";
import { providerApi } from "@/lib/api";
import type { Provider, ProviderType, ProviderCreateRequest } from "@/types";
import { LuCircleAlert } from "react-icons/lu";

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

const PROVIDER_TYPE_OPTIONS: SelectOption[] = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "laboratory", label: "Laboratory" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "imaging", label: "Imaging Center" },
  { value: "other", label: "Other" },
];

interface ProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider: Provider | null;
}

export function ProviderDialog({
  open,
  onClose,
  onSuccess,
  provider,
}: ProviderDialogProps) {
  const isEditing = !!provider;

  const [formData, setFormData] = useState<ProviderCreateRequest>({
    name: "",
    type: "hospital",
    baseUrl: "",
    gatewayAuthKey: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or provider changes
  useEffect(() => {
    if (open) {
      if (provider) {
        setFormData({
          name: provider.name,
          type: provider.type,
          baseUrl: provider.baseUrl,
          gatewayAuthKey: provider.gatewayAuthKey || "",
        });
      } else {
        setFormData({
          name: "",
          type: "hospital",
          baseUrl: "",
          gatewayAuthKey: "",
        });
      }
      setError(null);
    }
  }, [open, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Provider name is required");
      return;
    }
    if (!formData.baseUrl.trim()) {
      setError("Base URL is required");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.baseUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && provider) {
        await providerApi.update(provider.id, formData);
      } else {
        await providerApi.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader onClose={handleClose} showCloseButton={!isSubmitting}>
        <DialogTitle>
          {isEditing ? "Edit Provider" : "Add Provider"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg">
              <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Provider Name */}
          <Input
            label="Provider Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., City General Hospital"
            disabled={isSubmitting}
          />

          {/* Provider Type */}
          <Select
            label="Provider Type"
            name="type"
            value={formData.type}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                type: value as ProviderType,
              }))
            }
            options={PROVIDER_TYPE_OPTIONS}
            disabled={isSubmitting}
          />

          {/* Base URL - Fixed hint! */}
          <Input
            label="Base URL"
            name="baseUrl"
            type="url"
            value={formData.baseUrl}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))
            }
            placeholder="https://api.hospital.com"
            hint="The exact base URL of the provider's server (e.g., https://api.hospital.com)"
            disabled={isSubmitting}
          />

          {/* Gateway Auth Key */}
          <Input
            label="Gateway Auth Key"
            name="gatewayAuthKey"
            type="password"
            value={formData.gatewayAuthKey}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, gatewayAuthKey: e.target.value }))
            }
            placeholder="Enter a secret key"
            hint="The secret key your provider system will verify in the X-Gateway-Auth header"
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
            {isEditing ? "Save Changes" : "Add Provider"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}