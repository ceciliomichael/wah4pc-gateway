import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3041";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/validateResource`, {
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        "X-API-Key": "dev-api-key-for-frontend",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Backend validation failed", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Validation API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}