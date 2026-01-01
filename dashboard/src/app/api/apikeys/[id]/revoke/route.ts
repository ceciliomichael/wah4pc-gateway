import { type NextRequest } from "next/server";
import { proxyPost } from "@/lib/proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/apikeys/[id]/revoke
 * Proxies to: POST /api/v1/apikeys/{id}/revoke
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyPost(request, `/api/v1/apikeys/${id}/revoke`);
}