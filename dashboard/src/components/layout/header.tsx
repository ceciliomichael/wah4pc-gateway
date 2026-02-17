"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LuMenu } from "react-icons/lu";
import { useAuth } from "@/stores/auth-store";
import { providerApi } from "@/lib/api";

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your gateway" },
  "/providers": { title: "Providers", subtitle: "Manage healthcare connections" },
  "/apikeys": { title: "API Keys", subtitle: "Authentication & access control" },
  "/transactions": { title: "Transactions", subtitle: "FHIR resource transfers" },
  "/logs": { title: "System Logs", subtitle: "Audit Trail and diagnostic" },
  "/settings": { title: "Settings", subtitle: "Manage system configuration" },
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { identity } = useAuth();
  const [providerName, setProviderName] = useState<string>("");

  const getPageConfig = () => {
    // Exact match first
    if (pageConfig[pathname]) return pageConfig[pathname];

    // Check for nested routes
    for (const [path, config] of Object.entries(pageConfig)) {
      if (path !== "/" && pathname.startsWith(path)) {
        return config;
      }
    }

    return { title: "Dashboard", subtitle: "Overview of your gateway" };
  };

  const { title, subtitle } = getPageConfig();
  const isAdmin = identity?.role === "admin";
  
  useEffect(() => {
    let mounted = true;
    async function loadProviderName() {
      if (identity?.role !== "user" || !identity.providerId) {
        setProviderName("");
        return;
      }
      try {
        const provider = await providerApi.getById(identity.providerId);
        if (mounted) {
          setProviderName(provider.name || "");
        }
      } catch {
        if (mounted) {
          setProviderName("");
        }
      }
    }
    loadProviderName();
    return () => {
      mounted = false;
    };
  }, [identity?.role, identity?.providerId]);

  const displayName = isAdmin ? "Admin" : providerName || "Provider";
  const displayRole = isAdmin ? "Gateway Manager" : identity?.providerId || "Provider";
  const avatarLabel = isAdmin ? "A" : "P";

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-5 lg:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button - 44px minimum touch target */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors"
          aria-label="Open menu"
        >
          <LuMenu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <p className="hidden sm:block text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* User Avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-700">{displayName}</span>
          <span className="text-[10px] text-slate-400">{displayRole}</span>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center border-2 border-primary-200">
            <span className="text-sm font-bold text-primary-700">{avatarLabel}</span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        </div>
      </div>
    </header>
  );
}
