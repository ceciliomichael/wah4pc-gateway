/**
 * Centralized configuration module.
 * Validates environment variables to ensure fail-fast behavior.
 */

export const config = {
  // The URL of the backend service (e.g., Go backend)
  backendUrl: process.env.BACKEND_URL,
};

// Validate required configuration
if (!config.backendUrl) {
  throw new Error(
    "BACKEND_URL environment variable is not defined. Please check your .env file."
  );
}