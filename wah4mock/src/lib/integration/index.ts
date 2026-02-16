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
  handleReceivePush,
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
} from './incoming';

export {
  handleReceiveResults,
  initiateQuery,
  initiatePatientQuery,
  initiatePush,
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
  handleReceivePush,
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
} from './incoming';
import { handleReceiveResults, initiateQuery, initiatePatientQuery, initiatePush } from './outgoing';

/**
 * Integration service object - maintains backward compatibility
 * with code that imports `integrationService` from `./service`
 */
export const integrationService = {
  // Webhook handlers
  handleProcessQuery,
  handleReceiveResults,
  handleReceivePush,
  // Incoming request management
  approveIncomingRequest,
  rejectIncomingRequest,
  getIncomingRequests,
  // Outbound requests
  initiateQuery,
  initiatePatientQuery,
  initiatePush,
  registerProvider,
  // Utilities
  findPatientByIdentifiers,
};
