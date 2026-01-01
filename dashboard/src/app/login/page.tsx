"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth-store";
import { 
  LuShieldCheck, 
  LuCircleAlert, 
  LuLoaderCircle, 
  LuActivity,
  LuLock,
  LuArrowRight,
  LuHeart,
  LuBuilding2,
  LuFileText
} from "react-icons/lu";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!key.trim()) {
      setError("Please enter your admin key");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(key.trim());
      if (success) {
        router.push("/");
      } else {
        setError("Invalid admin key. Please check and try again.");
      }
    } catch {
      setError("Connection failed. Please check if the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <LuActivity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">WAH4PC</h1>
              <p className="text-primary-200 text-xs uppercase tracking-widest">Healthcare Gateway</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Secure Healthcare<br />Data Exchange
            </h2>
            <p className="text-primary-100 text-lg max-w-md">
              Connect healthcare providers seamlessly with FHIR-compliant data transfers and enterprise-grade security.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <LuHeart className="w-4 h-4 text-primary-200" />
              <span className="text-sm text-white font-medium">FHIR R4 Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <LuBuilding2 className="w-4 h-4 text-primary-200" />
              <span className="text-sm text-white font-medium">Multi-Provider</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <LuFileText className="w-4 h-4 text-primary-200" />
              <span className="text-sm text-white font-medium">Audit Logs</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-primary-200 text-sm">
          <LuShieldCheck className="w-4 h-4" />
          <span>HIPAA Compliant • End-to-End Encrypted</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-600 shadow-soft mb-4">
              <LuActivity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">WAH4PC Gateway</h1>
            <p className="text-slate-500 text-sm mt-1">Healthcare Data Exchange</p>
          </div>

          {/* Welcome Text - Desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to access the admin dashboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="adminKey"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Admin Key
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <LuLock className="w-5 h-5" />
                  </div>
                  <input
                    id="adminKey"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your master key"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 transition-all hover:border-slate-300 hover:bg-white"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LuLoaderCircle className="w-5 h-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LuArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Use your master key from <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-xs">config.yaml</code>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <LuShieldCheck className="w-4 h-4" />
            <span>Secured with TLS encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}