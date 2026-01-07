/**
 * Integration Service - Main Export
 * Facade pattern to maintain backward compatibility with existing imports
 */

// Re-export all functions from modules
export {
  findPatientByIdentifiers,
  findPatientByFHIRIdentifiers,
  formatPatientForGateway,
  sendToGateway,
  registerProvider,
} from './common';

export {
  handleProcessQuery,
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
} from './incoming';

export {
  handleReceiveResults,
  initiatePatientQuery,
  IdempotencyConflictError,
} from './outgoing';

// Re-export integrationDb for convenience
export { integrationDb } from './db';

// ============================================================================
// Legacy Service Object (for backward compatibility)
// ============================================================================

import { findPatientByIdentifiers, registerProvider } from './common';
import {
  handleProcessQuery,
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
} from './incoming';
import { handleReceiveResults, initiatePatientQuery } from './outgoing';

/**
 * Integration service object - maintains backward compatibility
 * with code that imports `integrationService` from `./service`
 */
export const integrationService = {
  // Webhook handlers
  handleProcessQuery,
  handleReceiveResults,
  // Incoming request management
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
  // Outbound requests
  initiatePatientQuery,
  registerProvider,
  // Utilities
  findPatientByIdentifiers,
};