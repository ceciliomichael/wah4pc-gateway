"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LuActivity,
  LuArrowLeftRight,
  LuBuilding2,
  LuChevronLeft,
  LuFileText,
  LuKeyRound,
  LuLayoutDashboard,
  LuLogOut,
  LuSettings,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { useAuth } from "@/stores/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  roles: Array<"admin" | "user">;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    description: "Overview & stats",
    roles: ["admin", "user"],
  },
  {
    href: "/providers",
    label: "Providers",
    icon: LuBuilding2,
    description: "Healthcare providers",
    roles: ["admin"],
  },
  {
    href: "/practitioners",
    label: "Practitioners",
    icon: LuUsers,
    description: "Provider directories",
    roles: ["admin", "user"],
  },
  {
    href: "/apikeys",
    label: "API Keys",
    icon: LuKeyRound,
    description: "Access credentials",
    roles: ["admin"],
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: LuArrowLeftRight,
    description: "FHIR transfers",
    roles: ["admin", "user"],
  },
  {
    href: "/logs",
    label: "System Logs",
    icon: LuFileText,
    description: "Audit trail",
    roles: ["admin", "user"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: LuSettings,
    description: "Configuration",
    roles: ["admin"],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, identity } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const userRole = identity?.role ?? "admin";
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[72px]" : "w-72 lg:w-64",
      )}
    >
      {/* Logo / Brand */}
      <div
        className={clsx(
          "flex items-center h-16 border-b border-slate-100 transition-all duration-300 ease-in-out",
          collapsed ? "px-3" : "px-3",
        )}
      >
        {/* Logo wrapper - matches nav item padding structure */}
        <div
          className={clsx(
            "flex items-center transition-all duration-300 ease-in-out",
            collapsed ? "px-2" : "",
          )}
        >
          {/* Logo icon - always visible, clickable when collapsed */}
          <button
            type="button"
            onClick={() => collapsed && setCollapsed(false)}
            className={clsx(
              "flex-shrink-0 flex items-center justify-center rounded-xl bg-primary-600 shadow-soft transition-all duration-300 ease-in-out",
              collapsed
                ? "w-9 h-9 lg:hover:bg-primary-700 lg:cursor-pointer"
                : "w-10 h-10 cursor-default",
            )}
            aria-label={collapsed ? "Expand sidebar" : undefined}
            title={collapsed ? "Expand sidebar" : undefined}
            disabled={!collapsed}
          >
            <LuActivity className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Logo text - fades out when collapsed */}
        <div
          className={clsx(
            "flex flex-col ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            WAH4PC
          </span>
          <span className="text-[10px] font-medium text-primary-600 uppercase tracking-widest">
            Gateway
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Collapse button - fades out when collapsed */}
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className={clsx(
            "hidden lg:flex p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-300 ease-in-out",
            collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100",
          )}
          aria-label="Collapse sidebar"
        >
          <LuChevronLeft className="w-4 h-4" />
        </button>

        {/* Close button - mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-300",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
            aria-label="Close menu"
          >
            <LuX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Label - fades out */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "h-0 opacity-0" : "h-auto px-4 pt-2 pb-2 opacity-100",
        )}
      >
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Navigation
        </span>
      </div>

      {/* Navigation */}
      <nav
        className={clsx(
          "flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-4 transition-all duration-300 ease-in-out",
          collapsed ? "pt-2" : "",
        )}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-200",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
              title={collapsed ? item.label : undefined}
            >
              <div
                className={clsx(
                  "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                  active
                    ? "bg-primary-100 text-primary-600"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700",
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
              </div>
              {/* Text - always rendered but fades/clips */}
              <div
                className={clsx(
                  "flex flex-col min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                )}
              >
                <span
                  className={clsx(
                    "text-sm truncate",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-[10px] text-slate-400 truncate">
                    {item.description}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Security Badge - fades out */}
      <div
        className={clsx(
          "px-4 pb-3 overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "h-0 pb-0 opacity-0" : "h-auto opacity-100",
        )}
      ></div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={logout}
          className="group flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          title={collapsed ? "Sign Out" : undefined}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-red-100 transition-colors">
            <LuLogOut className="w-[18px] h-[18px]" />
          </div>
          {/* Text - always rendered but fades/clips */}
          <span
            className={clsx(
              "text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
