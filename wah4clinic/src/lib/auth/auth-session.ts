export interface StoredAuthSession {
	version: 1;
	authenticated: true;
}

export const AUTH_SESSION_STORAGE = "wah4clinic_auth_session_v1";

export function parseStoredSession(raw: string): StoredAuthSession | null {
	let parsed: {
		version?: number;
		authenticated?: boolean;
	};

	try {
		parsed = JSON.parse(raw) as {
			version?: number;
			authenticated?: boolean;
		};
	} catch {
		return null;
	}

	if (parsed.version !== 1) return null;
	if (parsed.authenticated !== true) return null;

	return {
		version: 1,
		authenticated: true,
	};
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
}
