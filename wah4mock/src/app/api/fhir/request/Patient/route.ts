/**
 * Request Patient Data Endpoint
 * Initiates a request to fetch patient data from another provider
 *
 * POST /api/fhir/request/Patient
 * 
 * Supports Idempotency-Key header for safe retries:
 * - If provided, the same key can be used to retry failed requests
 * - If not provided, a new UUID v4 is generated automatically
 * - Keys are cached for 24 hours on the gateway
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateIntegrationConfig } from '@/lib/config';
import { InitiateQueryRequestSchema } from '@/lib/types/integration';
import { initiateQuery, IdempotencyConflictError } from '@/lib/integration';
import { integrationDb } from '@/lib/integration/db';

/**
 * POST /api/fhir/request/Patient
 * Initiates a request to fetch patient data from another provider
 * 
 * Headers:
 * - Idempotency-Key (optional): UUID v4 for safe retries. Reuse when retrying failed requests.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate integration is configured
    const configCheck = validateIntegrationConfig();
    if (!configCheck.valid) {
      return NextResponse.json(
        {
          error: 'Integration not configured',
          missing: configCheck.missing,
          hint: 'Ensure WAH4PC_PROVIDER_ID and WAH4PC_API_KEY are set in .env',
        },
        { status: 400 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parseResult = InitiateQueryRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
          example: {
            targetId: 'target-provider-uuid',
            identifiers: [
              { system: 'http://philhealth.gov.ph', value: '12-345678901-2' },
            ],
            reason: 'Optional reason for request',
            notes: 'Optional notes',
          },
        },
        { status: 400 }
      );
    }

    const { targetId, identifiers, selector, reason, notes } = parseResult.data;

    // 3. Get Idempotency-Key from header (optional - for safe retries)
    const idempotencyKey = request.headers.get('Idempotency-Key') || undefined;

    console.log(`[Request] Initiating patient query to provider ${targetId}${idempotencyKey ? ` (Idempotency-Key: ${idempotencyKey})` : ''}`);

    // 4. Send request to gateway
    const result = await initiateQuery({
      targetId,
      resourceType: 'Patient',
      identifiers,
      selector,
      reason,
      notes,
      idempotencyKey,
    });

    // 5. Return the transaction details with idempotency key
    return NextResponse.json(
      {
        success: true,
        message: 'Request submitted successfully',
        transaction: result.data,
        idempotencyKey: result.idempotencyKey,
        hint: 'The gateway will call /api/fhir/receive-results when data is available. Save the idempotencyKey to retry this request if needed.',
      },
      { status: 202 }
    );
  } catch (error) {
    // Handle 409 Conflict - request with same Idempotency-Key is still processing
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json(
        {
          error: 'Request still processing',
          message: error.message,
          idempotencyKey: error.idempotencyKey,
          retryAfterMs: error.retryAfterMs,
          hint: 'Your previous request with this Idempotency-Key is still being processed. Wait and retry.',
        },
        { 
          status: 409,
          headers: {
            'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)),
          },
        }
      );
    }

    console.error('[Request] Failed to initiate query:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fhir/request/Patient
 * Returns all pending and completed transactions
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const transactions = await integrationDb.getAllTransactions();
    const receivedData = await integrationDb.getAllReceivedData();

    // Enrich transactions with received data
    const enrichedTransactions = transactions.map((tx) => {
      const data = receivedData.find((r) => r.transactionId === tx.transactionId);
      return {
        ...tx,
        receivedData: data?.data || null,
        receivedAt: data?.receivedAt || null,
      };
    });

    return NextResponse.json({
      total: enrichedTransactions.length,
      transactions: enrichedTransactions,
    });
  } catch (error) {
    console.error('[Request] Failed to get transactions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transactions' },
      { status: 500 }
    );
  }
}
