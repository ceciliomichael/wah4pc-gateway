import { type NextRequest } from "next/server";
import { proxyPost } from "@/lib/proxy";

/**
 * POST /api/providers/[id]/status
 * Proxies to: POST /api/v1/providers/{id}/status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return proxyPost(request, `/api/v1/providers/${id}/status`, body);
}