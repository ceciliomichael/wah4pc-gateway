"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Bot, ChevronRight } from "lucide-react";
import { ChatPanel } from "./chat-panel";

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;
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

export function AiSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Load width from localStorage on mount
  useEffect(() => {
    setWidth(getStoredWidth());
  }, []);

  // Save width to localStorage when resizing ends
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [isResizing, width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [isResizing]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* Toggle Button - Vertically centered on right edge (when closed) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-0 top-1/2 z-[60] -translate-y-1/2 rounded-l-xl border border-r-0 border-slate-200 bg-white p-3 shadow-lg transition-all duration-300 hover:bg-slate-50 hover:shadow-xl hover:pr-4 ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6 text-blue-600" />
      </button>

      {/* Backdrop - No blur, just subtle overlay */}
      <div
        className={`fixed inset-0 z-[65] bg-black/10 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <aside
        ref={sidebarRef}
        style={{ width: isOpen ? width : 0 }}
        className={`fixed right-0 top-0 z-[70] h-full bg-white shadow-2xl ${
          isResizing ? "" : "transition-[width,opacity] duration-300 ease-in-out"
        } ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Resize Handle + Collapse Button Container - Button shows only when hovering this edge area */}
        <div className="group/edge absolute left-0 top-0 h-full w-4 z-10 flex items-center">
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-blue-400 transition-colors"
          />

          {/* Collapse Button - Only visible on hover of edge area */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md opacity-0 group-hover/edge:opacity-100 transition-opacity hover:bg-slate-50 hover:shadow-lg"
            aria-label="Close AI Assistant"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <ChatPanel />
      </aside>
    </>
  );
}