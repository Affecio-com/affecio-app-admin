"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSession, AdminUser } from "@/types/admin";
import { clearStoredToken, ensureSessionCookie, getStoredToken, setStoredToken } from "@/lib/auth-storage";
import * as adminAuthService from "@/services/adminAuth";

interface UseAdminAuthReturn {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<"mfa" | "success">;
  logout: () => void;
  setSession: (session: AdminSession) => void;
  refreshAdmin: () => Promise<AdminUser | null>;
  updateAdmin: (admin: AdminUser) => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    adminAuthService
      .getMe()
      .then((me) => {
        ensureSessionCookie();
        setAdmin(me);
      })
      .catch(() => clearStoredToken())
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback((session: AdminSession) => {
    setStoredToken(session.accessToken, session.refreshToken);
    setAdmin(session.admin);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const me = await adminAuthService.getMe();
      ensureSessionCookie();
      setAdmin(me);
      return me;
    } catch {
      clearStoredToken();
      setAdmin(null);
      return null;
    }
  }, []);

  const updateAdmin = useCallback((next: AdminUser) => {
    setAdmin(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<"mfa" | "success"> => {
      const result = await adminAuthService.login(email, password);
      if ("requiresMfa" in result && result.requiresMfa) {
        sessionStorage.setItem("affecio_mfa_admin_id", result.adminId);
        sessionStorage.setItem("affecio_mfa_admin_email", email);
        router.push("/mfa");
        return "mfa";
      }
      setSession(result as AdminSession);
      return "success";
    },
    [router, setSession],
  );

  const logout = useCallback(() => {
    void adminAuthService.logout().catch(() => undefined);
    clearStoredToken();
    setAdmin(null);
    router.replace("/login");
  }, [router]);

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    setSession,
    refreshAdmin,
    updateAdmin,
  };
}
