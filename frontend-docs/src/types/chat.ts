import type { ToolCall } from "../components/ai/tool-message";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}