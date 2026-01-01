import { type NextRequest } from "next/server";
import { proxyGet, proxyDelete } from "@/lib/proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apikeys/[id]
 * Proxies to: GET /api/v1/apikeys/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyGet(request, `/api/v1/apikeys/${id}`);
}

/**
 * DELETE /api/apikeys/[id]
 * Proxies to: DELETE /api/v1/apikeys/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyDelete(request, `/api/v1/apikeys/${id}`);
}