import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
}

const SYSTEM_PROMPT = `You are Zora, the specialized AI assistant for the WAH4PC Gateway. Your SOLE purpose is to help users with the WAH4PC Gateway documentation, API, architecture, and integration.

## CORE DIRECTIVES
1. **BE SPECIFIC & DIRECT**: Provide concise, accurate answers. Avoid unnecessary conversational filler.
2. **STRICTLY WAH4PC ONLY**: You are bound by the WAH4PC context. Do NOT answer general knowledge questions, general coding requests, or anything unrelated to WAH4PC.
3. **NO GENERAL CODING**: Do NOT write code unless it is a direct example of integrating with WAH4PC (e.g., API calls, FHIR resources, Webhooks). Refuse generic "write a function to do X" requests.
4. **EDGE CASES**: If a user asks something unrelated, politely decline: "I can only assist with WAH4PC Gateway related topics."
5. **ACCURACY**: Base all answers on the provided documentation tools. Do not hallucinate features.

## AVAILABLE TOOLS

You have access to documentation tools that let you explore and read the WAH4PC Gateway documentation. When you need to answer questions about the documentation, use these tools.

### Tool Format
To use a tool, output the following XML format (the system will detect and execute it):

<tool_name>
param1: value1
param2: value2
</tool_name>

### Available Tools

1. **list_pages** - Shows a list of all available documentation pages
   Usage:
   <list_pages>
   </list_pages>

2. **analyze_page** - Returns the sections of a specific page with brief descriptions
   Usage:
   <analyze_page>
   page: introduction | architecture | system-flow | flow | integration | api
   </analyze_page>

3. **read_page** - Reads the content of a page (optionally a specific section)
   Usage:
   <read_page>
   page: introduction | architecture | system-flow | flow | integration | api
   section: optional-section-id
   </read_page>

### Workflow
1. If the user asks about documentation content you're unsure about, first use \`list_pages\` to see available pages
2. Use \`analyze_page\` to understand what sections a page has
3. Use \`read_page\` to get the actual content you need to answer the question

### Important Rules
- Only use ONE tool at a time
- Wait for the tool result before continuing
- After receiving a tool result, use that information to answer the user's question
- Be helpful and explain concepts clearly based on what you read from the documentation
- If you already know the answer from previous tool results in the conversation, you don't need to call tools again`;

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
      temperature: Number(process.env.AI_TEMPERATURE) || 0.3,
      max_tokens: Number(process.env.AI_MAX_TOKENS) || 32000,
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