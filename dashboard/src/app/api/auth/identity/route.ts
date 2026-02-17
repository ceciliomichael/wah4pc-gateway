import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

/**
 * GET /api/auth/identity
 * Proxies to: GET /api/v1/auth/identity
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/auth/identity");
}

