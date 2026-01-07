/**
 * Incoming Requests API
 * GET /api/integration/incoming - List all incoming requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { integrationDb } from '@/lib/integration/db';

/**
 * GET /api/integration/incoming
 * Returns all incoming requests with their status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const requests = await integrationDb.getAllIncomingRequests();

    // Sort by createdAt descending (newest first)
    const sortedRequests = requests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Group by status for convenience
    const pending = sortedRequests.filter((r) => r.status === 'PENDING_APPROVAL');
    const processing = sortedRequests.filter((r) => r.status === 'PROCESSING');
    const completed = sortedRequests.filter(
      (r) => !['PENDING_APPROVAL', 'PROCESSING'].includes(r.status)
    );

    return NextResponse.json({
      total: requests.length,
      pendingCount: pending.length,
      requests: sortedRequests,
      summary: {
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to get incoming requests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve incoming requests' },
      { status: 500 }
    );
  }
}