/**
 * Outgoing Requests API
 * GET /api/integration/outgoing - List all outgoing transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { integrationDb } from '@/lib/integration/db';

/**
 * GET /api/integration/outgoing
 * Returns all outgoing transactions (requests we made to other providers)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const transactions = await integrationDb.getAllTransactions();
    const receivedData = await integrationDb.getAllReceivedData();

    // Sort by createdAt descending (newest first)
    const sortedTransactions = transactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Enrich transactions with received data
    const enrichedTransactions = sortedTransactions.map((tx) => {
      const data = receivedData.find((r) => r.transactionId === tx.transactionId);
      return {
        ...tx,
        receivedData: data?.data || null,
        receivedAt: data?.receivedAt || null,
      };
    });

    // Group by status
    const pending = enrichedTransactions.filter((t) => t.status === 'PENDING');
    const completed = enrichedTransactions.filter((t) => t.status !== 'PENDING');

    return NextResponse.json({
      total: transactions.length,
      pendingCount: pending.length,
      transactions: enrichedTransactions,
      summary: {
        pending: pending.length,
        completed: completed.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to get outgoing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve outgoing transactions' },
      { status: 500 }
    );
  }
}