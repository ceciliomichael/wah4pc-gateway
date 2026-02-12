"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/lib/api";
import { SystemSettings } from "@/types";
import { LuSave, LuShieldAlert, LuShieldCheck } from "react-icons/lu";

function SettingsContent() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await settingsApi.update(settings);
      setSuccessMessage("Settings saved successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Validation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  FHIR Schema Validation
                </h3>
                {settings?.validatorDisabled ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <LuShieldAlert className="w-3 h-3 mr-1" />
                    Disabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <LuShieldCheck className="w-3 h-3 mr-1" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 max-w-xl">
                When enabled, all incoming FHIR resources (push and response) are validated against the Philippine Core profiles using the remote validation service. Disabling this may improve performance but increases the risk of invalid data.
              </p>
            </div>
            
            <Switch
              checked={!settings?.validatorDisabled}
              onCheckedChange={(checked) => 
                setSettings(settings ? { ...settings, validatorDisabled: !checked } : null)
              }
              label={!settings?.validatorDisabled ? "Enabled" : "Disabled"}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={handleSave} 
              isLoading={isSaving}
              leftIcon={<LuSave className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardShell>
        <SettingsContent />
      </DashboardShell>
    </AuthGuard>
  );
}