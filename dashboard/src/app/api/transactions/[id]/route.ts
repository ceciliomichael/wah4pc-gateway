import { type NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transactions/[id]
 * Proxies to: GET /api/v1/transactions/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyGet(request, `/api/v1/transactions/${id}`);
}