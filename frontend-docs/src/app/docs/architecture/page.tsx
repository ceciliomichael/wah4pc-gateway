"use client";

import { Server, ArrowRightLeft, FileJson } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { JsonViewer } from "@/components/ui/json-viewer";
import { AlertBlock } from "@/components/ui/alert-block";
import { DataTable } from "@/components/ui/data-table";
import {
  systemArchitectureDiagram,
  transactionFlowDiagram,
  transactionStatesDiagram,
  transactionStatesData,
  keyPoints,
  dataModels,
} from "./data";

export default function ArchitecturePage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Architecture"
        badgeColor="purple"
        title="System Architecture"
        description="Understanding the data flow and transaction lifecycle of the WAH4PC Gateway."
      />

      {/* System Components */}
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