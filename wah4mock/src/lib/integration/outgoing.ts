/**
 * Integration Service - Outgoing Request Handlers
 * Handles requests TO other providers and receiving their responses
 */

import { v4 as uuidv4 } from 'uuid';
import { config, validateIntegrationConfig } from '../config';
import { db } from '../db';
import { integrationDb } from './db';
import { findPatientByFHIRIdentifiers } from './common';
import type { Patient, Identifier as FHIRIdentifier } from '../types/fhir';
import type {
  ReceiveResultsPayload,
  Identifier,
  InitiateQueryResponse,
  QuerySelector,
} from '../types/integration';

// ============================================================================
// Webhook Handler: Receive Results
// ============================================================================

/**
 * Handle incoming receive-results webhook from gateway
 * Called when data we requested is now available
 *
 * This function now automatically saves received patient data to the local database
 */
export async function handleReceiveResults(
  payload: ReceiveResultsPayload
): Promise<{ success: boolean; message: string; patientSaved?: boolean }> {
  const { transactionId, status, data } = payload;

  console.log(`[Integration] Receiving results for transaction ${transactionId}, status: ${status}`);

  // Check if we initiated this transaction
  const transaction = await integrationDb.getTransactionById(transactionId);

  if (!transaction) {
    console.warn(`[Integration] Unknown transaction: ${transactionId}`);
    return {
      success: false,
      message: 'Transaction not found - this request may not have been initiated by us',
    };
  }

  // Check for duplicate delivery (idempotency)
  if (await integrationDb.dataAlreadyReceived(transactionId)) {
    console.log(`[Integration] Data already received for transaction ${transactionId}`);
    return {
      success: true,
      message: 'Data already received (idempotent)',
    };
  }

  // Store the received data in integration log
  await integrationDb.saveReceivedData({
    transactionId,
    resourceType: transaction.resourceType,
    status,
    data: data || {},
  });

  // Update transaction status
  await integrationDb.updateTransactionStatus(transactionId, status);

  console.log(`[Integration] Stored data for transaction ${transactionId}`);

  // =========================================================================
  // AUTO-SAVE: Add received patient data to local Patient.json
  // =========================================================================
  let patientSaved = false;

  if (status === 'SUCCESS' && transaction.resourceType === 'Patient' && data) {
    try {
      patientSaved = await saveReceivedPatientToLocalDb(data, transactionId);
    } catch (error) {
      // Log but don't fail - the integration data is already saved
      console.error(`[Integration] Failed to auto-save patient to local DB:`, error);
    }
  }

  return {
    success: true,
    message: 'Data received successfully',
    patientSaved,
  };
}

/**
 * Save received patient data to the local Patient.json database
 * Handles duplicate detection and creates/updates as needed
 */
async function saveReceivedPatientToLocalDb(
  data: Record<string, unknown>,
  transactionId: string
): Promise<boolean> {
  // Validate this is actually a Patient resource
  if (data.resourceType !== 'Patient') {
    console.warn(`[Integration] Expected Patient resource but got: ${data.resourceType}`);
    return false;
  }

  // Cast to Patient type
  const receivedPatient = data as unknown as Patient;

  // Check if patient already exists by matching identifiers
  const existingPatient = receivedPatient.identifier
    ? await findPatientByFHIRIdentifiers(receivedPatient.identifier)
    : null;

  if (existingPatient) {
    // Update existing patient with new data
    console.log(`[Integration] Patient already exists (ID: ${existingPatient.id}), updating...`);

    const updatedPatient = mergePatientData(existingPatient, receivedPatient, transactionId);
    await db.update('Patient', existingPatient.id!, updatedPatient);

    console.log(`[Integration] Updated existing patient: ${existingPatient.id}`);
    return true;
  }

  // Create new patient
  const newPatient = preparePatientForLocalDb(receivedPatient, transactionId);
  await db.create('Patient', newPatient);

  console.log(`[Integration] Auto-saved new patient to local DB: ${newPatient.id}`);
  return true;
}

/**
 * Prepare a received patient for storage in local database
 * Generates a local ID and adds integration metadata
 */
