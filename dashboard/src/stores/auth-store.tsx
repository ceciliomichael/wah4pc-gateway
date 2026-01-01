"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { validateAuthKey } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const AUTH_KEY_STORAGE = "admin_key";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(AUTH_KEY_STORAGE);
    if (storedKey) {
      validateAuthKey(storedKey)
        .then((valid) => {
          setIsAuthenticated(valid);
          if (!valid) {
            localStorage.removeItem(AUTH_KEY_STORAGE);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const valid = await validateAuthKey(key);
      if (valid) {
        localStorage.setItem(AUTH_KEY_STORAGE, key);
        setIsAuthenticated(true);
      }
      return valid;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY_STORAGE);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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