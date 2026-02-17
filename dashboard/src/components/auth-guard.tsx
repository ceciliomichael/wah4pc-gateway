"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth-store";
import { LuLoaderCircle } from "react-icons/lu";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "user">;
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, identity } = useAuth();
  const router = useRouter();
  const isRoleAllowed =
    !allowedRoles || (identity ? allowedRoles.includes(identity.role) : false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isLoading && isAuthenticated && !isRoleAllowed) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, isRoleAllowed, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LuLoaderCircle className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isRoleAllowed) {
    return null;
  }

  return <>{children}</>;
}
