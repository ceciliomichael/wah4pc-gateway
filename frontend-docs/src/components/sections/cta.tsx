import Link from "next/link";
import { BookOpen, Github, ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-slate-900 px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-900/40 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 h-96 w-96 rounded-full bg-indigo-900/40 blur-3xl"></div>
      
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-4 sm:mb-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Ready to modernize your infrastructure?
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
          Join leading healthcare providers building the future of interoperability. 
          Start integrating in minutes with our comprehensive SDKs and clear documentation.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/docs"
            className="group inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-slate-900 shadow-xl transition-all hover:bg-slate-100 hover:scale-105"
          >
            <BookOpen className="h-5 w-5" />
            Read Docs
          </Link>
          <Link
            href="/docs/integration"
            className="group inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-slate-600"
          >
            Get API Key
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 border-t border-white/10 pt-8">
           <div className="text-sm font-medium text-slate-500">Supported Standards</div>
           <div className="flex items-center gap-4 opacity-50 grayscale transition-opacity hover:opacity-80 hover:grayscale-0">
              <span className="text-xs font-bold text-white px-2 py-1 rounded bg-slate-800">FHIR R4</span>
              <span className="text-xs font-bold text-white px-2 py-1 rounded bg-slate-800">HL7 v2</span>
              <span className="text-xs font-bold text-white px-2 py-1 rounded bg-slate-800">DICOM Web</span>
           </div>
        </div>
      </div>
    </section>
  );
}