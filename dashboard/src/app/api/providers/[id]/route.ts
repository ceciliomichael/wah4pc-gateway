import { type NextRequest } from "next/server";
import { proxyGet, proxyPut, proxyDelete } from "@/lib/proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/providers/[id]
 * Proxies to: GET /api/v1/providers/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyGet(request, `/api/v1/providers/${id}`);
}

/**
 * PUT /api/providers/[id]
 * Proxies to: PUT /api/v1/providers/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  return proxyPut(request, `/api/v1/providers/${id}`, body);
}

/**
 * DELETE /api/providers/[id]
 * Proxies to: DELETE /api/v1/providers/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyDelete(request, `/api/v1/providers/${id}`);
}