'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LuX, LuSend, LuLoader } from 'react-icons/lu';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
}

const IDENTIFIER_SYSTEMS = [
  { value: 'http://philhealth.gov.ph', label: 'PhilHealth ID' },
  { value: 'http://psa.gov.ph/birth-certificate', label: 'PSA Birth Certificate' },
  { value: 'http://hl7.org/fhir/sid/passport', label: 'Passport Number' },
  { value: 'custom', label: 'Custom System...' },
];

interface FormData {
  targetId: string;
  identifierSystem: string;
  customSystem: string;
  identifierValue: string;
  reason: string;
}

const initialFormData: FormData = {
  targetId: '',
  identifierSystem: 'http://philhealth.gov.ph',
  customSystem: '',
  identifierValue: '',
  reason: '',
};

export function RequestModal({ isOpen, onClose, onSuccess }: RequestModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Provider list state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  // Fetch providers when modal opens
  const fetchProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);

    try {
      const response = await fetch('/api/integration/providers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch providers');
      }

      setProviders(data.providers || []);
      
      // Auto-select first provider if available and none selected
      if (data.providers?.length > 0 && !formData.targetId) {
        setFormData((prev) => ({ ...prev, targetId: data.providers[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setProvidersError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setProvidersLoading(false);
    }
  }, [formData.targetId]);

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen, fetchProviders]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.targetId.trim()) {
      setError('Target Provider ID is required');
      return;
    }

    if (!formData.identifierValue.trim()) {
      setError('Identifier value is required');
      return;
    }

    const system =
      formData.identifierSystem === 'custom'
        ? formData.customSystem
        : formData.identifierSystem;

    if (!system.trim()) {
      setError('Identifier system is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/fhir/request/Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: formData.targetId.trim(),
          identifiers: [{ system, value: formData.identifierValue.trim() }],
          reason: formData.reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send request');
      }

      // Success - reset form and close
      setFormData(initialFormData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormData);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Request Patient Data</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Target Provider Selection */}
          {providersLoading ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Target Provider <span className="text-red-500">*</span>
              </label>
              <div className="h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 flex items-center gap-2 text-slate-500 text-sm">
                <LuLoader className="w-4 h-4 animate-spin" />
                Loading providers...
              </div>
            </div>
          ) : providersError ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Target Provider <span className="text-red-500">*</span>
              </label>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                {providersError}
                <button
                  type="button"
                  onClick={fetchProviders}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
              <Input
                placeholder="Enter provider UUID manually"
                value={formData.targetId}
                onChange={(e) => handleChange('targetId', e.target.value)}
                required
              />
            </div>
          ) : providers.length === 0 ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Target Provider <span className="text-red-500">*</span>
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                No other providers registered yet
              </div>
            </div>
          ) : (
            <Select
              label="Target Provider"
              options={providers.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.type})`,
              }))}
              value={formData.targetId}
              onChange={(e) => handleChange('targetId', e.target.value)}
              required
              hint="Select the provider you want to request data from"
            />
          )}

          <Select
            label="Identifier System"
            options={IDENTIFIER_SYSTEMS}
            value={formData.identifierSystem}
            onChange={(e) => handleChange('identifierSystem', e.target.value)}
            required
          />

          {formData.identifierSystem === 'custom' && (
            <Input
              label="Custom System URL"
              placeholder="e.g., http://hospital.com/mrn"
              value={formData.customSystem}
              onChange={(e) => handleChange('customSystem', e.target.value)}
              required
            />
          )}

          <Input
            label="Identifier Value"
            placeholder="e.g., 12-345678901-2"
            value={formData.identifierValue}
            onChange={(e) => handleChange('identifierValue', e.target.value)}
            required
            hint="The patient's ID in the specified system"
          />

          <Input
            label="Reason (Optional)"
            placeholder="e.g., Referral consultation"
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex items-center gap-2"
            >
            {loading ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuSend className="w-4 h-4" />
              )}
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}