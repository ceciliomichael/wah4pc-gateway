"use client";

import Link from "next/link";
import {
  UserPlus,
  Search,
  Shield,
  ArrowLeftRight,
  Activity,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { DocsHeader } from "@/components/ui/docs-header";
import { AlertBlock } from "@/components/ui/alert-block";
import {
  systemLifecycleDiagram,
  onboardingFlowDiagram,
  discoveryFlowDiagram,
  securityFlowDiagram,
  exchangeFlowDiagram,
  monitoringFlowDiagram,
  lifecyclePhases,
  flowComparison,
  keyConcepts,
  quickStartSteps,
} from "./data";

const phaseIcons: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus className="h-6 w-6" />,
  Search: <Search className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  ArrowLeftRight: <ArrowLeftRight className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
};

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
};

const phaseDiagrams: Record<number, string> = {
  1: onboardingFlowDiagram,
  2: discoveryFlowDiagram,
  3: securityFlowDiagram,
  4: exchangeFlowDiagram,
  5: monitoringFlowDiagram,
};

const phaseFilenames: Record<number, string> = {
  1: "phase_1_onboarding.mmd",
  2: "phase_2_discovery.mmd",
  3: "phase_3_security.mmd",
  4: "phase_4_exchange.mmd",
  5: "phase_5_monitoring.mmd",
};

export default function SystemFlowPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="System Flow"
        badgeColor="blue"
        title="System Flow Overview"
        description="Understand the complete lifecycle of participating in the WAH4PC Gateway—from initial registration to ongoing monitoring. This is the 'big picture' of how providers operate in the network."
      />

      {/* Introduction */}
      <section id="intro" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Introduction</h2>
        <p className="text-slate-600 leading-relaxed mb-6 text-lg">
          The WAH4PC Gateway enables healthcare providers to exchange FHIR data securely. 
          Before diving into individual API calls, it's important to understand the{" "}
          <strong className="text-slate-900">overall system flow</strong>—the lifecycle every provider goes through 
          to participate in the network.
        </p>

        <AlertBlock type="info" title="System Flow vs. Transaction Flow">
          <p className="mb-2">
            <strong>System Flow</strong> (this page) describes the <em>macro-level</em> lifecycle: 
            how you join the network, discover other providers, and maintain ongoing participation.
          </p>
          <p>
            <strong>Transaction Flow</strong> (see{" "}
            <Link href="/docs/flow" className="text-blue-600 underline hover:text-blue-800 font-medium">
              Transaction Flow
            </Link>
            ) describes the <em>micro-level</em> detail: what happens when you send a single 
            data request through the gateway.
          </p>
        </AlertBlock>
      </section>

      {/* System Lifecycle Overview */}
      <section id="lifecycle" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">The Provider Lifecycle</h2>
        <p className="mb-6 text-slate-600">
          Every provider goes through five phases. After initial onboarding, you continuously 
          cycle through discovery, authentication, exchange, and monitoring.
        </p>
        <DiagramContainer 
          chart={systemLifecycleDiagram} 
          title="Lifecycle Overview"
          filename="system_lifecycle.mmd"
        />
      </section>

      {/* Phase Breakdown */}
      <section id="phases" className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">Phase-by-Phase Breakdown</h2>
        
        <div className="space-y-12">
          {lifecyclePhases.map((phase) => {
            const colors = phaseColors[phase.color];
            return (
              <div
                key={phase.phase}
                className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                {/* Phase Header */}
                <div className="px-6 py-5 border-b border-slate-200/50 bg-white/80">
                  <div className="flex items-center gap-5">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} shadow-sm`}>
                      {phaseIcons[phase.icon]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>Phase {phase.phase}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{phase.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{phase.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Phase Content */}
                <div className="p-6 sm:p-8">
                  <p className="text-slate-600 mb-6 text-lg">{phase.description}</p>
                  
                  {/* Steps */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">What Happens</h4>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {phase.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-100">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${colors.text}`} />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Insight */}
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50/50 border border-amber-100 p-4 mb-8">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-amber-700 uppercase mb-1">Key Insight</span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {phase.keyInsight}
                      </p>
                    </div>
                  </div>

                  {/* Phase Diagram */}
                  <div className="mt-6">
                    <DiagramContainer 
                      chart={phaseDiagrams[phase.phase]} 
                      filename={phaseFilenames[phase.phase]}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">System Flow vs. Transaction Flow</h2>
        <p className="mb-6 text-slate-600">
          Understanding the difference between these two concepts is crucial for proper integration:
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left font-bold text-slate-900 w-1/4">Aspect</th>
                <th className="px-6 py-4 text-left font-bold text-blue-700 bg-blue-50/50 w-1/3 border-l border-slate-200">System Flow</th>
                <th className="px-6 py-4 text-left font-bold text-orange-700 bg-orange-50/50 w-1/3 border-l border-slate-200">Transaction Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flowComparison.map((row) => (
                <tr key={row.aspect} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.aspect}</td>
                  <td className="px-6 py-4 text-slate-600 border-l border-slate-100">{row.systemFlow}</td>
                  <td className="px-6 py-4 text-slate-600 border-l border-slate-100">{row.transactionFlow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Concepts */}
      <section id="concepts" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Key Concepts</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {keyConcepts.map((concept) => (
            <div key={concept.term} className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-2">{concept.term}</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{concept.definition}</p>
              <div className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5">
                <code className="text-xs font-mono text-slate-700 font-medium">
                  {concept.example}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Quick Start Path</h2>
        <p className="mb-6 text-slate-600">
          Follow these steps to go from zero to your first data exchange:
        </p>

        <div className="space-y-4">
          {quickStartSteps.map((item, idx) => (
            <div key={item.step} className="group flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-200">
                {item.step}
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">{item.action}</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono border border-slate-200">
                    {item.endpoint}
                  </code>
                </div>
                <span className="text-sm font-medium text-slate-500">{item.result}</span>
              </div>
              {idx < quickStartSteps.length - 1 && (
                <div className="hidden lg:block px-2">
                  <ArrowRight className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section id="next-steps">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Ready to dive deeper?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/docs/integration"
              className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-green-300 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-green-700 transition-colors mb-2">
                Provider Integration →
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Step-by-step guide to implement the webhook endpoints your system needs.
              </p>
            </Link>
            <Link
              href="/docs/flow"
              className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-orange-700 transition-colors mb-2">
                Transaction Flow →
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Deep dive into how individual requests move through the gateway.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}