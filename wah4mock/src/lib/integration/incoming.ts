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
  QuerySelector,
  Identifier,
} from '../types/integration';
import type { Appointment, Patient, Resource } from '../types/fhir';

/**
 * Handle incoming process-query webhook from gateway
 * Called when another provider requests data from us
 *
 * Instead of auto-processing, this saves the request for manual approval
 */
export async function handleProcessQuery(
  payload: ProcessQueryPayload
): Promise<{ saved: boolean; requestId?: string }> {
  const {
    transactionId,
    requesterId,
    identifiers,
    selector,
    gatewayReturnUrl,
    resourceType,
    reason,
    notes,
  } = payload;

  console.log(`[Integration] Received query ${transactionId} for ${resourceType}`);
  console.log(`[Integration] From requester: ${requesterId}`);

  if (await integrationDb.incomingRequestExists(transactionId)) {
    console.log(`[Integration] Request ${transactionId} already exists, skipping`);
    return { saved: true };
  }

  const request = await integrationDb.saveIncomingRequest({
    transactionId,
    requesterId,
    identifiers,
    selector,
    resourceType,
    gatewayReturnUrl,
    reason,
    notes,
  });

  console.log(`[Integration] Saved incoming request ${request.id} for approval`);
  return { saved: true, requestId: request.id };
}

function normalizeSelector(selector: QuerySelector | undefined, identifiers: Identifier[]): QuerySelector {
  const normalized: QuerySelector = selector ? { ...selector } : {};
  if ((!normalized.patientIdentifiers || normalized.patientIdentifiers.length === 0) && identifiers.length > 0) {
    normalized.patientIdentifiers = identifiers;
  }
  return normalized;
}

function getReferenceTail(reference: string | undefined): string | null {
  if (!reference) {
    return null;
  }
  const value = reference.trim();
  if (!value) {
    return null;
  }
  if (!value.includes('/')) {
    return value;
  }
  const segments = value.split('/');
  return segments[segments.length - 1] || null;
}

function collectReferenceValues(value: unknown, references: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectReferenceValues(item, references);
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const objectValue = value as Record<string, unknown>;
  for (const [key, nestedValue] of Object.entries(objectValue)) {
    if (key === 'reference' && typeof nestedValue === 'string') {
      references.push(nestedValue);
      continue;
    }
    collectReferenceValues(nestedValue, references);
  }
}

function buildCollectionBundle(resources: Resource[]): Record<string, unknown> {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map((resource) => ({ resource })),
  };
}

function hasResourceSelector(selector: QuerySelector): boolean {
  return Boolean(selector.resourceReference) || (selector.resourceIdentifiers?.length ?? 0) > 0;
}

function isPatientResource(resource: Resource): resource is Patient {
  return resource.resourceType === 'Patient';
}

async function findResourcesBySelector(
  resourceType: string,
  selector: QuerySelector
): Promise<Resource[]> {
  const resources = await db.getAll<Resource>(resourceType);

  if (hasResourceSelector(selector)) {
    const resourceRefTail = getReferenceTail(selector.resourceReference);
    const byReference = resourceRefTail ? resources.filter((resource) => resource.id === resourceRefTail) : [];

    if (byReference.length > 0) {
      return byReference;
    }

    const lookupIdentifiers = selector.resourceIdentifiers || [];
    if (lookupIdentifiers.length === 0) {
      return [];
    }

    return resources.filter((resource) => {
      const asRecord = resource as unknown as Record<string, unknown>;
      const identifierValue = asRecord.identifier;
      if (!Array.isArray(identifierValue)) {
        return false;
      }
      const resourceIdentifiers = identifierValue as Record<string, unknown>[];
      return lookupIdentifiers.some((lookup) =>
        resourceIdentifiers.some((candidate) =>
          candidate.system === lookup.system && candidate.value === lookup.value
        )
      );
    });
  }

  let patientID = getReferenceTail(selector.patientReference);
  if (!patientID && (selector.patientIdentifiers?.length ?? 0) > 0) {
    const matchedPatient = await findPatientByIdentifiers(selector.patientIdentifiers || []);
    patientID = matchedPatient?.id || null;
  }

  if (!patientID) {
    return [];
  }

  return resources.filter((resource) => {
    if (resourceType === 'Patient') {
      return resource.id === patientID;
    }

    const references: string[] = [];
    collectReferenceValues(resource, references);
    return references.some((reference) => {
      const tail = getReferenceTail(reference);
      return tail === patientID && (reference.startsWith('Patient/') || reference === patientID);
    });
  });
}

