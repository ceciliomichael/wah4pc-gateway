"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
  type AuthIdentity,
  type SessionMode,
} from "@/lib/auth-session";
import { fetchAuthIdentityWithApiKey, fetchAuthIdentityWithMasterKey } from "@/lib/api";

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  identity: AuthIdentity | null;
  sessionMode: SessionMode | null;
  loginAdmin: (key: string) => Promise<LoginResult>;
  loginProvider: (providerId: string, apiKey: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(null);

  const clearAuthState = useCallback(() => {
    clearStoredSession();
    setIsAuthenticated(false);
    setIdentity(null);
    setSessionMode(null);
  }, []);

  useEffect(() => {
    const session = loadStoredSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    const validate = async () => {
      if (session.mode === "admin") {
        const foundIdentity = await fetchAuthIdentityWithMasterKey(session.credential);
        if (foundIdentity && foundIdentity.role === "admin") {
          setIsAuthenticated(true);
          setIdentity(foundIdentity);
          setSessionMode("admin");
          setIsLoading(false);
          return;
        }
      } else {
        const foundIdentity = await fetchAuthIdentityWithApiKey(session.credential);
        if (
          foundIdentity &&
          foundIdentity.role === "user" &&
          foundIdentity.providerId &&
          foundIdentity.providerId === session.providerId
        ) {
          setIsAuthenticated(true);
          setIdentity(foundIdentity);
          setSessionMode("provider");
          setIsLoading(false);
          return;
        }
      }

      clearAuthState();
      setIsLoading(false);
    };

    validate();
  }, [clearAuthState]);

  const loginAdmin = useCallback(async (key: string): Promise<LoginResult> => {
    setIsLoading(true);
    const foundIdentity = await fetchAuthIdentityWithMasterKey(key);
    if (!foundIdentity || foundIdentity.role !== "admin") {
      setIsLoading(false);
      return { success: false, error: "Invalid admin key." };
    }

    saveStoredSession({
      version: 2,
      mode: "admin",
      credential: key,
    });
    setIsAuthenticated(true);
    setIdentity(foundIdentity);
    setSessionMode("admin");
    setIsLoading(false);
    return { success: true };
  }, []);

  const loginProvider = useCallback(
    async (providerId: string, apiKey: string): Promise<LoginResult> => {
      setIsLoading(true);
      const foundIdentity = await fetchAuthIdentityWithApiKey(apiKey);
      if (!foundIdentity || foundIdentity.role !== "user") {
        setIsLoading(false);
        return { success: false, error: "Invalid provider API key." };
      }
      if (!foundIdentity.providerId || foundIdentity.providerId !== providerId) {
        setIsLoading(false);
        return { success: false, error: "Provider ID does not match this API key." };
      }

      saveStoredSession({
        version: 2,
        mode: "provider",
        credential: apiKey,
        providerId,
      });
      setIsAuthenticated(true);
      setIdentity(foundIdentity);
      setSessionMode("provider");
      setIsLoading(false);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        identity,
        sessionMode,
        loginAdmin,
        loginProvider,
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

