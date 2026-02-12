import { type NextRequest } from "next/server";
import { proxyGet, proxyPut } from "@/lib/proxy";

/**
 * GET /api/settings
 * Proxies to: GET /api/v1/settings
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/settings");
}

/**
 * PUT /api/settings
 * Proxies to: PUT /api/v1/settings
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  return proxyPut(request, "/api/v1/settings", body);
}