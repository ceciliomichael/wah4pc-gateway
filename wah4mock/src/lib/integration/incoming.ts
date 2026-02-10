/**
 * Integration Service - Incoming Request Handlers
 * Handles requests FROM other providers that need approval
 */

import { v4 as uuidv4 } from 'uuid';
import { integrationDb } from './db';
import { db } from '../db';
import { findPatientByIdentifiers, formatPatientForGateway, sendToGateway } from './common';
import type {
  ProcessQueryPayload,
  ReceivePushPayload,
  GatewayResponse,
  IncomingRequest,
} from '../types/integration';
import type { Appointment } from '../types/fhir';

// ============================================================================
// Webhook Handler: Process Query
// ============================================================================

/**
 * Handle incoming process-query webhook from gateway
 * Called when another provider requests data from us
 *
 * Instead of auto-processing, this saves the request for manual approval
 */
export async function handleProcessQuery(
  payload: ProcessQueryPayload
): Promise<{ saved: boolean; requestId?: string }> {
  const { transactionId, requesterId, identifiers, gatewayReturnUrl, resourceType, reason, notes } = payload;

  console.log(`[Integration] Received query ${transactionId} for ${resourceType}`);
  console.log(`[Integration] From requester: ${requesterId}`);

  // Check for duplicate (idempotency)
  if (await integrationDb.incomingRequestExists(transactionId)) {
    console.log(`[Integration] Request ${transactionId} already exists, skipping`);
    return { saved: true };
  }

  // Save as pending approval - user must manually approve/reject
  const request = await integrationDb.saveIncomingRequest({
    transactionId,
    requesterId,
    identifiers,
    resourceType,
    gatewayReturnUrl,
    reason,
    notes,
  });

  console.log(`[Integration] Saved incoming request ${request.id} for approval`);

  return { saved: true, requestId: request.id };
}

// ============================================================================
// Approval/Rejection Handlers
// ============================================================================

/**
 * Approve an incoming request and send data to the gateway
 */
