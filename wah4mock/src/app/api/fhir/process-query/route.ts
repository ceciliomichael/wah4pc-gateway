/**
 * Webhook: Process Query
 * Called by the gateway when another provider requests data from us
 *
 * POST /api/fhir/process-query
 */

import { NextRequest, NextResponse } from 'next/server';
import { config, isGatewayAuthConfigured } from '@/lib/config';
import { ProcessQueryPayloadSchema } from '@/lib/types/integration';
import { handleProcessQuery } from '@/lib/integration';

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
 * POST /api/fhir/process-query
 * Receives queries from the gateway and queues them for manual approval
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
    console.log('[Webhook] Received payload:', JSON.stringify(body, null, 2));
    
    const parseResult = ProcessQueryPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('[Webhook] Validation failed:', parseResult.error.flatten());
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    console.log(`[Webhook] Received process-query for transaction: ${payload.transactionId}`);

    // 3. Save the request for manual approval (no longer auto-processes)
    const result = await handleProcessQuery(payload);

    // 4. Return immediate acknowledgment
    return NextResponse.json(
      {
        message: 'Request received and queued for approval',
        transactionId: payload.transactionId,
        requestId: result.requestId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Webhook] Error in process-query:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}