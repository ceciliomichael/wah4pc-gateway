import { type NextRequest } from "next/server";
import { proxyGet, proxyPost } from "@/lib/proxy";

/**
 * GET /api/providers
 * Proxies to: GET /api/v1/providers
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/providers");
}

/**
 * POST /api/providers
 * Proxies to: POST /api/v1/providers
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyPost(request, "/api/v1/providers", body);
}