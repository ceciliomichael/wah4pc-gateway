"use client";

import { Server, Users, FileText, Activity, Key, Webhook } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { AlertBlock } from "@/components/ui/alert-block";
import { JsonViewer } from "@/components/ui/json-viewer";
import { EndpointCard } from "@/components/ui/endpoint-card";
import { ErrorTable } from "@/components/ui/data-table";
import { endpoints, errorData, rateLimitingGuidelines, authenticationInfo } from "./data";
import { config } from "@/lib/config";

const iconMap = {
  Activity: <Activity className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Key: <Key className="h-5 w-5" />,
  Webhook: <Webhook className="h-5 w-5" />,
};

export default function ApiReferencePage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="API Reference"
        badgeColor="orange"
        title="API Reference"
        description="Complete documentation of all WAH4PC Gateway API endpoints. Use these endpoints to register providers, initiate FHIR transfers, and track transactions."
      />

      {/* Base URL */}
      <section id="base-url" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Base URL</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <code className="text-base text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
            {config.gatewayUrl}
          </code>
          <p className="mt-4 text-sm text-slate-600">
            Replace with your gateway instance URL in production.
          </p>
        </div>
      </section>

      {/* Authentication Note */}
      <section id="auth" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Authentication</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-lg">API Key Required</p>
              <p className="text-slate-600 mt-2 leading-relaxed">
                {authenticationInfo.description}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-3">
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Header Format</p>
            <code className="block text-sm bg-slate-900 text-slate-100 p-3 rounded-lg font-mono border border-slate-800 shadow-sm">
              {authenticationInfo.header}: YOUR_API_KEY_HERE
            </code>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Alternative:</span>
              <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                {authenticationInfo.alternativeHeader}
              </code>
            </p>
          </div>

          <AlertBlock type="info" title="Getting Started">
            Contact your system administrator to obtain an API key for accessing the gateway.
          </AlertBlock>
        </div>
      </section>

      {/* Endpoints by Category */}
      <section id="endpoints" className="mb-16">
        {endpoints.map((category) => (
          <div key={category.category} className="mb-12 last:mb-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shadow-sm">
                {iconMap[category.iconName]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{category.category}</h2>
                <p className="text-sm text-slate-500 font-medium">{category.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {category.items.map((endpoint, idx) => (
                <EndpointCard key={idx} {...endpoint} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Error Responses */}
      <section id="errors" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Error Responses</h2>
        <p className="mb-6 text-slate-600">
          All endpoints return consistent error responses in the following format:
        </p>

        <JsonViewer
          title="Standard Error Format"
          data={`{
  "error": "Error message describing what went wrong"
}`}
          className="mb-8 shadow-sm"
        />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <ErrorTable data={errorData} />
        </div>
      </section>

      {/* Rate Limiting */}
      <section id="rate-limiting" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Rate Limiting</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <p className="text-slate-600 mb-6 leading-relaxed">
            The gateway enforces per-API-key rate limiting to ensure fair usage and system stability.
            Each API key has a configurable rate limit set during creation.
          </p>
          <ul className="space-y-3 text-sm text-slate-600">
            {rateLimitingGuidelines.map((guideline) => (
              <li key={guideline} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">i</span>
                {guideline}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}