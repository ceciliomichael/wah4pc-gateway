import { NextRequest, NextResponse } from "next/server";
import { config } from "./config";

interface ProxyOptions {
  method: string;
  path: string;
  body?: unknown;
  params?: Record<string, string>;
}

interface ProxyAuthHeaders {
  masterKey: string | null;
  apiKey: string | null;
}

function getAuthHeaders(request: NextRequest): ProxyAuthHeaders {
  return {
    masterKey: request.headers.get("X-Master-Key"),
    apiKey: request.headers.get("X-API-Key"),
  };
}

/**
 * Builds the full backend URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, config.backendUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

/**
 * Proxy a request to the Go backend
 */
export async function proxyRequest(
  request: NextRequest,
  options: ProxyOptions
): Promise<NextResponse> {
  const authHeaders = getAuthHeaders(request);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authHeaders.masterKey) {
    headers["X-Master-Key"] = authHeaders.masterKey;
  }
  if (authHeaders.apiKey) {
    headers["X-API-Key"] = authHeaders.apiKey;
  }

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.body && ["POST", "PUT", "PATCH"].includes(options.method)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const backendUrl = buildUrl(options.path, options.params);
    const response = await fetch(backendUrl, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 502 }
    );
  }
}

/**
 * Proxy GET request
 */
export async function proxyGet(
  request: NextRequest,
  path: string,
  params?: Record<string, string>
): Promise<NextResponse> {
  return proxyRequest(request, { method: "GET", path, params });
}

/**
 * Proxy POST request
 */
export async function proxyPost(
  request: NextRequest,
  path: string,
  body?: unknown
): Promise<NextResponse> {
  return proxyRequest(request, { method: "POST", path, body });
}

/**
 * Proxy PUT request
 */
export async function proxyPut(
  request: NextRequest,
  path: string,
  body?: unknown
): Promise<NextResponse> {
  return proxyRequest(request, { method: "PUT", path, body });
}

/**
 * Proxy DELETE request
 */
export async function proxyDelete(
  request: NextRequest,
  path: string
): Promise<NextResponse> {
  return proxyRequest(request, { method: "DELETE", path });
}
