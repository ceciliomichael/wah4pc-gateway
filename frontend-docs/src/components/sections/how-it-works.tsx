"use client";

import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { ArrowRight, CheckCircle2, Server, Smartphone, Activity } from "lucide-react";

const flowDiagram = `sequenceDiagram
    participant A as Provider A<br/>(Source)
    participant G as Gateway<br/>(Hub)
    participant B as Provider B<br/>(Target)
    
    rect rgb(240, 248, 255)
    Note over A, G: 1. Initiation Phase
    A->>G: POST /transactions
    G->>G: Auth & Validation
    end
    
    rect rgb(255, 250, 240)
    Note over G, B: 2. Routing Phase
    G->>B: Forward Request
    B-->>G: Return FHIR Bundle
    end
    
    rect rgb(240, 255, 240)
    Note over G, A: 3. Delivery Phase
    G-->>A: Webhook Callback
    end`;

export function HowItWorks() {
  return (
    <section className="bg-transparent px-4 py-12 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div>
             <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 mb-6">
                <Activity className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">System Architecture</span>
             </div>
             
             <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
               Asynchronous Event-Driven Architecture
             </h2>
             
             <p className="text-lg text-slate-600 mb-8">
               Unlike traditional synchronous APIs, WAH4PC Gateway uses a robust async model to handle long-running healthcare queries without blocking your application.
             </p>

             <div className="space-y-6">
               <div className="flex gap-4">
                 <div className="flex-shrink-0 mt-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border border-blue-200 text-blue-600">
                     <span className="text-sm font-bold">1</span>
                   </div>
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-slate-900">Initiate & Acknowledge</h3>
                   <p className="text-slate-600 mt-1">Submit a request and receive an immediate transaction ID (`tid`) while the gateway processes in the background.</p>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="flex-shrink-0 mt-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border border-blue-200 text-blue-600">
                     <span className="text-sm font-bold">2</span>
                   </div>
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-slate-900">Intelligent Routing</h3>
                   <p className="text-slate-600 mt-1">The engine identifies the target provider, transforms headers if necessary, and securely tunnels the request.</p>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="flex-shrink-0 mt-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border border-blue-200 text-blue-600">
                     <span className="text-sm font-bold">3</span>
                   </div>
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-slate-900">Webhook Delivery</h3>
                   <p className="text-slate-600 mt-1">Once data is retrieved, your registered webhook endpoint receives the full FHIR Bundle payload.</p>
                 </div>
               </div>
             </div>

             <div className="mt-10 pt-8 border-t border-slate-100">
                <a href="/docs/flow" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
                  Explore full lifecycle documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
             </div>
          </div>

          {/* Right: Diagram Visual */}
          <div className="relative">
             {/* Decorative Elements */}
             <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-blue-50 blur-3xl opacity-60"></div>
             <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-purple-50 blur-3xl opacity-60"></div>
             
             {/* Card Container */}
             <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl p-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
                   <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-2">
                         <Server className="h-4 w-4 text-slate-400" />
                         <span className="text-xs font-mono text-slate-500">transaction_flow.mmd</span>
                      </div>
                      <div className="flex gap-1">
                         <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                         <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                      </div>
                   </div>
                   
                   <MermaidDiagram chart={flowDiagram} className="!border-0 !bg-transparent !shadow-none" />
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}