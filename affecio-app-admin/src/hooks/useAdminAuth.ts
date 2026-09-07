"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSession, AdminUser } from "@/types/admin";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth-storage";
import * as adminAuthService from "@/services/adminAuth";

interface UseAdminAuthReturn {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
      .then(setAdmin)
      .catch(() => clearStoredToken())
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback((session: AdminSession) => {
    setStoredToken(session.accessToken);
    setAdmin(session.admin);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const me = await adminAuthService.getMe();
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
    async (email: string, password: string) => {
      const result = await adminAuthService.login(email, password);
      if ("requiresMfa" in result && result.requiresMfa) {
        sessionStorage.setItem("affecio_mfa_admin_id", result.adminId);
        router.push("/mfa");
        return;
      }
      setSession(result as AdminSession);
    },
    [router, setSession],
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setAdmin(null);
  }, []);

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
