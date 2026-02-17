// Provider types matching Go backend
export type ProviderType = "hospital" | "clinic" | "laboratory" | "pharmacy" | "imaging" | "other";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  facilityCode: string;
  location: string;
  baseUrl: string;
  gatewayAuthKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCreateRequest {
  name: string;
  type: ProviderType;
  facilityCode: string;
  location: string;
  baseUrl: string;
  gatewayAuthKey: string;
}

// API Key types matching Go backend
export type ApiKeyRole = "admin" | "user";

export interface ApiKey {
  id: string;
  prefix: string;
  owner: string;
  providerId?: string;
  role: ApiKeyRole;
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export interface ApiKeyCreateRequest {
  owner: string;
  providerId?: string;
  role: ApiKeyRole;
  rateLimit?: number;
}

export interface ApiKeyCreateResponse {
  id: string;
  key: string;
  prefix: string;
  owner: string;
  providerId?: string;
  role: ApiKeyRole;
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
}

// Transaction types matching Go backend
export type TransactionStatus = "PENDING" | "RECEIVED" | "COMPLETED" | "FAILED";

export interface TransactionMetadata {
  reason?: string;
  notes?: string;
}

// FHIR-compliant identifier with system and value
// Matches Go model: internal/model/identifier.go
export interface Identifier {
  system: string;
  value: string;
}

// Common identifier systems for the Philippines
export const CommonIdentifierSystems = {
  PhilHealth: "http://philhealth.gov.ph",
  PSABirthCert: "http://psa.gov.ph/birth-certificate",
  PhilHealthDependent: "http://philhealth.gov.ph/dependent",
  Passport: "http://icao.int/passport",
} as const;

export interface Transaction {
  id: string;
  requesterId: string;
  targetId: string;
  identifiers: Identifier[];
  resourceType: string;
  status: TransactionStatus;
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiError {
  error: string;
}

// Dashboard stats
export interface DashboardStats {
  totalProviders: number;
  activeProviders: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
}

// Log types matching Go backend
export interface LogDate {
  date: string;
  count: number;
  sizeBytes: number;
}

export interface LogSummary {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  clientIp: string;
  keyId?: string;
}

export interface LogDetail {
  id: string;
  timestamp: string;
  content: string;
}

// System Settings
export interface SystemSettings {
  id: string;
  validatorDisabled: boolean;
}
