"use client";

import type { ReactNode } from "react";
import { AuthProvider as StoreAuthProvider } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
	return <StoreAuthProvider>{children}</StoreAuthProvider>;
}
