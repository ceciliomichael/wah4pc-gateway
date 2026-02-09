import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

/**
 * GET /api/logs/dates
 * Proxies to: GET /api/v1/logs/dates
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/logs/dates");
}