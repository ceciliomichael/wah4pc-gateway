"use client";

import { Server } from "lucide-react";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";

interface DiagramContainerProps {
  chart: string;
  title?: string;
  filename?: string;
  className?: string;
}

export function DiagramContainer({ 
  chart, 
  title, 
  filename = "system_diagram.mmd", 
  className = "" 
}: DiagramContainerProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-2 shadow-sm ${className}`}>
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-mono text-slate-500">{filename}</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
        
        {title && (
          <h4 className="mb-4 text-sm font-semibold text-slate-700 text-center uppercase tracking-wide">
            {title}
          </h4>
        )}
        
        <MermaidDiagram chart={chart} className="!border-0 !bg-transparent !shadow-none" />
      </div>
    </div>
  );
}