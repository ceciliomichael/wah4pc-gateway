/**
 * Push Data to Another Provider
 * POST /api/integration/push
 *
 * Pushes a FHIR resource directly to another provider via the WAH4PC Gateway.
 * Uses POST /api/v1/fhir/push/{resourceType} on the gateway.
 * Unlike queries, push requests are delivered immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateIntegrationConfig } from '@/lib/config';
import { InitiatePushRequestSchema } from '@/lib/types/integration';
import { initiatePush } from '@/lib/integration';

/**
 * POST /api/integration/push
 * Push a FHIR resource to another provider
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
    const parseResult = InitiatePushRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
          example: {
            targetId: 'target-provider-uuid',
            resourceType: 'Appointment',
            data: { resourceType: 'Appointment', status: 'booked' },
            reason: 'New Appointment Request',
            notes: 'Please confirm availability',
          },
        },
        { status: 400 }
      );
    }

    const { targetId, resourceType, data, reason, notes } = parseResult.data;

    console.log(`[Push] Initiating push of ${resourceType} to provider ${targetId}`);

    // 3. Send push to gateway
    const result = await initiatePush({
      targetId,
      resourceType,
      data,
      reason,
      notes,
    });

    // 4. Return the result
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        transactionId: result.transactionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Push] Failed to push data:', error);
    return NextResponse.json(
      {
        error: 'Failed to push data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}