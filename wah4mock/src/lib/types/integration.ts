/**
 * WAH4PC Gateway Integration Types
 * Zod schemas and TypeScript interfaces for gateway communication
 */

import { z } from 'zod';

// ============================================================================
// Identifier Schema (FHIR-compatible)
// ============================================================================

export const IdentifierSchema = z.object({
  system: z.string().url(),
  value: z.string().min(1),
});

export type Identifier = z.infer<typeof IdentifierSchema>;

// ============================================================================
// Webhook 1: Process Query (incoming from gateway)
// Called when another provider requests data from us
// ============================================================================

export const ProcessQueryPayloadSchema = z.object({
  transactionId: z.string().uuid(),
  requesterId: z.string().uuid(),
  identifiers: z.array(IdentifierSchema).min(1),
  resourceType: z.string(),
  gatewayReturnUrl: z.string().url(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type ProcessQueryPayload = z.infer<typeof ProcessQueryPayloadSchema>;

// ============================================================================
// Webhook 2: Receive Results (incoming from gateway)
// Called when data we requested is now available
// ============================================================================

export const TransactionStatusSchema = z.enum([
  'SUCCESS',
  'REJECTED',
  'REJECTED_BY_USER',
  'ERROR',
  'PENDING',
  'PENDING_APPROVAL',
  'PROCESSING',
]);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const ReceiveResultsPayloadSchema = z.object({
  transactionId: z.string().uuid(),
  status: TransactionStatusSchema,
  data: z.record(z.string(), z.unknown()).optional(),
});

export type ReceiveResultsPayload = z.infer<typeof ReceiveResultsPayloadSchema>;

// ============================================================================
// Gateway Response (what we send back to gatewayReturnUrl)
// ============================================================================

export const GatewayResponseSchema = z.object({
  transactionId: z.string().uuid(),
  status: TransactionStatusSchema,
  data: z.record(z.string(), z.unknown()).optional(),
});

export type GatewayResponse = z.infer<typeof GatewayResponseSchema>;

// ============================================================================
// Provider Types
// ============================================================================

export const ProviderTypeSchema = z.enum(['clinic', 'hospital', 'laboratory', 'pharmacy']);

export type ProviderType = z.infer<typeof ProviderTypeSchema>;

/**
 * Provider entity from the Gateway
 * Used when listing available providers to request data from
 */
export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Provider Registration
// ============================================================================

export const ProviderRegistrationSchema = z.object({
  name: z.string().min(1),
  type: ProviderTypeSchema,
  baseUrl: z.string().url(),
});

export type ProviderRegistration = z.infer<typeof ProviderRegistrationSchema>;

export const ProviderRegistrationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: ProviderTypeSchema,
  baseUrl: z.string().url(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProviderRegistrationResponse = z.infer<typeof ProviderRegistrationResponseSchema>;

// ============================================================================
// Initiate Query (request data from another provider)
// ============================================================================

export const InitiateQueryRequestSchema = z.object({
  targetId: z.string().uuid(),
  identifiers: z.array(IdentifierSchema).min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type InitiateQueryRequest = z.infer<typeof InitiateQueryRequestSchema>;

export const InitiateQueryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    requesterId: z.string().uuid(),
    targetId: z.string().uuid(),
    identifiers: z.array(IdentifierSchema),
    resourceType: z.string(),
    status: TransactionStatusSchema,
    metadata: z.object({
      reason: z.string().optional(),
      notes: z.string().optional(),
    }).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type InitiateQueryResponse = z.infer<typeof InitiateQueryResponseSchema>;

// ============================================================================
// Internal: Pending Transaction Storage
// ============================================================================

export interface PendingTransaction {
  id: string;
  transactionId: string;
  targetId: string;
  resourceType: string;
  identifiers: Identifier[];
  status: TransactionStatus;
  reason?: string;
  notes?: string;
  /** UUID v4 for safe retries - reuse when retrying failed requests */
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ============================================================================
// Internal: Received Data Storage
// ============================================================================

export interface ReceivedData {
  id: string;
  transactionId: string;
  resourceType: string;
  status: TransactionStatus;
  data: Record<string, unknown>;
  receivedAt: string;
}

// ============================================================================
// Internal: Incoming Request Storage (requests FROM other providers)
// ============================================================================

export interface IncomingRequest {
  id: string;
  transactionId: string;
  requesterId: string;
  identifiers: Identifier[];
  resourceType: string;
  gatewayReturnUrl: string;
  reason?: string;
  notes?: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  responseData?: Record<string, unknown>;
}

// ============================================================================
// Common Identifier Systems (from docs)
// ============================================================================

export const IDENTIFIER_SYSTEMS = {
  philHealth: 'http://philhealth.gov.ph',
  psaBirthCertificate: 'http://psa.gov.ph/birth-certificate',
  passport: 'http://hl7.org/fhir/sid/passport',
} as const;

/**
 * Check if an identifier system is a PhilHealth ID
 */
export function isPhilHealthIdentifier(system: string): boolean {
  return system.toLowerCase().includes('philhealth');
}

/**
 * Check if an identifier system is an MRN (Medical Record Number)
 */
export function isMrnIdentifier(system: string): boolean {
  return system.toLowerCase().includes('/mrn');
}