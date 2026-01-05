"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Blocks,
  PlugZap,
  FileCode2,
  Home,
  ChevronRight,
  Workflow,
  GitMerge,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  items?: { title: string; href: string }[];
}

const navigationItems: NavItem[] = [
  {
    title: "Introduction",
    href: "/docs",
    icon: <Home className="h-4 w-4" />,
    description: "Overview of the gateway",
  },
  {
    title: "Architecture",
    href: "/docs/architecture",
    icon: <Blocks className="h-4 w-4" />,
    description: "System design & flow",
    items: [
      { title: "Overview", href: "/docs/architecture#overview" },
      { title: "System Components", href: "/docs/architecture#components" },
      { title: "Layered Architecture", href: "/docs/architecture#layers" },
      { title: "Transaction Flow", href: "/docs/architecture#transaction-flow" },
      { title: "Transaction States", href: "/docs/architecture#states" },
      { title: "Data Models", href: "/docs/architecture#models" },
    ],
  },
  {
    title: "System Flow",
    href: "/docs/system-flow",
    icon: <GitMerge className="h-4 w-4" />,
    description: "Provider lifecycle overview",
    items: [
      { title: "Introduction", href: "/docs/system-flow#intro" },
      { title: "Lifecycle Overview", href: "/docs/system-flow#lifecycle" },
      { title: "Phase Breakdown", href: "/docs/system-flow#phases" },
      { title: "Comparison Table", href: "/docs/system-flow#comparison" },
      { title: "Key Concepts", href: "/docs/system-flow#concepts" },
      { title: "Quick Start", href: "/docs/system-flow#quick-start" },
      { title: "Next Steps", href: "/docs/system-flow#next-steps" },
    ],
  },
  {
    title: "Transaction Flow",
    href: "/docs/flow",
    icon: <Workflow className="h-4 w-4" />,
    description: "How requests move through",
    items: [
      { title: "Introduction", href: "/docs/flow#intro" },
      { title: "The Transaction ID", href: "/docs/flow#transaction-id" },
      { title: "Complete Lifecycle", href: "/docs/flow#lifecycle" },
      { title: "Step-by-Step", href: "/docs/flow#step-by-step" },
      { title: "Consistency Rules", href: "/docs/flow#consistency" },
      { title: "Error Scenarios", href: "/docs/flow#errors" },
      { title: "Detailed Steps", href: "/docs/flow#steps" },
      { title: "Summary", href: "/docs/flow#summary" },
    ],
  },
  {
    title: "Provider Integration",
    href: "/docs/integration",
    icon: <PlugZap className="h-4 w-4" />,
    description: "Setup your endpoints",
    items: [
      { title: "Prerequisites", href: "/docs/integration#prerequisites" },
      { title: "Integration Flow", href: "/docs/integration#flow" },
      { title: "Registration", href: "/docs/integration#registration" },
      { title: "Webhooks", href: "/docs/integration#webhooks" },
      { title: "Identifiers", href: "/docs/integration#identifiers" },
      { title: "Making Requests", href: "/docs/integration#requests" },
      { title: "Best Practices", href: "/docs/integration#best-practices" },
      { title: "Common Pitfalls", href: "/docs/integration#pitfalls" },
      { title: "Security", href: "/docs/integration#security" },
      { title: "Examples", href: "/docs/integration#examples" },
      { title: "Checklist", href: "/docs/integration#checklist" },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    icon: <FileCode2 className="h-4 w-4" />,
    description: "Endpoint documentation",
    items: [
      { title: "Base URL", href: "/docs/api#base-url" },
      { title: "Authentication", href: "/docs/api#auth" },
      { title: "Endpoints", href: "/docs/api#endpoints" },
      { title: "Error Responses", href: "/docs/api#errors" },
      { title: "Rate Limiting", href: "/docs/api#rate-limiting" },
    ],
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  showSubItems?: boolean;
}

export function SidebarContent({ onNavigate, showSubItems = true }: SidebarContentProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/docs") {
      return pathname === "/docs";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onNavigate) onNavigate();

    if (href.includes("#")) {
      const [path, hash] = href.split("#");
      // Only intercept if on same page
      if (path === pathname && hash) {
        e.preventDefault();
        const element = document.getElementById(hash);
        if (element) {
          // Find the heading inside the section to center specifically on the title
          const heading = element.querySelector("h2, h3, h1") || element;
          heading.scrollIntoView({ behavior: "smooth", block: "center" });
          window.history.pushState(null, "", href);
        }
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/docs" className="flex items-center gap-3 group" onClick={onNavigate}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">WAH4PC</h1>
            <p className="text-xs font-medium text-slate-500">Gateway Docs v1.0.0</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <span
                    className={`transition-colors ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <span className="block text-sm font-semibold whitespace-nowrap">{item.title}</span>
                    <span
                      className={`block text-xs ${
                        active ? "text-blue-600/70" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                  {showSubItems && item.items && item.items.length > 0 && (
                    <ChevronRight
                      className={`h-4 w-4 transition-all ${
                        active ? "text-blue-500 rotate-90" : "text-slate-300 group-hover:translate-x-0.5"
                      }`}
                    />
                  )}
                </Link>
                
                {/* Sub-items (Table of Contents) - hidden on mobile */}
                {showSubItems && active && item.items && item.items.length > 0 && (
                  <ul className="mt-2 ml-3 space-y-0.5 border-l-2 border-blue-100 pl-2">
                    {item.items.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          onClick={(e) => handleLinkClick(e, subItem.href)}
                          className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
                        >
                          {subItem.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function DocsSidebar() {
  return (
    <aside className="hidden lg:block sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-slate-50">
      <SidebarContent />
    </aside>
  );
}