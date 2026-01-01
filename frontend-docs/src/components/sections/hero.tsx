"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Terminal } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";

const sampleRequest = `POST /api/v1/transactions HTTP/1.1
Host: api.wah4pc-gateway.com
Authorization: Bearer sk_live_51J9...
Content-Type: application/json

{
  "resource_type": "Patient",
  "intent": "transfer",
  "source": "provider_clinic_a",
  "target": "provider_hospital_b",
  "payload": {
    "identifier": "urn:oid:1.2.36.146",
    "priority": "urgent"
  }
}`;

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-transparent">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="flex flex-col gap-10 lg:gap-16 lg:flex-row lg:items-center">
          
          {/* Left: Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1 pr-4 transition-colors hover:bg-blue-100/50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                V1
              </span>
              <span className="text-sm font-medium text-blue-700">
                Now in Public Beta
              </span>
              <ChevronRight className="h-3 w-3 text-blue-400" />
            </div>

            <h1 className="mb-4 sm:mb-6 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900">
              WAH4PC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Interoperability</span> Gateway
            </h1>
            
            <p className="mb-8 text-xl leading-relaxed text-slate-600 lg:max-w-xl">
              Connect disparate healthcare systems with a single, unified FHIR-compliant API. Secure, asynchronous, and developer-first.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/docs"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Integrating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs/api"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <Terminal className="h-4 w-4 text-slate-500" />
                API Reference
              </Link>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-8 lg:justify-start grayscale opacity-60">
               {/* Placeholder logos for "Trusted By" effect - using text for now */}
               <span className="text-sm font-bold text-slate-400">CLINIC_OS</span>
               <span className="text-sm font-bold text-slate-400">MED_CORE</span>
               <span className="text-sm font-bold text-slate-400">HEALTH_LINK</span>
               <span className="text-sm font-bold text-slate-400">LAB_SYNC</span>
            </div>
          </div>

          {/* Right: Code Visual */}
          <div className="flex-1 w-full lg:max-w-[600px]">
            <div className="relative rounded-2xl bg-slate-900 shadow-2xl shadow-blue-900/20 border border-slate-800 backdrop-blur-sm overflow-hidden">
              {/* Window Controls */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="h-3 w-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="h-3 w-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className="mx-auto text-xs font-medium text-slate-400">transaction_request.http</div>
              </div>
              
              {/* Code Content */}
              <CodeBlock
                code={sampleRequest}
                language="http"
                showCopyButton={false}
                variant="dark"
                className="!bg-transparent !border-0 !shadow-none !rounded-none"
              />
              
              {/* Status Bar */}
              <div className="flex justify-between border-t border-white/10 bg-white/5 px-4 py-2 text-[10px] text-slate-500">
                <span>JSON</span>
                <span>UTF-8</span>
                <span className="flex items-center gap-1.5">
                  <span className="block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Online
                </span>
              </div>
            </div>
            
            {/* Decoration: Glow behind code */}
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-blue-600/30 to-purple-600/30 blur-3xl opacity-40"></div>
          </div>
        </div>
      </div>
    </section>
  );
}