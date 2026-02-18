interface GatewayPractitionerSyncResult {
  ok: boolean;
  status?: number;
  error?: string;
}

function buildGatewayWebhookUrl(
  gatewayBaseUrl: string,
  providerId: string,
): string {
  const normalizedBaseUrl = gatewayBaseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/api/v1/providers/${providerId}/practitioners/webhook`;
}

export async function triggerGatewayPractitionerSyncWebhook(): Promise<GatewayPractitionerSyncResult> {
  const apiKey = process.env.WAH4PC_API_KEY;
  const providerId = process.env.WAH4PC_PROVIDER_ID;
  const gatewayUrl = process.env.WAH4PC_GATEWAY_URL;

  if (!apiKey || !providerId || !gatewayUrl) {
    return {
      ok: false,
      error:
        "WAH4PC_API_KEY, WAH4PC_PROVIDER_ID, and WAH4PC_GATEWAY_URL are required",
    };
  }

  try {
    const response = await fetch(
      buildGatewayWebhookUrl(gatewayUrl, providerId),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Gateway webhook returned ${response.status}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown webhook error",
    };
  }
}
