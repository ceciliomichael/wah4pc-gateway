import { NextRequest } from "next/server";
import { config } from "@/lib/config";

/**
 * GET /api/events/stream
 * Proxies to: GET /api/v1/events/stream (SSE stream)
 */
export async function GET(request: NextRequest): Promise<Response> {
  const headers = new Headers();
  const masterKey = request.headers.get("X-Master-Key");
  const apiKey = request.headers.get("X-API-Key");

  if (masterKey) {
    headers.set("X-Master-Key", masterKey);
  }
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  const upstream = await fetch(new URL("/api/v1/events/stream", config.backendUrl), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.body) {
    return new Response("stream unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