function preparePatientForLocalDb(
  receivedPatient: Patient,
  transactionId: string
): Patient {
  // Generate a new local ID if needed (preserve external ID as identifier)
  const localId = receivedPatient.id || `patient-${uuidv4().slice(0, 8)}`;

  // Add the external ID as an identifier if it had one
  const identifiers = receivedPatient.identifier || [];
  if (receivedPatient.id && receivedPatient.id !== localId) {
    identifiers.push({
      system: 'urn:wah4pc:external-id',
      value: receivedPatient.id,
    });
  }

  return {
    ...receivedPatient,
    id: localId,
    identifier: identifiers,
    extension: [
      ...(receivedPatient.extension || []),
      {
        url: 'urn:wah4pc:integration',
        extension: [
          { url: 'transactionId', valueString: transactionId },
          { url: 'receivedAt', valueDateTime: new Date().toISOString() },
          { url: 'source', valueString: 'gateway-integration' },
        ],
      },
    ],
  };
}

/**
 * Merge received patient data with existing patient
 * Preserves local data while updating with new information
 */
function mergePatientData(
  existing: Patient,
  received: Patient,
  transactionId: string
): Patient {
  // Add integration extension to track the update
  const integrationExtension = {
    url: 'urn:wah4pc:integration-update',
    extension: [
      { url: 'transactionId', valueString: transactionId },
      { url: 'updatedAt', valueDateTime: new Date().toISOString() },
      { url: 'source', valueString: 'gateway-integration' },
    ],
  };

  // Merge identifiers (add new ones, don't remove existing)
  const mergedIdentifiers = [...(existing.identifier || [])];
  for (const newId of received.identifier || []) {
    const exists = mergedIdentifiers.some(
      (existingId) =>
        existingId.system === newId.system && existingId.value === newId.value
    );
    if (!exists) {
      mergedIdentifiers.push(newId);
    }
  }

  return {
    ...existing,
    // Update demographic data from received patient
    name: received.name || existing.name,
    birthDate: received.birthDate || existing.birthDate,
    gender: received.gender || existing.gender,
    telecom: received.telecom || existing.telecom,
    address: received.address || existing.address,
    // Merge identifiers
    identifier: mergedIdentifiers,
    // Add integration tracking
    extension: [...(existing.extension || []), integrationExtension],
  };
}

// ============================================================================
// Outbound Requests
// ============================================================================

/**
 * Custom error for 409 Conflict responses
 * Indicates a request with the same Idempotency-Key is still processing
 */
export class IdempotencyConflictError extends Error {
  public readonly idempotencyKey: string;
  public readonly retryAfterMs: number;

