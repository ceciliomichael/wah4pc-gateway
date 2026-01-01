"use client";

import { Server, Database, ArrowRightLeft, FileJson, CheckCircle2 } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { CompactFeatureCard } from "@/components/ui/feature-card";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { JsonViewer } from "@/components/ui/json-viewer";
import { AlertBlock } from "@/components/ui/alert-block";
import { DataTable } from "@/components/ui/data-table";
import {
  systemArchitectureDiagram,
  layeredArchitectureDiagram,
  transactionFlowDiagram,
  transactionStatesDiagram,
  transactionStatesData,
  architectureLayers,
  designPrinciples,
  keyPoints,
  dataModels,
} from "./data";

const iconMap = {
  Server: <Server className="h-5 w-5" />,
  ArrowRightLeft: <ArrowRightLeft className="h-5 w-5" />,
  FileJson: <FileJson className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
};

export default function ArchitecturePage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Architecture"
        badgeColor="purple"
        title="System Architecture"
        description="Understanding the internal structure, data flow, and design patterns of the WAH4PC Gateway."
      />

      {/* Overview */}
      <section id="overview" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Overview</h2>
        <p className="mb-8 text-lg text-slate-600 leading-relaxed">
          The WAH4PC Gateway is a centralized orchestration service that manages FHIR
          resource transfers between healthcare providers. It follows a clean layered
          architecture with clear separation of concerns.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {architectureLayers.map((layer) => (
            <CompactFeatureCard
              key={layer.title}
              icon={iconMap[layer.iconName]}
              title={layer.title}
              description={layer.description}
              iconBgColor="bg-purple-50 text-purple-600"
            />
          ))}
        </div>
      </section>

      {/* System Architecture Diagram */}
      <section id="components" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Server className="h-5 w-5 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">System Components</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The diagram below shows how healthcare providers interact with the gateway
          and how requests flow through the system.
        </p>
        <DiagramContainer 
          chart={systemArchitectureDiagram} 
          title="Component Interaction Model"
          filename="system_architecture.mmd"
        />
      </section>

      {/* Layered Architecture */}
      <section id="layers" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Layered Architecture</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The codebase follows SOLID principles with dependency injection. Each layer
          has a single responsibility and depends only on abstractions.
        </p>
        <DiagramContainer 
          chart={layeredArchitectureDiagram} 
          title="Clean Architecture Layers"
          filename="layered_architecture.mmd"
          className="mb-8"
        />

        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Design Principles</h3>
          <ul className="space-y-4">
            {designPrinciples.map((principle) => (
              <DesignPrincipleItem
                key={principle.letter}
                letter={principle.letter}
                title={principle.title}
                description={principle.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Transaction Flow */}
      <section id="transaction-flow" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <ArrowRightLeft className="h-5 w-5 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900">Transaction Flow</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The gateway uses an asynchronous request/response model. When a provider
          requests data, the gateway orchestrates the entire flow without blocking.
        </p>
        <DiagramContainer 
          chart={transactionFlowDiagram} 
          title="Async Request/Response Cycle"
          filename="transaction_flow.mmd"
          className="mb-8"
        />

        <AlertBlock type="warning" title="Key Points">
          <ul className="space-y-1 list-disc list-inside text-sm">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </AlertBlock>
      </section>

      {/* Transaction States */}
      <section id="states" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Transaction States</h2>
        <p className="mb-6 text-slate-600">
          Each transaction progresses through a state machine. This enables status
          tracking and prevents duplicate processing.
        </p>
        <DiagramContainer 
          chart={transactionStatesDiagram} 
          title="State Machine Diagram"
          filename="states.mmd"
          className="mb-8"
        />

        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <DataTable
            columns={[
              {
                key: "status",
                header: "Status",
                render: (_value, row) => (
                  <span className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${row.statusColor}`}>
                    {row.status}
                  </span>
                ),
              },
              {
                key: "description",
                header: "Description",
                className: "text-slate-600",
              },
              {
                key: "nextStates",
                header: "Next States",
                className: "text-slate-500 font-mono text-xs",
              },
            ]}
            data={transactionStatesData}
          />
        </div>
      </section>

      {/* Data Models */}
      <section id="models">
        <div className="flex items-center gap-3 mb-6">
          <FileJson className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Data Models</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{dataModels.provider.title}</h3>
              <div className="flex gap-2">
                {dataModels.provider.types.map((type) => (
                  <span key={type} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <JsonViewer 
              data={dataModels.provider.code} 
              title="Provider Struct"
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">{dataModels.transaction.title}</h3>
            <JsonViewer 
              data={dataModels.transaction.code} 
              title="Transaction Struct"
            />
          </div>
        </div>
      </section>
    </article>
  );
}

function DesignPrincipleItem({
  letter,
  title,
  description,
}: {
  letter: string;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700 shadow-sm">
        {letter}
      </span>
      <div>
        <span className="font-bold text-slate-900 block mb-1">{title}</span>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </li>
  );
}