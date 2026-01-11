"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Only expand if there's actual content, otherwise keep minimal height
      if (input.trim()) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      }
    }
  }, [input]);

  // Set initial height on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  return (
    <div className="bg-slate-50 p-3">
      {/* Floating input container with rounded edges */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {/* Row 1: Seamless Textarea */}
        <div className="mb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the documentation..."
            disabled={isLoading}
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Row 2: Send button aligned right */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}