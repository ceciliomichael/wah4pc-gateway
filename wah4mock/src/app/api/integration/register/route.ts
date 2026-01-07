/**
 * Provider Registration Endpoint
 * Utility endpoint to register this provider with the WAH4PC Gateway
 *
 * POST /api/integration/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { registerProvider } from '@/lib/integration';

/**
 * POST /api/integration/register
 * Registers this provider with the gateway
 * Returns the provider ID that should be saved to .env
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Register] Starting provider registration...');

    // Check if already registered
    if (config.integration.providerId) {
      return NextResponse.json(
        {
          message: 'Provider already registered',
          providerId: config.integration.providerId,
          hint: 'If you need to re-register, remove WAH4PC_PROVIDER_ID from .env first',
        },
        { status: 200 }
      );
    }

    // Validate base URL is configured
    if (!config.integration.providerBaseUrl) {
      return NextResponse.json(
        {
          error: 'PROVIDER_BASE_URL not configured',
          hint: 'Set PROVIDER_BASE_URL in .env to your publicly accessible URL',
        },
        { status: 400 }
      );
    }

    // Validate gateway URL is configured
    if (!config.integration.gatewayUrl) {
      return NextResponse.json(
        {
          error: 'WAH4PC_GATEWAY_URL not configured',
          hint: 'Set WAH4PC_GATEWAY_URL in .env (default: http://localhost:8080)',
        },
        { status: 400 }
      );
    }

    // Register with gateway
    const result = await registerProvider();

    return NextResponse.json(
      {
        success: true,
        message: 'Provider registered successfully',
        providerId: result.id,
        provider: result,
        nextSteps: [
          `Add this to your .env: WAH4PC_PROVIDER_ID=${result.id}`,
          'Restart your application to apply the changes',
          'You can now request data from other providers',
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register] Registration failed:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Ensure the gateway is running and accessible',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integration/register
 * Returns current registration status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const isRegistered = Boolean(config.integration.providerId);

  return NextResponse.json({
    registered: isRegistered,
    providerId: config.integration.providerId || null,
    gatewayUrl: config.integration.gatewayUrl,
    providerBaseUrl: config.integration.providerBaseUrl,
    providerName: config.integration.providerName,
    providerType: config.integration.providerType,
  });
}