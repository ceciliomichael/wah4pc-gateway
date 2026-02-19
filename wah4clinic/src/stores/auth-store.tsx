"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CLINIC_LOGIN_PASSWORD } from "@/lib/auth/auth-config";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "@/lib/auth/auth-session";

interface LoginResult {
	success: boolean;
	error?: string;
}

interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	loginWithPassword: (password: string) => Promise<LoginResult>;
	logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const clearAuthState = useCallback(() => {
		clearStoredSession();
		setIsAuthenticated(false);
	}, []);

	useEffect(() => {
		const session = loadStoredSession();
		setIsAuthenticated(Boolean(session?.authenticated));
		setIsLoading(false);
	}, [clearAuthState]);

	const loginWithPassword = useCallback(async (password: string): Promise<LoginResult> => {
		setIsLoading(true);
		if (password !== CLINIC_LOGIN_PASSWORD) {
			setIsLoading(false);
			return { success: false, error: "Invalid password." };
		}

		saveStoredSession({
			version: 1,
			authenticated: true,
		});
		setIsAuthenticated(true);
		setIsLoading(false);
		return { success: true };
	}, []);

	const logout = useCallback(() => {
		clearAuthState();
	}, [clearAuthState]);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				loginWithPassword,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthState {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
