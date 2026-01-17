"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Database, Check, Minus, Copy, ChevronDown, ChevronUp, ArrowLeft, ExternalLink } from "lucide-react";
import { getResourceBySlug, commonCodeSystems } from "../resources-data/index";
import type { FieldDefinition } from "../resources-data/index";
import { CopyPageButton } from "@/components/ui/copy-page-button";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
      type="button"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function RequiredBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
      <Check className="h-3 w-3" />
      Required
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
      <Minus className="h-3 w-3" />
      Optional
    </span>
  );
}

function BindingStrengthBadge({ strength }: { strength: string }) {
  const colors: Record<string, string> = {
    required: "bg-red-50 text-red-700 border-red-200",
    extensible: "bg-amber-50 text-amber-700 border-amber-200",
    preferred: "bg-blue-50 text-blue-700 border-blue-200",
    example: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${colors[strength] || colors.example}`}>
      {strength}
    </span>
  );
}

function FieldRow({ field }: { field: FieldDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = field.binding || field.pattern || field.referenceTarget;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div
        className={`flex items-start gap-4 p-4 ${hasDetails ? "cursor-pointer hover:bg-slate-50" : ""}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
        onKeyDown={(e) => e.key === "Enter" && hasDetails && setExpanded(!expanded)}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {field.name}
            </code>
            <RequiredBadge required={field.required} />
            {hasDetails && (
              <span className="text-slate-400">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{field.description}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Type:</span>
            <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{field.type}</code>
          </div>
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-3 bg-slate-50 border-t border-slate-100">
          {field.binding && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">Binding:</span>
                <BindingStrengthBadge strength={field.binding.strength} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">ValueSet:</span>
                <code className="text-xs text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 break-all">
                  {field.binding.valueSet}
                </code>
              </div>
              {field.binding.displayName && (
                <span className="text-xs text-slate-500">({field.binding.displayName})</span>
              )}
            </div>
          )}

          {field.pattern && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-700">Extension URL Pattern:</span>
              <code className="text-xs text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 break-all">
                {field.pattern}
              </code>
            </div>
          )}

          {field.referenceTarget && field.referenceTarget.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-700">Reference Target(s):</span>
              <div className="flex flex-col gap-1">
                {field.referenceTarget.map((target) => (
                  <code key={target} className="text-xs text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 break-all">
                    {target}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeSystemsSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-8">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-900">Common Code Systems</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Standard terminology systems used for coded values
            </p>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>
        {isOpen && (
          <div className="divide-y divide-slate-100">
            {commonCodeSystems.map((system) => (
              <div key={system.name} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{system.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{system.description}</p>
                  </div>
                  <code className="shrink-0 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded font-mono">
                    {system.url}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const resource = getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const requiredFields = resource.fields.filter((f) => f.required);
  const optionalFields = resource.fields.filter((f) => !f.required);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            href="/docs/resources"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>
          <CopyPageButton pageTitle={resource.title} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{resource.title}</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
              FHIR R4
            </span>
          </div>
        </div>
        <p className="text-slate-600 max-w-3xl">{resource.description}</p>

        {/* Profile URL */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Profile URL (Required in meta.profile)</span>
              <code className="block mt-1 text-sm text-slate-800 font-mono break-all">{resource.profileUrl}</code>
            </div>
            <CopyButton text={resource.profileUrl} />
          </div>
        </div>
      </header>

      {/* Important Note */}
      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Profile Validation Required</h3>
            <p className="mt-1 text-sm text-amber-700">
              This resource must include the correct <code className="px-1 py-0.5 bg-amber-100 rounded">meta.profile</code> URL shown above. 
              Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).
            </p>
          </div>
        </div>
      </div>

      {/* Structure Definition */}
      <section className="mb-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-bold text-slate-900">Structure Definition</h2>
            <p className="mt-1 text-sm text-slate-600">
              Fields and constraints defined by the PH Core profile. Click on fields with bindings or patterns to expand details.
            </p>
          </div>

          <div className="px-6 py-5">
            {/* Required Fields */}
            {requiredFields.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Required Fields ({requiredFields.length})
                  </h3>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {requiredFields.map((field) => (
                    <FieldRow key={field.name} field={field} />
                  ))}
                </div>
              </div>
            )}

            {/* Optional Fields */}
            {optionalFields.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Optional Fields ({optionalFields.length})
                  </h3>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {optionalFields.map((field) => (
                    <FieldRow key={field.name} field={field} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* JSON Template */}
      <section className="mb-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">JSON Template</h2>
                <p className="mt-1 text-sm text-slate-600">
                  A complete example you can use as a starting point. Replace placeholder values with your actual data.
                </p>
              </div>
              <CopyButton text={resource.jsonTemplate} />
            </div>
          </div>
          <div className="p-4">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-sm leading-relaxed">
              <code>{resource.jsonTemplate}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Code Systems Reference */}
      <CodeSystemsSection />

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-3">
          <ExternalLink className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-800">Additional Resources</h3>
            <p className="mt-1 text-sm text-slate-600">
              For complete FHIR R4 {resource.name} specifications, visit the{" "}
              <a 
                href={`https://hl7.org/fhir/R4/${resource.name.toLowerCase()}.html`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                HL7 FHIR R4 {resource.name} Documentation
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}