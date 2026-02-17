"use client";

import Link from "next/link";
import { 
  Database, 
  ArrowRight, 
  ExternalLink, 
  Users, 
  Stethoscope, 
  Syringe, 
  Activity, 
  Pill, 
  Calendar,
  MapPin,
  Building2,
  UserCog,
  CreditCard,
  Receipt,
  FileText,
  ClipboardList,
  AlertTriangle,
  HeartPulse,
  FlaskConical,
  PillBottle,
  Utensils,
  BadgeCheck,
  Banknote,
  FileCheck,
} from "lucide-react";
import { resources, pageInfo, commonCodeSystems, phCoreResources, baseR4Resources } from "./resources-data/index";
import { CopyPageButton } from "@/components/ui/copy-page-button";

const resourceIcons: Record<string, React.ReactNode> = {
  // PH Core Resources
  patient: <Users className="h-6 w-6" />,
  encounter: <Calendar className="h-6 w-6" />,
  procedure: <Stethoscope className="h-6 w-6" />,
  immunization: <Syringe className="h-6 w-6" />,
  observation: <Activity className="h-6 w-6" />,
  medication: <Pill className="h-6 w-6" />,
  location: <MapPin className="h-6 w-6" />,
  organization: <Building2 className="h-6 w-6" />,
  practitioner: <UserCog className="h-6 w-6" />,
  // Base R4 - Financial/Administrative
  appointment: <Calendar className="h-6 w-6" />,
  account: <CreditCard className="h-6 w-6" />,
  claim: <Receipt className="h-6 w-6" />,
  "claim-response": <FileCheck className="h-6 w-6" />,
  "charge-item": <Banknote className="h-6 w-6" />,
  "charge-item-definition": <FileText className="h-6 w-6" />,
  invoice: <ClipboardList className="h-6 w-6" />,
  "payment-notice": <Receipt className="h-6 w-6" />,
  "payment-reconciliation": <FileCheck className="h-6 w-6" />,
  // Base R4 - Clinical/Other
  "allergy-intolerance": <AlertTriangle className="h-6 w-6" />,
  condition: <HeartPulse className="h-6 w-6" />,
  "diagnostic-report": <FlaskConical className="h-6 w-6" />,
  "medication-administration": <PillBottle className="h-6 w-6" />,
  "medication-request": <Pill className="h-6 w-6" />,
  "nutrition-order": <Utensils className="h-6 w-6" />,
  "practitioner-role": <BadgeCheck className="h-6 w-6" />,
};

function ResourceCard({ resource }: { resource: typeof resources[0] }) {
  const requiredCount = resource.fields.filter((f) => f.required).length;
  const optionalCount = resource.fields.filter((f) => !f.required).length;

  return (
    <Link
      href={`/docs/resources/${resource.id}`}
      className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            {resourceIcons[resource.id] || <Database className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {resource.title}
            </h3>
            <p className="text-sm text-slate-500">{resource.name} Resource</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>

      <p className="mt-4 text-sm text-slate-600 line-clamp-2">
        {resource.description}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {requiredCount} Required
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {optionalCount} Optional
        </span>
      </div>
    </Link>
  );
}

function CodeSystemsSection() {
  return (
    <section id="code-systems" className="scroll-mt-24">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-xl font-bold text-slate-900">Common Code Systems</h2>
          <p className="mt-1 text-sm text-slate-600">
            Standard terminology systems used across PH Core resources for coded values.
          </p>
        </div>
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
      </div>
    </section>
  );
}

export default function ResourcesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{pageInfo.title}</h1>
            </div>
          </div>
          <CopyPageButton pageTitle={pageInfo.title} />
        </div>
        <p className="text-slate-600 max-w-3xl">{pageInfo.description}</p>

        {/* Endpoint Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
          <span className="text-xs font-medium text-slate-500 uppercase">Endpoint:</span>
          <code className="text-sm font-semibold text-slate-800">{pageInfo.endpoint}</code>
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
              Use the profile URLs in each resource page as the recommended target format.
              The gateway validates and normalizes SUCCESS payloads before forwarding results.
            </p>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Supported Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
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
              For complete FHIR R4 resource specifications, visit the{" "}
              <a 
                href="https://hl7.org/fhir/R4/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                HL7 FHIR R4 Documentation
              </a>
              . The PH Core profiles extend these base definitions with Philippine-specific requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
