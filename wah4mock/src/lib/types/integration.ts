/**
 * WAH4PC Gateway Integration Types
 * Zod schemas and TypeScript interfaces for gateway communication
 */

import { z } from 'zod';

// ============================================================================
// Custom Validators
// ============================================================================

/**
 * Validates transaction IDs which can be either:
 * - Pure UUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 * - Prefixed UUID: "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
const transactionIdValidator = z.string().refine(
  (val) => {
    // Check if it's a pure UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(val)) return true;
    
    // Check if it's a prefixed UUID (txn_...)
    if (val.startsWith('txn_')) {
      const withoutPrefix = val.slice(4);
      return uuidRegex.test(withoutPrefix);
    }
    
    return false;
  },
  { message: 'Invalid transaction ID format (expected UUID or txn_UUID)' }
);

// ============================================================================
// Identifier Schema (FHIR-compatible)
// ============================================================================

export const IdentifierSchema = z.object({
  system: z.string().url(),
  value: z.string().min(1),
});

export type Identifier = z.infer<typeof IdentifierSchema>;

export const QuerySelectorSchema = z.object({
  patientIdentifiers: z.array(IdentifierSchema).optional(),
  patientReference: z.string().min(1).optional(),
  resourceIdentifiers: z.array(IdentifierSchema).optional(),
  resourceReference: z.string().min(1).optional(),
});

export type QuerySelector = z.infer<typeof QuerySelectorSchema>;

// ============================================================================
// Webhook 1: Process Query (incoming from gateway)
// Called when another provider requests data from us
// ============================================================================

export const ProcessQueryPayloadSchema = z.object({
  transactionId: transactionIdValidator,
  requesterId: z.string().uuid(),
  identifiers: z.array(IdentifierSchema).optional().default([]),
  selector: QuerySelectorSchema.optional(),
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
  transactionId: transactionIdValidator,
  status: TransactionStatusSchema,
  data: z.record(z.string(), z.unknown()).optional(),
});

export type ReceiveResultsPayload = z.infer<typeof ReceiveResultsPayloadSchema>;

// ============================================================================
// Gateway Response (what we send back to gatewayReturnUrl)
// ============================================================================

export const GatewayResponseSchema = z.object({
  transactionId: transactionIdValidator,
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
  identifiers: z.array(IdentifierSchema).optional().default([]),
  selector: QuerySelectorSchema.optional(),
  resourceType: z.string().optional().default('Patient'),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((value, ctx) => {
  const hasLegacyIdentifiers = value.identifiers.length > 0;
  const selector = value.selector;
  const hasSelector = Boolean(
    selector &&
      (
        (selector.patientIdentifiers?.length ?? 0) > 0 ||
        Boolean(selector.patientReference) ||
        (selector.resourceIdentifiers?.length ?? 0) > 0 ||
        Boolean(selector.resourceReference)
      )
  );

  if (!hasLegacyIdentifiers && !hasSelector) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide either identifiers or selector',
      path: ['selector'],
    });
  }
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
  selector?: QuerySelector;
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
  selector?: QuerySelector;
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
// Webhook 3: Receive Push (incoming unsolicited data from gateway)
// Called when another provider pushes data to us without prior request
// ============================================================================

export const ReceivePushPayloadSchema = z.object({
  transactionId: transactionIdValidator,
  senderId: z.string().uuid(),
  resourceType: z.string(),
  data: z.record(z.string(), z.unknown()),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceivePushPayload = z.infer<typeof ReceivePushPayloadSchema>;

// ============================================================================
// Initiate Push (push data to another provider)
// ============================================================================

export const InitiatePushRequestSchema = z.object({
  targetId: z.string().uuid(),
  resourceType: z.string(),
  data: z.record(z.string(), z.unknown()),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type InitiatePushRequest = z.infer<typeof InitiatePushRequestSchema>;

// ============================================================================
// Internal: Incoming Push Storage (unsolicited data FROM other providers)
// ============================================================================

export interface IncomingPush {
  id: string;
  transactionId: string;
  senderId: string;
  resourceType: string;
  data: Record<string, unknown>;
  reason?: string;
  notes?: string;
  receivedAt: string;
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
