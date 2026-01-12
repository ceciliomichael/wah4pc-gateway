"use client";

import { useState, useEffect } from "react";

/**
 * Hook to handle mobile viewport changes when virtual keyboard opens/closes.
 * Uses the Visual Viewport API to get accurate viewport height on mobile.
 */
export function useMobileViewport() {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) {
      // Fallback for browsers without visualViewport API
      setViewportHeight(window.innerHeight);
      return;
    }

    const handleResize = () => {
      const currentHeight = viewport.height;
      const windowHeight = window.innerHeight;
      
      setViewportHeight(currentHeight);
      
      // Keyboard is likely visible if viewport is significantly smaller than window
      // Using 150px threshold to account for minor differences
      setKeyboardVisible(windowHeight - currentHeight > 150);
    };

    // Set initial value
    handleResize();

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return { viewportHeight, keyboardVisible };
}