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

interface ProviderFormErrors {
  name?: string;
  type?: string;
  facilityCode?: string;
  location?: string;
  baseUrl?: string;
  gatewayAuthKey?: string;
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
    facilityCode: "",
    location: "",
    baseUrl: "",
    gatewayAuthKey: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProviderFormErrors>({});

  // Reset form when dialog opens/closes or provider changes
  useEffect(() => {
    if (open) {
      if (provider) {
        setFormData({
          name: provider.name,
          type: provider.type,
          facilityCode: provider.facilityCode || "",
          location: provider.location || "",
          baseUrl: provider.baseUrl,
          gatewayAuthKey: provider.gatewayAuthKey || "",
        });
      } else {
        setFormData({
          name: "",
          type: "hospital",
          facilityCode: "",
          location: "",
          baseUrl: "",
          gatewayAuthKey: "",
        });
      }
      setError(null);
      setFieldErrors({});
    }
  }, [open, provider]);

  const handleFieldChange = (
    key: keyof ProviderCreateRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as ProviderType,
    }));
    setFieldErrors((prev) => ({ ...prev, type: undefined }));
    setError(null);
  };

  const validateForm = (): boolean => {
    const nextErrors: ProviderFormErrors = {};
    const name = formData.name.trim();
    const facilityCode = formData.facilityCode.trim();
    const location = formData.location.trim();
    const baseUrl = formData.baseUrl.trim();
    const gatewayAuthKey = formData.gatewayAuthKey.trim();

    if (!name) {
      nextErrors.name = "Provider name is required";
    }
    if (!formData.type) {
      nextErrors.type = "Provider type is required";
    }
    if (!facilityCode) {
      nextErrors.facilityCode = "Facility code is required";
    }
    if (!location) {
      nextErrors.location = "Location is required";
    }
    if (!baseUrl) {
      nextErrors.baseUrl = "Base URL is required";
    } else {
      try {
        new URL(baseUrl);
      } catch {
        nextErrors.baseUrl = "Please enter a valid URL";
      }
    }
    if (!gatewayAuthKey) {
      nextErrors.gatewayAuthKey = "Gateway auth key is required";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProviderCreateRequest = {
        name: formData.name.trim(),
        type: formData.type,
        facilityCode: formData.facilityCode.trim(),
        location: formData.location.trim(),
        baseUrl: formData.baseUrl.trim(),
        gatewayAuthKey: formData.gatewayAuthKey.trim(),
      };
      if (isEditing && provider) {
        await providerApi.update(provider.id, payload);
      } else {
        await providerApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save provider";
      if (message.toLowerCase().includes("facility code")) {
        setFieldErrors((prev) => ({
          ...prev,
          facilityCode: "Facility code already exists",
        }));
      }
      setError(message);
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
            onChange={(e) => handleFieldChange("name", e.target.value)}
            placeholder="e.g., City General Hospital"
            disabled={isSubmitting}
            required
            error={fieldErrors.name}
          />

          <Input
            label="Facility Code"
            name="facilityCode"
            type="text"
            value={formData.facilityCode}
            onChange={(e) => handleFieldChange("facilityCode", e.target.value)}
            placeholder="e.g., HOSP-001"
            disabled={isSubmitting}
            required
            error={fieldErrors.facilityCode}
          />

          <Input
            label="Location"
            name="location"
            type="text"
            value={formData.location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
            placeholder="e.g., Quezon City"
            disabled={isSubmitting}
            required
            error={fieldErrors.location}
          />

          {/* Provider Type */}
          <Select
            label="Provider Type"
            name="type"
            value={formData.type}
            onChange={handleTypeChange}
            options={PROVIDER_TYPE_OPTIONS}
            disabled={isSubmitting}
            required
            error={fieldErrors.type}
          />

          {/* Base URL - Fixed hint! */}
          <Input
            label="Base URL"
            name="baseUrl"
            type="url"
            value={formData.baseUrl}
            onChange={(e) => handleFieldChange("baseUrl", e.target.value)}
            placeholder="https://api.hospital.com"
            hint="The exact base URL of the provider's server (e.g., https://api.hospital.com)"
            disabled={isSubmitting}
            required
            error={fieldErrors.baseUrl}
          />

          {/* Gateway Auth Key */}
          <Input
            label="Gateway Auth Key"
            name="gatewayAuthKey"
            type="password"
            value={formData.gatewayAuthKey}
            onChange={(e) => handleFieldChange("gatewayAuthKey", e.target.value)}
            placeholder="Enter a secret key"
            hint="The secret key your provider system will verify in the X-Gateway-Auth header"
            disabled={isSubmitting}
            required
            error={fieldErrors.gatewayAuthKey}
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
