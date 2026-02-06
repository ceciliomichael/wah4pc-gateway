/**
 * Providers Proxy Endpoint
 * Fetches the list of registered providers from the Gateway
 *
 * GET /api/integration/providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import type { Provider } from '@/lib/types/integration';

/**
 * GET /api/integration/providers
 * Returns list of providers from the gateway (excluding ourselves)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { gatewayUrl, providerId } = config.integration;

    if (!gatewayUrl) {
      return NextResponse.json(
        { error: 'Gateway URL not configured' },
        { status: 500 }
      );
    }

    const { apiKey } = config.integration;

    console.log(`[Providers] Fetching providers from ${gatewayUrl}/api/v1/providers`);

    // Fetch providers without authentication (public endpoint)
    const response = await fetch(`${gatewayUrl}/api/v1/providers`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Providers] Gateway request failed: ${response.status} - ${errorText}`);
      return NextResponse.json(
        {
          error: 'Failed to fetch providers from gateway',
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle different response formats from gateway
    // Could be { providers: [...] } or { data: [...] } or just [...]
    let providers: Provider[] = [];

    if (Array.isArray(data)) {
      providers = data;
    } else if (data.providers && Array.isArray(data.providers)) {
      providers = data.providers;
    } else if (data.data && Array.isArray(data.data)) {
      providers = data.data;
    }

    // Filter out ourselves from the list (can't request data from ourselves)
    const filteredProviders = providerId
      ? providers.filter((p) => p.id !== providerId)
      : providers;

    console.log(`[Providers] Found ${filteredProviders.length} providers (excluding self)`);

    return NextResponse.json({
      providers: filteredProviders,
      total: filteredProviders.length,
    });
  } catch (error) {
    console.error('[Providers] Error fetching providers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch providers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}