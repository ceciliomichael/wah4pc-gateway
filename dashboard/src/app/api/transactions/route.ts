import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

/**
 * GET /api/transactions
 * Proxies to: GET /api/v1/transactions
 */
export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/v1/transactions");
}