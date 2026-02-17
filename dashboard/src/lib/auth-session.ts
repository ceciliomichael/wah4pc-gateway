export type SessionMode = "admin" | "provider";

export interface StoredAuthSession {
  version: 2;
  mode: SessionMode;
  credential: string;
  providerId?: string;
}

export interface AuthIdentity {
  role: "admin" | "user";
  providerId?: string;
  keyId?: string;
  owner?: string;
}

export const AUTH_SESSION_STORAGE = "auth_session_v2";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSessionMode(value: unknown): value is SessionMode {
  return value === "admin" || value === "provider";
}

export function parseStoredSession(raw: string): StoredAuthSession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return null;
    if (parsed.version !== 2) return null;
    if (!isSessionMode(parsed.mode)) return null;
    if (typeof parsed.credential !== "string" || parsed.credential.trim() === "") {
      return null;
    }
    if (parsed.mode === "provider" && typeof parsed.providerId !== "string") {
      return null;
    }
    return {
      version: 2,
      mode: parsed.mode,
      credential: parsed.credential,
      providerId: typeof parsed.providerId === "string" ? parsed.providerId : undefined,
    };
  } catch {
    return null;
  }
}

export function loadStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE);
  if (!raw) return null;
  return parseStoredSession(raw);
}

export function saveStoredSession(session: StoredAuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_SESSION_STORAGE, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_STORAGE);
  // Cleanup previous storage key used by old dashboard auth.
  localStorage.removeItem("admin_key");
}

