/**
 * Integration Database Service
 * File-based storage for pending transactions and received data
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  PendingTransaction,
  ReceivedData,
  IncomingRequest,
  TransactionStatus,
  Identifier,
  QuerySelector,
} from '../types/integration';

const DATA_DIR = path.join(process.cwd(), 'data');
const PENDING_FILE = path.join(DATA_DIR, 'PendingTransactions.json');
const RECEIVED_FILE = path.join(DATA_DIR, 'ReceivedData.json');
const INCOMING_FILE = path.join(DATA_DIR, 'IncomingRequests.json');

// ============================================================================
// File Helpers
// ============================================================================

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// Pending Transactions
// ============================================================================

/**
 * Get all pending transactions
 */
export async function getAllTransactions(): Promise<PendingTransaction[]> {
  return readJsonFile<PendingTransaction>(PENDING_FILE);
}

/**
 * Get a transaction by its transaction ID
 */
export async function getTransactionById(
  transactionId: string
): Promise<PendingTransaction | null> {
  const transactions = await getAllTransactions();
  return transactions.find((t) => t.transactionId === transactionId) || null;
}

/**
 * Create a new pending transaction
 */
export async function createTransaction(params: {
  transactionId: string;
  targetId: string;
  resourceType: string;
  identifiers: Identifier[];
  selector?: QuerySelector;
  reason?: string;
  notes?: string;
  idempotencyKey: string;
}): Promise<PendingTransaction> {
  const transactions = await getAllTransactions();
  const now = new Date().toISOString();

  const transaction: PendingTransaction = {
    id: uuidv4(),
    transactionId: params.transactionId,
    targetId: params.targetId,
    resourceType: params.resourceType,
    identifiers: params.identifiers,
    selector: params.selector,
    status: 'PENDING',
    reason: params.reason,
    notes: params.notes,
    idempotencyKey: params.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };

  transactions.push(transaction);
  await writeJsonFile(PENDING_FILE, transactions);
  return transaction;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus
): Promise<PendingTransaction | null> {
  const transactions = await getAllTransactions();
  const index = transactions.findIndex((t) => t.transactionId === transactionId);

  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  transactions[index] = {
    ...transactions[index],
    status,
    updatedAt: now,
    completedAt: status !== 'PENDING' ? now : undefined,
  };

  await writeJsonFile(PENDING_FILE, transactions);
  return transactions[index];
}

/**
 * Check if a transaction exists (for idempotency)
 */
export async function transactionExists(transactionId: string): Promise<boolean> {
  const transaction = await getTransactionById(transactionId);
  return transaction !== null;
}

/**
 * Get a transaction by its idempotency key
 * Used to find existing transactions when retrying with the same key
 */
export async function getTransactionByIdempotencyKey(
  idempotencyKey: string
): Promise<PendingTransaction | null> {
  const transactions = await getAllTransactions();
  return transactions.find((t) => t.idempotencyKey === idempotencyKey) || null;
}

// ============================================================================
// Received Data
// ============================================================================

/**
 * Get all received data records
 */
export async function getAllReceivedData(): Promise<ReceivedData[]> {
  return readJsonFile<ReceivedData>(RECEIVED_FILE);
}

/**
 * Get received data by transaction ID
 */
export async function getReceivedDataByTransactionId(
  transactionId: string
): Promise<ReceivedData | null> {
  const records = await getAllReceivedData();
  return records.find((r) => r.transactionId === transactionId) || null;
}

/**
 * Save received data from the gateway
 */
export async function saveReceivedData(params: {
  transactionId: string;
  resourceType: string;
  status: TransactionStatus;
  data: Record<string, unknown>;
}): Promise<ReceivedData> {
  const records = await getAllReceivedData();

  const record: ReceivedData = {
    id: uuidv4(),
    transactionId: params.transactionId,
    resourceType: params.resourceType,
    status: params.status,
    data: params.data,
    receivedAt: new Date().toISOString(),
  };

  records.push(record);
  await writeJsonFile(RECEIVED_FILE, records);
  return record;
}

/**
 * Check if data for a transaction was already received (idempotency)
 */
export async function dataAlreadyReceived(transactionId: string): Promise<boolean> {
  const record = await getReceivedDataByTransactionId(transactionId);
  return record !== null;
}

// ============================================================================
// Incoming Requests (requests FROM other providers that need approval)
// ============================================================================

/**
 * Get all incoming requests
 */
export async function getAllIncomingRequests(): Promise<IncomingRequest[]> {
  return readJsonFile<IncomingRequest>(INCOMING_FILE);
}

/**
 * Get an incoming request by its ID
 */
export async function getIncomingRequestById(
  id: string
): Promise<IncomingRequest | null> {
  const requests = await getAllIncomingRequests();
  return requests.find((r) => r.id === id) || null;
}

/**
 * Get an incoming request by transaction ID
 */
export async function getIncomingRequestByTransactionId(
  transactionId: string
): Promise<IncomingRequest | null> {
  const requests = await getAllIncomingRequests();
  return requests.find((r) => r.transactionId === transactionId) || null;
}

/**
 * Save a new incoming request
 */
export async function saveIncomingRequest(params: {
  transactionId: string;
  requesterId: string;
  identifiers: Identifier[];
  selector?: QuerySelector;
  resourceType: string;
  gatewayReturnUrl: string;
  reason?: string;
  notes?: string;
}): Promise<IncomingRequest> {
  const requests = await getAllIncomingRequests();
  const now = new Date().toISOString();

  const request: IncomingRequest = {
    id: uuidv4(),
    transactionId: params.transactionId,
    requesterId: params.requesterId,
    identifiers: params.identifiers,
    selector: params.selector,
    resourceType: params.resourceType,
    gatewayReturnUrl: params.gatewayReturnUrl,
    reason: params.reason,
    notes: params.notes,
    status: 'PENDING_APPROVAL',
    createdAt: now,
    updatedAt: now,
  };

  requests.push(request);
  await writeJsonFile(INCOMING_FILE, requests);
  return request;
}

/**
 * Update an incoming request's status
 */
export async function updateIncomingRequestStatus(
  id: string,
  status: TransactionStatus,
  responseData?: Record<string, unknown>
): Promise<IncomingRequest | null> {
  const requests = await getAllIncomingRequests();
  const index = requests.findIndex((r) => r.id === id);

  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  requests[index] = {
    ...requests[index],
    status,
    updatedAt: now,
    processedAt: status !== 'PENDING_APPROVAL' ? now : undefined,
    responseData: responseData || requests[index].responseData,
  };

  await writeJsonFile(INCOMING_FILE, requests);
  return requests[index];
}

/**
 * Check if an incoming request already exists (idempotency)
 */
export async function incomingRequestExists(transactionId: string): Promise<boolean> {
  const request = await getIncomingRequestByTransactionId(transactionId);
  return request !== null;
}

// ============================================================================
// Integration DB Export
// ============================================================================

export const integrationDb = {
  // Outgoing Transactions (requests we made)
  getAllTransactions,
  getTransactionById,
  getTransactionByIdempotencyKey,
  createTransaction,
  updateTransactionStatus,
  transactionExists,
  // Received Data (data we got back)
  getAllReceivedData,
  getReceivedDataByTransactionId,
  saveReceivedData,
  dataAlreadyReceived,
  // Incoming Requests (requests from others needing approval)
  getAllIncomingRequests,
  getIncomingRequestById,
  getIncomingRequestByTransactionId,
  saveIncomingRequest,
  updateIncomingRequestStatus,
  incomingRequestExists,
};

export default integrationDb;
