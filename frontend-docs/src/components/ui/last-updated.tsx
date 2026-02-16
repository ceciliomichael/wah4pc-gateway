"use client";

import { cn } from "@/lib/utils";

interface LastUpdatedProps {
  className?: string;
  date?: string;
}

export function LastUpdated({ className, date = "February 17, 2026" }: LastUpdatedProps) {
  return (
    <div className={cn("text-sm text-slate-500", className)}>
      <p>Latest updated: {date}</p>
    </div>
  );
}