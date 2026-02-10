/**
 * Webhook: Receive Push (Unsolicited Data)
 * Called by the gateway when another provider pushes data to us
 * without a prior request (e.g., incoming referrals, appointments).
 *
 * POST /api/fhir/receive-push
 *
 * Payload format (from wah4pc-documentation):
 * {
 *   transactionId: string (UUID),
 *   senderId: string (UUID),
 *   resourceType: string,
 *   data: Record<string, unknown>,
 *   reason?: string,
 *   notes?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { config, isGatewayAuthConfigured } from '@/lib/config';
import { ReceivePushPayloadSchema } from '@/lib/types/integration';
import { handleReceivePush } from '@/lib/integration';

/**
 * Validate the X-Gateway-Auth header
 */
function validateGatewayAuth(request: NextRequest): boolean {
  if (!isGatewayAuthConfigured()) {
    console.warn('[Webhook] No GATEWAY_AUTH_KEY configured - skipping auth validation');
    return true;
  }

  const authHeader = request.headers.get('x-gateway-auth');
  return authHeader === config.integration.gatewayAuthKey;
}

/**
 * POST /api/fhir/receive-push
 * Receives unsolicited data pushed from another provider via the gateway
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
    const parseResult = ReceivePushPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      console.error('[Webhook] Invalid push payload:', parseResult.error.flatten());
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    console.log(`[Webhook] Received push: txn=${payload.transactionId}, from=${payload.senderId}, type=${payload.resourceType}`);
    if (payload.reason) console.log(`[Webhook] Reason: ${payload.reason}`);

    // 3. Process the received push
    const result = await handleReceivePush(payload);

    if (!result.success) {
      console.warn(`[Webhook] Push processing issue: ${result.message}`);
      // Still return 200 to avoid gateway retries
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      );
    }

    // 4. Return success acknowledgment
    console.log(`[Webhook] Successfully processed push for ${payload.transactionId}`);
    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook] Error in receive-push:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}