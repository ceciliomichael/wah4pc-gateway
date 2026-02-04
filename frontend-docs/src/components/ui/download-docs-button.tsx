"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DownloadDocsButtonProps {
  className?: string;
}

export function DownloadDocsButton({ className }: DownloadDocsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    setIsLoading(true);
    // Trigger download by navigating to the API route
    window.location.href = "/api/docs/download";
    
    // Reset loading state after a short delay (since we can't track the actual download completion easily without streaming)
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed",
        className
      )}
    >
      <Download className="h-4 w-4" />
      {isLoading ? "Preparing Download..." : "Download Documentation"}
    </button>
  );
}