  constructor(idempotencyKey: string, retryAfterMs = 5000) {
    super(
      `Request with Idempotency-Key "${idempotencyKey}" is still processing. Retry after ${retryAfterMs}ms.`
    );
    this.name = 'IdempotencyConflictError';
    this.idempotencyKey = idempotencyKey;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Initiate a patient data request to another provider via the gateway
 * 
 * @param params.targetId - The provider ID to request data from
 * @param params.identifiers - Patient identifiers (PhilHealth, MRN, etc.)
 * @param params.reason - Optional reason for the request
 * @param params.notes - Optional notes for the target provider
 * @param params.idempotencyKey - Optional UUID v4 for safe retries. If not provided, a new one is generated.
 *                                Reuse the same key when retrying failed requests.
 * 
 * @throws {IdempotencyConflictError} When a request with the same key is still processing (409)
 */
export async function initiateQuery(params: {
  targetId: string;
  resourceType: string;
  identifiers?: Identifier[];
  selector?: QuerySelector;
  reason?: string;
  notes?: string;
  idempotencyKey?: string;
}): Promise<InitiateQueryResponse & { idempotencyKey: string }> {
  const { targetId, resourceType, reason, notes } = params;
  const identifiers = params.identifiers || [];

  // Generate idempotency key if not provided (for new requests)
  // Reuse provided key when retrying failed requests
  const idempotencyKey = params.idempotencyKey || uuidv4();

  // Validate configuration
  const configCheck = validateIntegrationConfig();
  if (!configCheck.valid) {
    throw new Error(
      `Integration not configured. Missing: ${configCheck.missing.join(', ')}`
    );
  }

  const { gatewayUrl, providerId, apiKey } = config.integration;

  const effectiveSelector: QuerySelector = params.selector || {};
  if (identifiers.length > 0 && (!effectiveSelector.patientIdentifiers || effectiveSelector.patientIdentifiers.length === 0)) {
    effectiveSelector.patientIdentifiers = identifiers;
  }

  console.log(`[Integration] Initiating ${resourceType} query to provider ${targetId} (Idempotency-Key: ${idempotencyKey})`);

  const requestBody = {
    requesterId: providerId,
    targetId,
    resourceType,
    identifiers,
    selector: effectiveSelector,
    reason,
    notes,
  };

  const response = await fetch(`${gatewayUrl}/api/v1/fhir/request/${resourceType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Provider-ID': providerId,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(requestBody),
  });

  // Handle 409 Conflict - request with same Idempotency-Key is still processing
  if (response.status === 409) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
    console.warn(`[Integration] 409 Conflict - request still processing (Idempotency-Key: ${idempotencyKey})`);
    throw new IdempotencyConflictError(idempotencyKey, retryAfterMs);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Integration] Gateway request failed: ${response.status} - ${errorText}`);
    throw new Error(`Gateway request failed: ${response.status}`);
  }

  const result = (await response.json()) as InitiateQueryResponse;

  // Store as pending transaction for tracking (includes idempotency key for retry lookup)
  if (result.success && result.data) {
    await integrationDb.createTransaction({
      transactionId: result.data.id,
      targetId,
      resourceType,
      identifiers,
      selector: effectiveSelector,
      reason,
      notes,
      idempotencyKey,
    });
  }

  console.log(`[Integration] Created transaction ${result.data?.id} (Idempotency-Key: ${idempotencyKey})`);

  return { ...result, idempotencyKey };
}

export async function initiatePatientQuery(params: {
  targetId: string;
  identifiers: Identifier[];
  reason?: string;
  notes?: string;
  idempotencyKey?: string;
}): Promise<InitiateQueryResponse & { idempotencyKey: string }> {
  return initiateQuery({
    targetId: params.targetId,
    resourceType: 'Patient',
    identifiers: params.identifiers,
    selector: {
      patientIdentifiers: params.identifiers,
    },
    reason: params.reason,
    notes: params.notes,
    idempotencyKey: params.idempotencyKey,
  });
}

// ============================================================================
// Outbound Push (Unsolicited Data)
// ============================================================================

/**
 * Push a FHIR resource directly to another provider via the gateway
 * Unlike queries, push requests are delivered immediately.
 * If the target provider accepts (returns 200 OK), the transaction is COMPLETED instantly.
 *
 * @param params.targetId - The provider ID to push data to
 * @param params.resourceType - FHIR resource type (e.g., 'Appointment')
 * @param params.data - The FHIR resource data to push
 * @param params.reason - Optional reason for the push
 * @param params.notes - Optional notes for the target provider
 */
export async function initiatePush(params: {
  targetId: string;
  resourceType: string;
  data: Record<string, unknown>;
  reason?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; transactionId?: string }> {
  const { targetId, resourceType, data, reason, notes } = params;

  // Validate configuration
  const configCheck = validateIntegrationConfig();
  if (!configCheck.valid) {
    throw new Error(
      `Integration not configured. Missing: ${configCheck.missing.join(', ')}`
    );
  }

  const { gatewayUrl, providerId, apiKey } = config.integration;

  console.log(`[Integration] Initiating push of ${resourceType} to provider ${targetId}`);

  const requestBody = {
    targetId,
    data,
    reason,
    notes,
  };

  const response = await fetch(`${gatewayUrl}/api/v1/fhir/push/${resourceType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Provider-ID': providerId,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Integration] Push failed: ${response.status} - ${errorText}`);
    throw new Error(`Push request failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  console.log(`[Integration] Push completed successfully for ${resourceType}`);

  return {
    success: true,
    message: 'Push delivered successfully',
    transactionId: result?.data?.id || result?.transactionId,
  };
}
