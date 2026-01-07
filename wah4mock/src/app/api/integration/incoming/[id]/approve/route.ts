/**
 * Approve Incoming Request API
 * POST /api/integration/incoming/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { approveIncomingRequest } from '@/lib/integration';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/integration/incoming/[id]/approve
 * Approves an incoming request and sends data to the gateway
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    console.log(`[API] Approving incoming request: ${id}`);

    const result = await approveIncomingRequest(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] Failed to approve request:', error);
    return NextResponse.json(
      { error: 'Failed to approve request' },
      { status: 500 }
    );
  }
}