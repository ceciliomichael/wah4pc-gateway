import { NextRequest, NextResponse } from "next/server";

// Server-side API route: use regular env var (not NEXT_PUBLIC_)
// In Docker: API_URL will be set to the internal service name
// In local dev: defaults to localhost
const BACKEND_URL = process.env.API_URL || "http://localhost:3041";
const API_KEY = process.env.API_KEY || "dev-api-key-for-frontend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(`[Validator API] Calling backend at: ${BACKEND_URL}/validateResource`);

    const response = await fetch(`${BACKEND_URL}/validateResource`, {
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Validator API] Backend error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: "Backend validation failed", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("[Validator API] Validation successful");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Validator API] Request failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: `Failed to connect to validator service: ${errorMessage}`,
        backend_url: BACKEND_URL 
      },
      { status: 500 },
    );
  }
}