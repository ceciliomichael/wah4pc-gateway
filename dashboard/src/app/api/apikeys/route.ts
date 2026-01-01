import { type NextRequest } from "next/server";
import { proxyGet, proxyPost } from "@/lib/proxy";

/**
 * GET /api/apikeys
 * Proxies to: GET /api/v1/apikeys
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/apikeys");
}

/**
 * POST /api/apikeys
 * Proxies to: POST /api/v1/apikeys
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyPost(request, "/api/v1/apikeys", body);
}