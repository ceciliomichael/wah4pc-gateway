/**
 * Request Resource Data Endpoint
 * Initiates a request to fetch resource data from another provider
 *
 * POST /api/fhir/request/[resourceType]
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateIntegrationConfig } from '@/lib/config';
import { InitiateQueryRequestSchema } from '@/lib/types/integration';
import { initiateQuery, IdempotencyConflictError } from '@/lib/integration';

interface RouteParams {
  params: Promise<{ resourceType: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType } = await params;
    if (!resourceType) {
      return NextResponse.json(
        { error: 'Resource type is required in route path' },
        { status: 400 }
      );
    }

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

    const body = await request.json();
    const parseResult = InitiateQueryRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
          example: {
            targetId: 'target-provider-uuid',
            selector: {
              patientIdentifiers: [{ system: 'http://philhealth.gov.ph', value: '12-345678901-2' }],
            },
            reason: 'Optional reason for request',
            notes: 'Optional notes',
          },
        },
        { status: 400 }
      );
    }

    const { targetId, identifiers, selector, reason, notes, resourceType: bodyResourceType } = parseResult.data;
    if (bodyResourceType && bodyResourceType !== resourceType) {
      return NextResponse.json(
        { error: `resourceType in body (${bodyResourceType}) must match path (${resourceType})` },
        { status: 400 }
      );
    }

    const idempotencyKey = request.headers.get('Idempotency-Key') || undefined;

    const result = await initiateQuery({
      targetId,
      resourceType,
      identifiers,
      selector,
      reason,
      notes,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Request submitted successfully',
        transaction: result.data,
        idempotencyKey: result.idempotencyKey,
        hint: 'The gateway will call /api/fhir/receive-results when data is available.',
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json(
        {
          error: 'Request still processing',
          message: error.message,
          idempotencyKey: error.idempotencyKey,
          retryAfterMs: error.retryAfterMs,
        },
        {
          status: 409,
          headers: {
            'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)),
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to initiate request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
