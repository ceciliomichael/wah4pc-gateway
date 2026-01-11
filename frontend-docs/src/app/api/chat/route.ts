import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
}

const SYSTEM_PROMPT =
  "You are Zora, a helpful AI assistant for the WAH4PC Gateway documentation website. Help users understand the API, architecture, and integration processes. Be concise and helpful.";

const openai = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
      return NextResponse.json(
        { error: "AI configuration is missing" },
        { status: 500 }
      );
    }

    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-3.5-turbo",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `AI API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}