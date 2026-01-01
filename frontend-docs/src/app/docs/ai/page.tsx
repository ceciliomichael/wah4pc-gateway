"use client";

import { DiagramContainer } from "@/components/ui/diagram-container";
import { Brain, Sparkles, Shield, Zap, Settings, Activity } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { CompactFeatureCard } from "@/components/ui/feature-card";
import { AlertBlock } from "@/components/ui/alert-block";
import { DataTable } from "@/components/ui/data-table";
import {
  aiWorkflowDiagram,
  aiAnalysisDiagram,
  aiFeatures,
  aiCapabilities,
  keyBenefits,
  integrationExample,
  configOptions,
} from "./data";

const iconMap = {
  Brain: <Brain className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
};

export default function AiPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="AI Capabilities"
        badgeColor="green"
        title="AI Integration"
        description="Leverage artificial intelligence for smart routing, data enrichment, and predictive analytics within the WAH4PC Gateway."
      />

      {/* Overview */}
      <section id="overview" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Overview</h2>
        <p className="mb-8 text-lg text-slate-600 leading-relaxed">
          The WAH4PC Gateway integrates AI capabilities to enhance healthcare data
          exchange. From intelligent provider matching to automated data validation,
          AI features help reduce manual intervention and improve transaction quality.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {aiFeatures.map((feature) => (
            <CompactFeatureCard
              key={feature.title}
              icon={iconMap[feature.iconName]}
              title={feature.title}
              description={feature.description}
              iconBgColor="bg-green-50 text-green-600"
            />
          ))}
        </div>
      </section>

      {/* AI Workflow Diagram */}
      <section id="workflow" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">AI-Enhanced Request Flow</h2>
        </div>
        <p className="mb-6 text-slate-600">
          When AI assistance is enabled, requests are analyzed to determine optimal
          routing and enhance data quality before forwarding to target providers.
        </p>
        <DiagramContainer 
          chart={aiWorkflowDiagram} 
          title="Intelligent Routing Workflow"
          filename="ai_workflow.mmd"
        />
      </section>

      {/* Data Analysis Pipeline */}
      <section id="pipeline" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">Data Analysis Pipeline</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The AI engine processes incoming FHIR data through multiple stages,
          extracting patterns and validating data quality in real-time.
        </p>
        <DiagramContainer 
          chart={aiAnalysisDiagram} 
          title="Analysis Stages"
          filename="analysis_pipeline.mmd"
          className="mb-8"
        />

        <AlertBlock type="info" title="Key Benefits">
          <ul className="space-y-1 list-disc list-inside text-sm">
            {keyBenefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </AlertBlock>
      </section>

      {/* Capabilities Table */}
      <section id="capabilities" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Available Capabilities</h2>
        <p className="mb-6 text-slate-600">
          The following AI capabilities are available for use within the gateway.
          Check the status column for availability information.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: "capability",
                header: "Capability",
                className: "font-semibold text-slate-900",
              },
              {
                key: "description",
                header: "Description",
                className: "text-slate-600",
              },
              {
                key: "status",
                header: "Status",
                render: (_value, row) => (
                  <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider ${row.statusColor}`}>
                    {row.status}
                  </span>
                ),
              },
            ]}
            data={aiCapabilities}
          />
        </div>
      </section>

      {/* Integration Example */}
      <section id="integration" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Integration Guide</h2>
        <p className="mb-6 text-slate-600">
          Enable AI features in your requests by using the appropriate headers and
          configuration options.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 mb-8">
          <h3 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            {integrationExample.title}
          </h3>
          <div className="relative group">
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 rounded-t-xl flex items-center px-3 border-b border-slate-800">
               <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
               </div>
               <div className="mx-auto text-[10px] font-medium text-slate-500 font-mono">http</div>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 pt-10 pb-4 px-4 text-xs text-slate-300 font-mono leading-relaxed border border-slate-800 shadow-sm">
              {integrationExample.code}
            </pre>
          </div>
          <p className="mt-4 text-sm text-slate-600">{integrationExample.description}</p>
        </div>

        <h3 className="mb-4 text-lg font-bold text-slate-900">Configuration Options</h3>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-left font-semibold text-slate-900 w-1/4">Option</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-900 w-1/6">Type</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-900 w-1/4">Values</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configOptions.map((opt) => (
                  <tr key={opt.option} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-mono text-slate-700 font-medium">
                        {opt.option}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">{opt.type}</td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-slate-600 break-words">{opt.values}</code>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{opt.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section id="best-practices">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Best Practices</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <ul className="space-y-4">
            <BestPracticeItem
              number={1}
              title="Start with Specific Context"
              description="Provide detailed aiContext objects to improve routing accuracy. Include specialty preferences and location constraints."
            />
            <BestPracticeItem
              number={2}
              title="Monitor AI Decisions"
              description="Review transaction logs to understand AI routing decisions. Use insights to refine your context parameters."
            />
            <BestPracticeItem
              number={3}
              title="Fallback Gracefully"
              description="Always have a fallback targetId ready. If AI routing fails or times out, the system will use your specified default."
            />
            <BestPracticeItem
              number={4}
              title="Validate Results"
              description="While AI enrichment improves data quality, always validate critical fields in your application logic."
            />
          </ul>
        </div>
      </section>
    </article>
  );
}

function BestPracticeItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4 p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-sm font-bold text-green-700">
        {number}
      </span>
      <div>
        <span className="font-bold text-slate-900 block mb-1">{title}</span>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </li>
  );
}