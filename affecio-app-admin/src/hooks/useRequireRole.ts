"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/types/admin";
import { useAuth } from "@/providers/AuthProvider";

export function useRequireRole(allowedRoles: AdminRole[]) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(admin.role)) {
      router.replace("/");
    }
  }, [admin, allowedRoles, isLoading, router]);

  return { admin, isLoading, isAuthorized: admin ? allowedRoles.includes(admin.role) : false };
}
