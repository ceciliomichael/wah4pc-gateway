"use client";

import { memo } from "react";

export const ThinkingIndicator = memo(function ThinkingIndicator() {
  return (
    <div className="px-4">
      <div className="inline-block relative overflow-hidden">
        <span className="text-sm font-medium text-slate-400">Thinking</span>
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer"
          style={{
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
});