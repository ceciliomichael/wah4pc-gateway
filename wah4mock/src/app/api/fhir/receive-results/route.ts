/**
 * Webhook: Receive Results
 * Called by the gateway when data we requested is now available
 *
 * POST /api/fhir/receive-results
 */

import { NextRequest, NextResponse } from 'next/server';
import { config, isGatewayAuthConfigured } from '@/lib/config';
import { ReceiveResultsPayloadSchema } from '@/lib/types/integration';
import { handleReceiveResults } from '@/lib/integration';

/**
 * Validate the X-Gateway-Auth header
 */
function validateGatewayAuth(request: NextRequest): boolean {
  if (!isGatewayAuthConfigured()) {
    // No auth key configured - allow (development mode)
    console.warn('[Webhook] No GATEWAY_AUTH_KEY configured - skipping auth validation');
    return true;
  }

  const authHeader = request.headers.get('x-gateway-auth');
  return authHeader === config.integration.gatewayAuthKey;
}

/**
 * POST /api/fhir/receive-results
 * Receives data from the gateway that we previously requested
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate gateway authentication
    if (!validateGatewayAuth(request)) {
      console.error('[Webhook] Unauthorized - invalid X-Gateway-Auth header');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid gateway authentication' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parseResult = ReceiveResultsPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('[Webhook] Invalid payload:', parseResult.error.flatten());
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    console.log(`[Webhook] Received results for transaction: ${payload.transactionId}, status: ${payload.status}`);

    // 3. Process the received results
    const result = await handleReceiveResults(payload);

    if (!result.success) {
      // Transaction not found - but we still return 200 to avoid retries
      // The gateway should not retry if the transaction is unknown
      console.warn(`[Webhook] ${result.message}`);
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      );
    }

    // 4. Return success acknowledgment
    console.log(`[Webhook] Successfully processed results for ${payload.transactionId}`);
    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Webhook] Error in receive-results:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}