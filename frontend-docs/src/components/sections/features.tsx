import { Shield, Zap, Users, Database, Globe, FileCode2, Lock, Activity } from "lucide-react";

export function Features() {
  return (
    <section className="bg-transparent px-4 py-12 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Engineered for Modern Healthcare
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A comprehensive suite of tools designed to handle the complexity of FHIR interoperability with zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 h-auto lg:h-[600px]">
          
          {/* Main Feature - Large Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 lg:col-span-2 lg:row-span-2 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white mb-6 shadow-md shadow-blue-600/20">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Universal Interoperability</h3>
            <p className="text-slate-600 leading-relaxed mb-8">
              Break down data silos. WAH4PC Gateway acts as a universal translator and router, enabling seamless FHIR-native exchange between legacy EMRs, modern apps, and diverse healthcare providers.
            </p>
            <div className="absolute bottom-0 right-0 h-48 w-48 opacity-10 translate-x-12 translate-y-12">
               <Globe className="h-full w-full text-blue-600" />
            </div>
          </div>

          {/* Feature 2 - Security */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-green-300 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Secure & Compliant</h3>
            </div>
            <p className="text-sm text-slate-600">
              End-to-end encryption, strict API key validation, and granular scope management.
            </p>
          </div>

          {/* Feature 3 - Performance */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-amber-300 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">High Velocity</h3>
            </div>
            <p className="text-sm text-slate-600">
              Built on Go for sub-millisecond routing latency and massive concurrent throughput.
            </p>
          </div>

          {/* Feature 4 - Audit Logs (Wide on mobile, specific slot on desktop) */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2 hover:border-purple-300 transition-all duration-300 hover:shadow-md">
             <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <Database className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">Complete Audit Trail</h3>
                  </div>
                  <p className="text-sm text-slate-600 max-w-sm">
                    Every transaction is logged with immutable timestamps, status codes, and payload metadata for full regulatory compliance.
                  </p>
                </div>
                <Activity className="hidden sm:block h-16 w-16 text-purple-50" />
             </div>
          </div>

        </div>
        
        {/* Secondary Row of smaller features */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
           <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <Users className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Multi-Tenant Support</span>
           </div>
           <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <FileCode2 className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Standardized JSON API</span>
           </div>
           <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <Lock className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Role-Based Access</span>
           </div>
        </div>
      </div>
    </section>
  );
}