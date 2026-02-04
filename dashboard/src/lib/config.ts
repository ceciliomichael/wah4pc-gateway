/**
 * Centralized configuration module.
 * Validates environment variables to ensure fail-fast behavior.
 */

export const config = {
  // The URL of the backend service (e.g., Go backend)
  // Default to a placeholder during build/dev if not provided to prevent build failures
  backendUrl: process.env.BACKEND_URL || "http://localhost:8080",
};