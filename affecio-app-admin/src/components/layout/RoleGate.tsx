"use client";

import type { ReactNode } from "react";
import type { AdminRole } from "@/types/admin";
import { useRequireRole } from "@/hooks/useRequireRole";

interface RoleGateProps {
  allowedRoles: AdminRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { isLoading, isAuthorized } = useRequireRole(allowedRoles);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
