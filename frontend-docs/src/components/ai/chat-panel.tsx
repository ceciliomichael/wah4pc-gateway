"use client";

import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { ChatInput } from "./chat-input";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingIndicator } from "./thinking-indicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      // Create empty assistant message for streaming
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      const errorContent =
        error instanceof Error
          ? `Error: ${error.message}`
          : "Sorry, something went wrong. Please try again.";

      setMessages((prev) => {
        const hasAssistantMsg = prev.some((m) => m.id === assistantMessageId);
        if (hasAssistantMsg) {
          return prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: errorContent } : msg
          );
        }
        return [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: errorContent },
        ];
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Zora</h2>
            <p className="text-xs text-slate-500">WAH4PC Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-sm font-medium text-slate-900">
              How can I help you?
            </h3>
            <p className="max-w-[200px] text-xs text-slate-500">
              Ask me anything about the WAH4PC Gateway documentation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "px-4"}
              >
                {message.role === "user" ? (
                  <div className="w-full rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-900 border border-slate-200">
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>
            ))}
            {isLoading && !isStreaming && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}