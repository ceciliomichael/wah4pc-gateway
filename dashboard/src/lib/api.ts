import type {
  Provider,
  ProviderCreateRequest,
  ApiKey,
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  Transaction,
  ApiError,
  ApiResponse,
} from "@/types";

// Use Next.js API routes (relative path)
const API_BASE_URL = "/api";

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

// Get the stored auth key
function getAuthKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_key");
}

// Base fetch wrapper with auth headers
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authKey = getAuthKey();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authKey) {
    (headers as Record<string, string>)["X-Master-Key"] = authKey;
  }

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

// Provider API - routes through Next.js API
export const providerApi = {
  getAll: async () => ensureArray(await fetchWithAuth<Provider[]>("/providers")),

  getById: (id: string) => fetchWithAuth<Provider>(`/providers/${id}`),

  create: (data: ProviderCreateRequest) =>
    fetchWithAuth<Provider>("/providers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ProviderCreateRequest) =>
    fetchWithAuth<Provider>(`/providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth<void>(`/providers/${id}`, {
      method: "DELETE",
    }),

  setActive: (id: string, active: boolean) =>
    fetchWithAuth<Provider>(`/providers/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ active }),
    }),
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

// Auth validation - test if key is valid via Next.js API route
export async function validateAuthKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/providers`, {
      headers: {
        "X-Master-Key": key,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}