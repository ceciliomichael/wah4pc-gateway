"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, Bot } from "lucide-react";
import Link from "next/link";
import { SidebarContent } from "./docs-sidebar";
import { ChatPanel } from "../ai/chat-panel";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

type ActiveDrawer = "none" | "nav" | "ai";

export function MobileNav() {
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>("none");
  const pathname = usePathname();
  const { viewportHeight } = useMobileViewport();

  const isNavOpen = activeDrawer === "nav";
  const isAiOpen = activeDrawer === "ai";
  const isAnyOpen = activeDrawer !== "none";

  // Close drawer on route change
  useEffect(() => {
    setActiveDrawer("none");
  }, [pathname]);

  // Prevent body scroll when any drawer is open
  useEffect(() => {
    if (isAnyOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyOpen]);

  const handleClose = () => setActiveDrawer("none");

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link href="/docs" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span className="text-base font-semibold text-slate-900">WAH4PC</span>
        </Link>
        
        {/* Right side buttons: AI + Menu */}
        <div className="flex items-center gap-1">
          {/* AI Assistant Button */}
          <button
            type="button"
            onClick={() => setActiveDrawer("ai")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
            aria-label="Open AI Assistant"
          >
            <Bot className="h-5 w-5" />
          </button>
          
          {/* Navigation Menu Button */}
          <button
            type="button"
            onClick={() => setActiveDrawer("nav")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Backdrop - shown when any drawer is open */}
      {isAnyOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation Drawer - slides from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 transform bg-slate-50 transition-transform duration-300 ease-in-out ${
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="absolute right-2 top-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Content - hide sub-items on mobile */}
        <SidebarContent onNavigate={handleClose} showSubItems={false} />
      </aside>

      {/* AI Assistant Drawer - full screen overlay with dynamic height for keyboard */}
      <aside
        className={`lg:hidden fixed left-0 right-0 top-0 z-50 transform bg-white transition-transform duration-300 ease-in-out ${
          isAiOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          height: viewportHeight ? `${viewportHeight}px` : "100%",
        }}
      >
        {/* Close Button in header area */}
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close AI Assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Panel */}
        <ChatPanel />
      </aside>
    </>
  );
}