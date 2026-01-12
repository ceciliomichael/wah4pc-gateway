import { NextRequest, NextResponse } from "next/server";
import {
  executeDocsTool,
  type ToolName,
  type ToolRequest,
  type ToolResponse,
} from "@/lib/ai/docs-service";

interface ToolRequestBody {
  tool: string;
  params?: Record<string, string>;
}

const VALID_TOOLS: ToolName[] = ["list_pages", "analyze_page", "read_page"];

function isValidToolName(tool: string): tool is ToolName {
  return VALID_TOOLS.includes(tool as ToolName);
}

export async function POST(request: NextRequest): Promise<NextResponse<ToolResponse>> {
  try {
    const body: ToolRequestBody = await request.json();
    const { tool, params } = body;

    // Validate tool name
    if (!tool || typeof tool !== "string") {
      return NextResponse.json(
        {
          success: false,
          tool: "unknown" as ToolName,
          error: "Missing or invalid tool parameter",
        },
        { status: 400 }
      );
    }

    if (!isValidToolName(tool)) {
      return NextResponse.json(
        {
          success: false,
          tool: tool as ToolName,
          error: `Invalid tool: ${tool}. Valid tools are: ${VALID_TOOLS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Execute the tool
    const toolRequest: ToolRequest = { tool, params };
    const result = executeDocsTool(toolRequest);

    // Return appropriate status code based on success
    const status = result.success ? 200 : result.error?.includes("not found") ? 404 : 400;

    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("Tool API Error:", error);

    return NextResponse.json(
      {
        success: false,
        tool: "unknown" as ToolName,
        error: error instanceof Error ? error.message : "Failed to execute tool",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list available tools and their descriptions
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    tools: [
      {
        name: "list_pages",
        description: "Returns a list of all available documentation pages with their titles and descriptions",
        params: null,
        example: { tool: "list_pages" },
      },
      {
        name: "analyze_page",
        description: "Returns detailed section information for a specific documentation page",
        params: {
          page: {
            required: true,
            type: "string",
            description: "Page ID (introduction, architecture, system-flow, flow, integration, api)",
          },
        },
        example: { tool: "analyze_page", params: { page: "architecture" } },
      },
      {
        name: "read_page",
        description: "Reads the actual content of a documentation page, optionally a specific section",
        params: {
          page: {
            required: true,
            type: "string",
            description: "Page ID (introduction, architecture, system-flow, flow, integration, api)",
          },
          section: {
            required: false,
            type: "string",
            description: "Optional section ID to extract specific content",
          },
        },
        example: { tool: "read_page", params: { page: "flow", section: "json-examples" } },
      },
    ],
  });
}