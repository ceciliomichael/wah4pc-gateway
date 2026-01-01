/**
 * Centralized configuration for the documentation site.
 * Uses environment variables with sensible defaults.
 */

export const config = {
  /**
   * The base URL of the WAH4PC Gateway.
   * Used throughout the documentation for code examples and API references.
   */
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.wah4pc.com",
};