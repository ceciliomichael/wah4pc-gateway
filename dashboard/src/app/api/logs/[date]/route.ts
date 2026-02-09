import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

/**
 * GET /api/logs/[date]
 * Proxies to: GET /api/v1/logs/[date]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  return proxyGet(request, `/api/v1/logs/${date}`);
}