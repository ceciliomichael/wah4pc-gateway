import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

/**
 * GET /api/logs/[date]/[id]
 * Proxies to: GET /api/v1/logs/[date]/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string; id: string }> }
) {
  const { date, id } = await params;
  return proxyGet(request, `/api/v1/logs/${date}/${id}`);
}