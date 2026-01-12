"use client";

import { useState, useRef, useCallback } from "react";
import { Bot } from "lucide-react";
import { ChatInput } from "./chat-input";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingIndicator } from "./thinking-indicator";
import { ToolMessage, type ToolCall, type ToolStatus, type ToolResult } from "./tool-message";
import { useAutoScroll } from "../../hooks/use-auto-scroll";
import type { Message } from "../../types/chat";

// ============================================================================
// TYPES
// ============================================================================

interface ParsedToolCall {
  name: string;
  params: Record<string, string>;
  fullMatch: string;
}

interface ToolApiResponse {
  success: boolean;
  tool: string;
  result?: ToolResult;
  error?: string;
}

// ============================================================================
// TOOL PARSING UTILITIES
// ============================================================================

const VALID_TOOLS = ["list_pages", "analyze_page", "read_page"] as const;
type ValidToolName = (typeof VALID_TOOLS)[number];

function isValidTool(name: string): name is ValidToolName {
  return VALID_TOOLS.includes(name as ValidToolName);
}

/**
 * Parse tool calls from AI response content
 * Detects patterns like: <tool_name>param: value</tool_name>
 */
function parseToolCalls(content: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];

  for (const toolName of VALID_TOOLS) {
    // Match <tool_name>...</tool_name> pattern
    const regex = new RegExp(`<${toolName}>([\\s\\S]*?)</${toolName}>`, "g");
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const paramsContent = match[1].trim();

      // Parse parameters (format: "key: value" on each line)
      const params: Record<string, string> = {};
      const lines = paramsContent.split("\n");

      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          if (key && value) {
            params[key] = value;
          }
        }
      }

      toolCalls.push({
        name: toolName,
        params,
        fullMatch,
      });
    }
  }

  return toolCalls;
}

/**
 * Remove tool call XML from content for display
 * Handles both complete and incomplete (streaming) tool calls
 */
function stripToolCalls(content: string): string {
  let result = content;
  for (const toolName of VALID_TOOLS) {
    // 1. Remove complete tool calls
    const regex = new RegExp(`<${toolName}>[\\s\\S]*?</${toolName}>`, "g");
    result = result.replace(regex, "");

    // 2. Remove incomplete tool calls (start tag present but not closed)
    const openTag = `<${toolName}>`;
    const openIndex = result.lastIndexOf(openTag);
    
    if (openIndex !== -1) {
      // Check if there is a corresponding closing tag AFTER it
      const closeTag = `</${toolName}>`;
      const afterOpen = result.slice(openIndex);
      
      // If no closing tag in the remainder, it's incomplete -> strip it and everything after
      if (!afterOpen.includes(closeTag)) {
        result = result.slice(0, openIndex);
      }
    }
  }
  return result.trim();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useAutoScroll(messagesContainerRef, messages);

  /**
   * Execute a tool call via the API
   */
  const executeTool = useCallback(
    async (toolCall: ParsedToolCall): Promise<ToolApiResponse> => {
      try {
        const response = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: toolCall.name,
            params: toolCall.params,
          }),
        });

        const data: ToolApiResponse = await response.json();
        return data;
      } catch (error) {
        return {
          success: false,
          tool: toolCall.name,
          error: error instanceof Error ? error.message : "Tool execution failed",
        };
      }
    },
    []
  );

  /**
   * Update a tool call's status in a message
   */
  const updateToolCallStatus = useCallback(
    (messageId: string, toolId: string, status: ToolStatus, result?: ToolResult, errorMessage?: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || !msg.toolCalls) return msg;
          return {
            ...msg,
            toolCalls: msg.toolCalls.map((tc) =>
              tc.id === toolId ? { ...tc, status, result, errorMessage } : tc
            ),
          };
        })
      );
    },
    []
  );

  /**
   * Send messages to the chat API and handle streaming response
   */
  const sendToApi = useCallback(
    async (
      messagesToSend: { role: string; content: string }[],
      assistantMessageId: string
    ): Promise<string> => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSend }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setIsStreaming(true);

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
                fullContent += parsed.content;

                // Update message content, always stripping tool tags (complete or incomplete)
                const displayContent = stripToolCalls(fullContent);

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: displayContent }
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

      setIsStreaming(false);
      return fullContent;
    },
    []
  );

  /**
   * Main send handler with tool execution loop
   */
  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for API
      let conversationHistory: { role: string; content: string }[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      let continueLoop = true;
      let loopCount = 0;
      const maxLoops = 9999; // Prevent infinite loops

      while (continueLoop && loopCount < maxLoops) {
        loopCount++;
        const assistantMessageId = crypto.randomUUID();

        // Create empty assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "", toolCalls: [] },
        ]);

        // Get AI response
        const fullResponse = await sendToApi(conversationHistory, assistantMessageId);

        // Check for tool calls in the response
        const toolCalls = parseToolCalls(fullResponse);

        if (toolCalls.length > 0) {
          // We have tool calls to execute
          const toolCall = toolCalls[0]; // Execute one at a time

          // Create tool call record
          const toolCallRecord: ToolCall = {
            id: crypto.randomUUID(),
            name: toolCall.name,
            params: toolCall.params,
            status: "running",
          };

          // Update message with tool call (show only non-tool content)
          const displayContent = stripToolCalls(fullResponse);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: displayContent, toolCalls: [toolCallRecord] }
                : msg
            )
          );

          setIsExecutingTool(true);

          // Execute the tool
          const result = await executeTool(toolCall);

          // Update tool call status
          updateToolCallStatus(
            assistantMessageId,
            toolCallRecord.id,
            result.success ? "success" : "error",
            result.result,
            result.error
          );

          setIsExecutingTool(false);

          // Format result for AI
          const toolResultContent = result.success
            ? `[[[tool_result: ${JSON.stringify(result.result)}]]]`
            : `[[[tool_error: ${result.error}]]]`;

          // Add assistant response and tool result to history
          conversationHistory = [
            ...conversationHistory,
            { role: "assistant", content: fullResponse },
            { role: "user", content: toolResultContent },
          ];

          // Continue the loop to let AI respond to the tool result
          continueLoop = true;
        } else {
          // No tool calls, we're done
          continueLoop = false;

          // Update final message content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }

      const errorContent =
        error instanceof Error
          ? `Error: ${error.message}`
          : "Sorry, something went wrong. Please try again.";

      setMessages((prev) => {
        // Check if we have an empty assistant message to update
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant" && !lastMsg.content) {
          return prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, content: errorContent } : msg
          );
        }
        // Otherwise add a new error message
        return [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: errorContent },
        ];
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsExecutingTool(false);
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
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-slate-50 p-4"
      >
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
                  <div className="space-y-2">
                    {/* Text Content */}
                    {message.content && (
                      <MarkdownRenderer content={message.content} />
                    )}
                    {/* Tool Calls */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="space-y-2">
                        {message.toolCalls.map((toolCall) => (
                          <ToolMessage key={toolCall.id} toolCall={toolCall} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {(isLoading && !isStreaming) && <ThinkingIndicator />}
            {isExecutingTool && (
              <div className="px-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Executing tool...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}