/**
 * Approve an incoming request and send data to the gateway
 */
export async function approveIncomingRequest(
  requestId: string
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  const request = await integrationDb.getIncomingRequestById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  if (request.status !== 'PENDING_APPROVAL') {
    return { success: false, message: `Request already processed with status: ${request.status}` };
  }

  await integrationDb.updateIncomingRequestStatus(requestId, 'PROCESSING');
  console.log(`[Integration] Processing approved request ${requestId}`);

  let responsePayload: GatewayResponse;

  try {
    const selector = normalizeSelector(request.selector, request.identifiers);
    const matchedResources = await findResourcesBySelector(request.resourceType, selector);

    if (matchedResources.length === 0) {
      console.log(`[Integration] No ${request.resourceType} resources found for request ${requestId}`);
      responsePayload = {
        transactionId: request.transactionId,
        status: 'REJECTED',
        data: {
          error: `${request.resourceType} not found`,
          searchedSelector: selector,
        },
      };
    } else if (request.resourceType === 'Patient' && matchedResources.length === 1 && isPatientResource(matchedResources[0])) {
      responsePayload = {
        transactionId: request.transactionId,
        status: 'SUCCESS',
        data: formatPatientForGateway(matchedResources[0], request.identifiers),
      };
    } else {
      responsePayload = {
        transactionId: request.transactionId,
        status: 'SUCCESS',
        data: buildCollectionBundle(matchedResources),
      };
    }

    await sendToGateway(request.gatewayReturnUrl, responsePayload);

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

    await integrationDb.updateIncomingRequestStatus(requestId, 'ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

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
  const request = await integrationDb.getIncomingRequestById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  if (request.status !== 'PENDING_APPROVAL') {
    return { success: false, message: `Request already processed with status: ${request.status}` };
  }

  console.log(`[Integration] Rejecting request ${requestId}`);

  try {
    await sendToGateway(request.gatewayReturnUrl, {
      transactionId: request.transactionId,
      status: 'REJECTED',
      data: {
        error: 'Request rejected by provider',
        reason: reason || 'No reason provided',
      },
    });

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

/**
 * Handle incoming push webhook from gateway
 * Called when another provider pushes data to us without a prior request
 */
export async function handleReceivePush(
  payload: ReceivePushPayload
): Promise<{ success: boolean; message: string; resourceSaved?: boolean }> {
  const { transactionId, senderId, resourceType, data, reason, notes } = payload;

  console.log(`[Integration] Received push ${transactionId} for ${resourceType} from ${senderId}`);
  if (reason) {
    console.log(`[Integration] Reason: ${reason}`);
  }
  if (notes) {
    console.log(`[Integration] Notes: ${notes}`);
  }

  if (await integrationDb.dataAlreadyReceived(transactionId)) {
    console.log(`[Integration] Push data already received for ${transactionId}, skipping`);
    return {
      success: true,
      message: 'Data already received (idempotent)',
    };
  }

  await integrationDb.saveReceivedData({
    transactionId,
    resourceType,
    status: 'SUCCESS',
    data: data || {},
  });

  console.log(`[Integration] Stored push data for transaction ${transactionId}`);

  let resourceSaved = false;
  if (data && resourceType === 'Appointment') {
    try {
      resourceSaved = await saveReceivedAppointmentToLocalDb(data, transactionId, senderId);
    } catch (error) {
      console.error(`[Integration] Failed to auto-save appointment to local DB:`, error);
    }
  }

  return {
    success: true,
    message: 'Push data received successfully',
    resourceSaved,
  };
}

async function saveReceivedAppointmentToLocalDb(
  data: Record<string, unknown>,
  transactionId: string,
  senderId: string
): Promise<boolean> {
  if (data.resourceType !== 'Appointment') {
    console.warn(`[Integration] Expected Appointment resource but got: ${String(data.resourceType)}`);
    return false;
  }

  const receivedAppointment = data as unknown as Appointment;
  const localId = receivedAppointment.id || `appt-${uuidv4().slice(0, 8)}`;

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

export async function getIncomingRequests(): Promise<IncomingRequest[]> {
  return integrationDb.getAllIncomingRequests();
}
