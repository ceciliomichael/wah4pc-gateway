"use client";

import { useRef, useCallback, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { useSidebar } from "@/components/layout/app-layout";

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;

export function AiSidebar() {
  const { close, setWidth, isResizing, setIsResizing } = useSidebar();
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, [setIsResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
  }, [isResizing, setWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [isResizing, setIsResizing]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <aside
      ref={sidebarRef}
      className={`h-full w-full bg-white shadow-2xl border-l border-slate-200 ${
        isResizing ? "" : "transition-all duration-300 ease-in-out"
      }`}
    >
      {/* Resize Handle + Collapse Button Container */}
      <div className="group/edge absolute left-0 top-0 h-full w-4 z-10 flex items-center">
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 h-full w-1 cursor-ew-resize"
        />

        {/* Collapse Button - Only visible on hover of edge area */}
        <button
          onClick={close}
          className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md opacity-0 group-hover/edge:opacity-100 transition-opacity hover:bg-slate-50 hover:shadow-lg"
          aria-label="Close AI Assistant"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <ChatPanel />
    </aside>
  );
}