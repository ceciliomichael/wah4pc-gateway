"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth-store";
import {
  LuActivity,
  LuArrowRight,
  LuBuilding2,
  LuCircleAlert,
  LuKeyRound,
  LuLoaderCircle,
  LuShield,
} from "react-icons/lu";

export default function LoginPage() {
  const [loginType, setLoginType] = useState<"admin" | "provider">("admin");
  const [adminKey, setAdminKey] = useState("");
  const [providerId, setProviderId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginAdmin, loginProvider } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (loginType === "admin") {
      if (!adminKey.trim()) {
        setFieldError("Admin key is required");
        return;
      }
    } else {
      if (!providerId.trim()) {
        setFieldError("Provider ID is required");
        return;
      }
      if (!apiKey.trim()) {
        setFieldError("API key is required");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result =
        loginType === "admin"
          ? await loginAdmin(adminKey.trim())
          : await loginProvider(providerId.trim(), apiKey.trim());

      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Authentication failed.");
      }
    } catch {
      setError("Connection failed. Please check if the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <section className="bg-primary-50 border-b border-primary-100 lg:border-b-0 lg:border-r lg:border-primary-100 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-primary-100">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
                <LuActivity className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800 tracking-tight">WAH4PC</span>
            </div>
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Dashboard Login
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Access your workspace using your assigned credentials.
            </p>
            <p className="mt-6 inline-flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-primary-800 bg-primary-100 border border-primary-200">
              Keep this simple: choose your role and sign in.
            </p>
          </section>

          <section className="p-5 sm:p-6 lg:p-8 flex flex-col min-h-[460px]">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your details below.</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setLoginType("admin");
                    setFieldError("");
                    setError("");
                  }}
                  className={`min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    loginType === "admin"
                      ? "bg-white text-slate-800 border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  disabled={isSubmitting}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginType("provider");
                    setFieldError("");
                    setError("");
                  }}
                  className={`min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    loginType === "provider"
                      ? "bg-white text-slate-800 border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  disabled={isSubmitting}
                >
                  Provider
                </button>
              </div>

              <div className="min-h-[176px]">
                {loginType === "admin" ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="adminUser" className="block text-sm font-semibold text-slate-700 mb-2">
                        User
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LuShield className="w-4 h-4" />
                        </div>
                        <input
                          id="adminUser"
                          type="text"
                          value="Admin"
                          readOnly
                          disabled
                          aria-disabled="true"
                          className="w-full min-h-11 pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adminKey" className="block text-sm font-semibold text-slate-700 mb-2">
                        Admin key
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LuKeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="adminKey"
                          type="password"
                          value={adminKey}
                          onChange={(e) => {
                            setAdminKey(e.target.value);
                            setFieldError("");
                            setError("");
                          }}
                          placeholder="Enter admin key"
                          className={`w-full min-h-11 pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 transition-colors ${
                            fieldError ? "border-red-300" : "border-slate-200 hover:border-slate-300"
                          }`}
                          disabled={isSubmitting}
                          autoFocus
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="providerId" className="block text-sm font-semibold text-slate-700 mb-2">
                        Provider ID
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LuBuilding2 className="w-4 h-4" />
                        </div>
                        <input
                          id="providerId"
                          type="text"
                          value={providerId}
                          onChange={(e) => {
                            setProviderId(e.target.value);
                            setFieldError("");
                            setError("");
                          }}
                          placeholder="Enter provider ID"
                          className={`w-full min-h-11 pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 transition-colors ${
                            fieldError ? "border-red-300" : "border-slate-200 hover:border-slate-300"
                          }`}
                          disabled={isSubmitting}
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="providerApiKey"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                      >
                        API key
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LuKeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="providerApiKey"
                          type="password"
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value);
                            setFieldError("");
                            setError("");
                          }}
                          placeholder="Enter API key"
                          className={`w-full min-h-11 pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 transition-colors ${
                            fieldError ? "border-red-300" : "border-slate-200 hover:border-slate-300"
                          }`}
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LuLoaderCircle className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <LuArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
