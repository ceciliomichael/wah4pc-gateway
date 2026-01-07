/**
 * Reject Incoming Request API
 * POST /api/integration/incoming/[id]/reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectIncomingRequest } from '@/lib/integration';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RejectBodySchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/integration/incoming/[id]/reject
 * Rejects an incoming request and notifies the gateway
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Parse optional reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      const parsed = RejectBodySchema.safeParse(body);
      if (parsed.success) {
        reason = parsed.data.reason;
      }
    } catch {
      // No body provided, that's fine
    }

    console.log(`[API] Rejecting incoming request: ${id}`);

    const result = await rejectIncomingRequest(id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] Failed to reject request:', error);
    return NextResponse.json(
      { error: 'Failed to reject request' },
      { status: 500 }
    );
  }
}