export async function approveIncomingRequest(
  requestId: string
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  // Get the request
  const request = await integrationDb.getIncomingRequestById(requestId);

  if (!request) {
    return { success: false, message: 'Request not found' };
  }

  if (request.status !== 'PENDING_APPROVAL') {
    return { success: false, message: `Request already processed with status: ${request.status}` };
  }

  // Update status to processing
  await integrationDb.updateIncomingRequestStatus(requestId, 'PROCESSING');

  console.log(`[Integration] Processing approved request ${requestId}`);

  let responsePayload: GatewayResponse;

  try {
    // Currently only supporting Patient resource
    if (request.resourceType !== 'Patient') {
      responsePayload = {
        transactionId: request.transactionId,
        status: 'REJECTED',
        data: {
          error: `Resource type '${request.resourceType}' is not supported`,
          supportedTypes: ['Patient'],
        },
      };
    } else {
      // Search for patient
      const patient = await findPatientByIdentifiers(request.identifiers);

      if (!patient) {
        console.log(`[Integration] No patient found for request ${requestId}`);
        responsePayload = {
          transactionId: request.transactionId,
          status: 'REJECTED',
          data: {
            error: 'Patient not found',
            searchedIdentifiers: request.identifiers,
          },
        };
      } else {
        console.log(`[Integration] Found patient ${patient.id} for request ${requestId}`);
        responsePayload = {
          transactionId: request.transactionId,
          status: 'SUCCESS',
          data: formatPatientForGateway(patient, request.identifiers),
        };
      }
    }

    // Send response to gateway
    await sendToGateway(request.gatewayReturnUrl, responsePayload);

    // Update status based on response
    const finalStatus = responsePayload.status === 'SUCCESS' ? 'SUCCESS' : 'REJECTED';
    await integrationDb.updateIncomingRequestStatus(requestId, finalStatus, responsePayload.data);

    console.log(`[Integration] Sent response for request ${requestId}, status: ${finalStatus}`);

    return {
      success: true,
      message: `Request processed successfully with status: ${finalStatus}`,
      data: responsePayload.data,
    };
  } catch (error) {
    console.error(`[Integration] Error processing request ${requestId}:`, error);

    // Update status to error
    await integrationDb.updateIncomingRequestStatus(requestId, 'ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Attempt to notify gateway of error
    try {
      await sendToGateway(request.gatewayReturnUrl, {
        transactionId: request.transactionId,
        status: 'ERROR',
        data: {
          error: 'Internal processing error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (sendError) {
      console.error(`[Integration] Failed to send error response:`, sendError);
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reject an incoming request (user manually rejected)
 */
export async function rejectIncomingRequest(
  requestId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  // Get the request
  const request = await integrationDb.getIncomingRequestById(requestId);

  if (!request) {
    return { success: false, message: 'Request not found' };
  }

  if (request.status !== 'PENDING_APPROVAL') {
    return { success: false, message: `Request already processed with status: ${request.status}` };
  }

  console.log(`[Integration] Rejecting request ${requestId}`);

  try {
    // Send rejection to gateway
    await sendToGateway(request.gatewayReturnUrl, {
      transactionId: request.transactionId,
      status: 'REJECTED',
      data: {
        error: 'Request rejected by provider',
        reason: reason || 'No reason provided',
      },
    });

    // Update status
    await integrationDb.updateIncomingRequestStatus(requestId, 'REJECTED_BY_USER', {
      rejectionReason: reason || 'No reason provided',
    });

    console.log(`[Integration] Rejected request ${requestId}`);

    return { success: true, message: 'Request rejected successfully' };
  } catch (error) {
    console.error(`[Integration] Error rejecting request ${requestId}:`, error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reject request',
    };
  }
}

// ============================================================================
// Webhook Handler: Receive Push (Unsolicited Data)
// ============================================================================

/**
 * Handle incoming push webhook from gateway
 * Called when another provider pushes data to us without a prior request
 * (e.g., incoming referrals, appointments)
 *
 * Auto-saves Appointment resources to the local database
 */
export async function handleReceivePush(
  payload: ReceivePushPayload
): Promise<{ success: boolean; message: string; resourceSaved?: boolean }> {
  const { transactionId, senderId, resourceType, data, reason, notes } = payload;

  console.log(`[Integration] Received push ${transactionId} for ${resourceType} from ${senderId}`);
  if (reason) console.log(`[Integration] Reason: ${reason}`);
  if (notes) console.log(`[Integration] Notes: ${notes}`);

  // Check for duplicate delivery (idempotency)
  if (await integrationDb.dataAlreadyReceived(transactionId)) {
    console.log(`[Integration] Push data already received for ${transactionId}, skipping`);
    return {
      success: true,
      message: 'Data already received (idempotent)',
    };
  }

  // Store the received data in integration log
  await integrationDb.saveReceivedData({
    transactionId,
    resourceType,
    status: 'SUCCESS',
    data: data || {},
  });

  console.log(`[Integration] Stored push data for transaction ${transactionId}`);

  // =========================================================================
  // AUTO-SAVE: Save received resource to local database
  // =========================================================================
  let resourceSaved = false;

  if (data && resourceType === 'Appointment') {
    try {
      resourceSaved = await saveReceivedAppointmentToLocalDb(data, transactionId, senderId);
    } catch (error) {
      // Log but don't fail - the integration data is already saved
      console.error(`[Integration] Failed to auto-save appointment to local DB:`, error);
    }
  }

  return {
    success: true,
    message: 'Push data received successfully',
    resourceSaved,
  };
}

/**
 * Save a received Appointment resource to the local Appointment.json database
 */
async function saveReceivedAppointmentToLocalDb(
  data: Record<string, unknown>,
  transactionId: string,
  senderId: string
): Promise<boolean> {
  if (data.resourceType !== 'Appointment') {
    console.warn(`[Integration] Expected Appointment resource but got: ${data.resourceType}`);
    return false;
  }

  const receivedAppointment = data as unknown as Appointment;

  // Generate a local ID if not present
  const localId = receivedAppointment.id || `appt-${uuidv4().slice(0, 8)}`;

  // Add integration metadata extension
  const appointmentToSave: Appointment = {
    ...receivedAppointment,
    id: localId,
    extension: [
      ...(receivedAppointment.extension || []),
      {
        url: 'urn:wah4pc:integration',
        extension: [
          { url: 'transactionId', valueString: transactionId },
          { url: 'senderId', valueString: senderId },
          { url: 'receivedAt', valueDateTime: new Date().toISOString() },
          { url: 'source', valueString: 'gateway-push' },
        ],
      },
    ],
  };

  await db.create('Appointment', appointmentToSave);
  console.log(`[Integration] Auto-saved pushed appointment to local DB: ${localId}`);
  return true;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all incoming requests (for UI display)
 */
export async function getIncomingRequests(): Promise<IncomingRequest[]> {
  return integrationDb.getAllIncomingRequests();
}