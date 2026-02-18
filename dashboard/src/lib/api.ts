import type {
  Provider,
  ProviderCreateRequest,
  ApiKey,
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  Transaction,
  ApiError,
  ApiResponse,
  LogDate,
  LogSummary,
  LogDetail,
  SystemSettings,
} from "@/types";
import { loadStoredSession, type AuthIdentity } from "@/lib/auth-session";

interface ProviderApiShape {
  id: string;
  name: string;
  type: Provider["type"];
  facilityCode?: string;
  facility_code?: string;
  location?: string;
  baseUrl?: string;
  base_url?: string;
  practitionerListEndpoint?: string;
  practitioner_list_endpoint?: string;
  practitionerList?: Array<{
    code: string;
    display: string;
    active: boolean;
  }>;
  gatewayAuthKey?: string;
  gateway_auth_key?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// Use Next.js API routes (relative path)
// Can be overridden via NEXT_PUBLIC_API_URL environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Custom error class for API errors
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: ApiError
  ) {
    super(data?.error || statusText);
    this.name = "ApiRequestError";
  }
}

interface IdentityApiResponse {
  role: "admin" | "user";
  providerId?: string;
  keyId?: string;
  owner?: string;
}

function parseIdentity(data: unknown): AuthIdentity | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.role !== "admin" && obj.role !== "user") return null;
  return {
    role: obj.role,
    providerId: typeof obj.providerId === "string" ? obj.providerId : undefined,
    keyId: typeof obj.keyId === "string" ? obj.keyId : undefined,
    owner: typeof obj.owner === "string" ? obj.owner : undefined,
  };
}

// Resolve auth headers from stored session.
function getAuthHeadersFromSession(): Record<string, string> {
  const session = loadStoredSession();
  if (!session) return {};

  if (session.mode === "admin") {
    return { "X-Master-Key": session.credential };
  }

  return { "X-API-Key": session.credential };
}

// Base fetch wrapper with auth headers
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeadersFromSession(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const json: ApiResponse<T> = await response.json();

  // Handle API-level errors (success: false)
  if (!json.success) {
    throw new ApiRequestError(
      response.status,
      json.error || "Request failed",
      { error: json.error || "Unknown error" }
    );
  }

  // Handle HTTP errors that somehow have success: true (edge case)
  if (!response.ok) {
    throw new ApiRequestError(response.status, response.statusText, {
      error: json.error || response.statusText,
    });
  }

  // Return the unwrapped data
  return json.data;
}

// Helper to ensure response is an array
function ensureArray<T>(data: T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeProvider(data: ProviderApiShape): Provider {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    facilityCode: data.facilityCode ?? data.facility_code ?? "",
    location: data.location ?? "",
    baseUrl: data.baseUrl ?? data.base_url ?? "",
    practitionerListEndpoint:
      data.practitionerListEndpoint ?? data.practitioner_list_endpoint ?? "",
    practitionerList: data.practitionerList ?? [],
    gatewayAuthKey: data.gatewayAuthKey ?? data.gateway_auth_key ?? "",
    isActive: data.isActive ?? data.is_active ?? false,
    createdAt: data.createdAt ?? data.created_at ?? "",
    updatedAt: data.updatedAt ?? data.updated_at ?? "",
  };
}

// Provider API - routes through Next.js API
export const providerApi = {
  getAll: async () => {
    const providers = ensureArray(await fetchWithAuth<ProviderApiShape[]>("/providers"));
    return providers.map(normalizeProvider);
  },

  getAllWithPractitioners: async () => {
    const providers = await providerApi.getAll();
    const detailedProviders = await Promise.all(
      providers.map(async (provider) => {
        try {
          return await providerApi.getById(provider.id);
        } catch {
          return provider;
        }
      })
    );
    return detailedProviders;
  },

  getById: async (id: string) => {
    const provider = await fetchWithAuth<ProviderApiShape>(`/providers/${id}`);
    return normalizeProvider(provider);
  },

  create: (data: ProviderCreateRequest) =>
    fetchWithAuth<ProviderApiShape>("/providers", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(normalizeProvider),

  update: (id: string, data: ProviderCreateRequest) =>
    fetchWithAuth<ProviderApiShape>(`/providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then(normalizeProvider),

  delete: (id: string) =>
    fetchWithAuth<void>(`/providers/${id}`, {
      method: "DELETE",
    }),

  setActive: (id: string, active: boolean) =>
    fetchWithAuth<ProviderApiShape>(`/providers/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ active }),
    }).then(normalizeProvider),
};

// API Key API - routes through Next.js API
export const apiKeyApi = {
  getAll: async () => ensureArray(await fetchWithAuth<ApiKey[]>("/apikeys")),

  getById: (id: string) => fetchWithAuth<ApiKey>(`/apikeys/${id}`),

  create: (data: ApiKeyCreateRequest) =>
    fetchWithAuth<ApiKeyCreateResponse>("/apikeys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth<void>(`/apikeys/${id}`, {
      method: "DELETE",
    }),

  revoke: (id: string) =>
    fetchWithAuth<{ message: string }>(`/apikeys/${id}/revoke`, {
      method: "POST",
    }),
};

// Transaction API - routes through Next.js API
export const transactionApi = {
  getAll: async () => ensureArray(await fetchWithAuth<Transaction[]>("/transactions")),

  getById: (id: string) =>
    fetchWithAuth<Transaction>(`/transactions/${id}`),
};

// Logs API - routes through Next.js API
export const logsApi = {
  getDates: async () => ensureArray(await fetchWithAuth<LogDate[]>("/logs/dates")),
  getLogs: async (date: string) => ensureArray(await fetchWithAuth<LogSummary[]>(`/logs/${date}`)),
  getLogDetail: (date: string, id: string) => fetchWithAuth<LogDetail>(`/logs/${date}/${id}`),
};

// Settings API
export const settingsApi = {
  get: () => fetchWithAuth<SystemSettings>("/settings"),
  update: (data: SystemSettings) =>
    fetchWithAuth<SystemSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export async function fetchAuthIdentityWithMasterKey(key: string): Promise<AuthIdentity | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/identity`, {
      headers: {
        "X-Master-Key": key,
      },
    });
    if (!response.ok) return null;

    const payload: ApiResponse<IdentityApiResponse> = await response.json();
    if (!payload.success) return null;
    return parseIdentity(payload.data);
  } catch {
    return null;
  }
}

export async function fetchAuthIdentityWithApiKey(apiKey: string): Promise<AuthIdentity | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/identity`, {
      headers: {
        "X-API-Key": apiKey,
      },
    });
    if (!response.ok) return null;

    const payload: ApiResponse<IdentityApiResponse> = await response.json();
    if (!payload.success) return null;
    return parseIdentity(payload.data);
  } catch {
    return null;
  }
}
