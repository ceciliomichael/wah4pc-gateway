"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Bot } from "lucide-react";

interface SidebarContextType {
  isOpen: boolean;
  width: number;
  isResizing: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within AppLayout");
  }
  return context;
}

interface AppLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;
const COLLAPSED_WIDTH = 48;
const STORAGE_KEY = "ai-sidebar-width";

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
      return parsed;
    }
  }
  return DEFAULT_WIDTH;
}

export function AppLayout({ children, sidebar }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate width from localStorage on mount
  useEffect(() => {
    setWidthState(getStoredWidth());
    setIsHydrated(true);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
    setWidthState(clampedWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, clampedWidth.toString());
    }
  }, []);

  const contextValue: SidebarContextType = {
    isOpen,
    width,
    isResizing,
    open,
    close,
    toggle,
    setWidth,
    setIsResizing,
  };

  const currentWidth = isHydrated ? (isOpen ? width : COLLAPSED_WIDTH) : COLLAPSED_WIDTH;
  const transitionClass = isResizing ? "" : "transition-all duration-300 ease-in-out";

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className="flex min-h-screen w-full">
        {/* Main Content - always has margin for sidebar (collapsed or expanded) */}
        <div
          className={`flex-1 min-w-0 ${transitionClass}`}
          style={{
            marginRight: currentWidth,
          }}
        >
          {children}
        </div>

        {/* Sidebar Area - fixed to right, always visible */}
        <div
          className={`fixed right-0 top-0 h-full z-50 ${transitionClass}`}
          style={{ width: currentWidth }}
        >
          {/* Collapsed Bar - full height container */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-white border-l border-slate-200 transition-opacity duration-300 ${
              isOpen ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <button
              onClick={open}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 border border-blue-100 transition-all duration-200 hover:bg-blue-100 hover:border-blue-200 hover:scale-105"
              aria-label="Open AI Assistant"
            >
              <Bot className="h-5 w-5 text-blue-600" />
            </button>
          </div>

          {/* Expanded Sidebar */}
          <div
            className={`h-full transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {sidebar}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}