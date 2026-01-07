/**
 * Application Configuration
 * Loads environment variables for WAH4PC Gateway integration
 */

interface AppSettings {
  /** Clinic/Provider display name (used in UI) */
  clinicName: string;
}

interface IntegrationConfig {
  /** Gateway base URL (e.g., http://localhost:8080) */
  gatewayUrl: string;
  /** Provider ID obtained after registration */
  providerId: string;
  /** API key for authenticating requests to the gateway */
  apiKey: string;
  /** Secret key to validate incoming webhook requests from gateway */
  gatewayAuthKey: string;
  /** This provider's publicly accessible base URL */
  providerBaseUrl: string;
  /** Provider name for registration */
  providerName: string;
  /** Provider type (clinic, hospital, laboratory, pharmacy) */
  providerType: string;
}

interface AppConfig {
  app: AppSettings;
  integration: IntegrationConfig;
  isDev: boolean;
}

function getEnvVar(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue;
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`[Config] Missing environment variable: ${key}`);
  }
  return value || '';
}

/**
 * Application configuration object
 * All integration-related settings are loaded from environment variables
 */
export const config: AppConfig = {
  app: {
    clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || 'FHIR Clinic',
  },
  integration: {
    gatewayUrl: getEnvVar('WAH4PC_GATEWAY_URL', 'http://localhost:8080'),
    providerId: getEnvVar('WAH4PC_PROVIDER_ID'),
    apiKey: getEnvVar('WAH4PC_API_KEY'),
    gatewayAuthKey: getEnvVar('GATEWAY_AUTH_KEY'),
    providerBaseUrl: getEnvVar('PROVIDER_BASE_URL', 'http://localhost:3000'),
    providerName: getEnvVar('PROVIDER_NAME', 'WAH4Mock Provider'),
    providerType: getEnvVar('PROVIDER_TYPE', 'hospital'),
  },
  isDev: process.env.NODE_ENV !== 'production',
};

/**
 * Validate that required integration config is present
 * Call this before making outbound requests to the gateway
 */
export function validateIntegrationConfig(): { valid: boolean; missing: string[] } {
  const required: (keyof IntegrationConfig)[] = ['gatewayUrl', 'providerId', 'apiKey'];
  const missing: string[] = [];

  for (const key of required) {
    if (!config.integration[key]) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if gateway auth key is configured for webhook validation
 */
export function isGatewayAuthConfigured(): boolean {
  return Boolean(config.integration.gatewayAuthKey);
}

export default config;