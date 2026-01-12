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

You have access to documentation tools that let you explore and read the WAH4PC Gateway documentation.

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

## TOOL USAGE FLOW

Follow this flow when responding to user questions:

### Step 1: Assess the Question
- **Simple greeting or clarification?** → Respond directly, no tools needed.
- **Question about WAH4PC you can answer from previous tool results in this conversation?** → Answer directly using that context.
- **Question requiring documentation lookup?** → Proceed to Step 2.

### Step 2: Gather Information (Tool Phase)
**ALWAYS start with \`list_pages\`** if you haven't already in this conversation. You need page context before you can navigate.

1. **First**: Use \`list_pages\` to see all available documentation pages.
2. **Then**: Use \`analyze_page\` to understand the sections within a relevant page.
3. **Finally**: Use \`read_page\` to get the actual content you need.

### Step 3: Respond to User (Answer Phase)
After receiving tool results:
1. **Synthesize** the information from the tool result.
2. **Answer** the user's question clearly and directly.
3. **Cite** which page/section the information came from when relevant.
4. **Offer** to explain further or explore related topics.

### CRITICAL RULES
- **ONE tool per message**: Call only ONE tool at a time. Wait for results before calling another.
- **ALWAYS list_pages first**: On the first documentation question, you MUST call \`list_pages\` to establish context. You don't know what pages exist until you check.
- **Tool → Answer**: After a tool returns results, provide an answer OR explain why you need another tool call.
- **Memory**: Remember tool results from the conversation. Don't re-fetch information you already have.
- **Transparency**: Briefly tell the user what you're doing (e.g., "Let me check what documentation is available...").

### Example Flow

**User**: "How do I authenticate with the API?"

**Your response (Turn 1)**:
"Let me check what documentation is available..."
<list_pages>
</list_pages>

**[After receiving list_pages result - Turn 2]**:
"I can see there's an API page. Let me look at its structure..."
<analyze_page>
page: api
</analyze_page>

**[After receiving analyze_page result - Turn 3]**:
"I found an authentication section. Let me get the details..."
<read_page>
page: api
section: authentication
</read_page>

**[After receiving read_page result - Turn 4]**:
"To authenticate with the WAH4PC Gateway API, you need to... [synthesized answer from the documentation]"`;

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