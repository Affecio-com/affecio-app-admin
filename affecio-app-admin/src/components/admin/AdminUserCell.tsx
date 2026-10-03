"use client";

import { AdminAvatar, type AdminAvatarUser } from "@/components/admin/AdminAvatar";
import { cn } from "@/lib/utils";

export interface AdminUserCellAdmin extends AdminAvatarUser {
  id: string;
  email?: string | null;
  role?: string;
}

export function AdminUserCell({
  admin,
  subtitle = false,
  size = "md",
  className,
}: {
  admin: AdminUserCellAdmin | null | undefined;
  subtitle?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!admin) {
    return <span className="text-xs text-affecio-muted">Unassigned</span>;
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <AdminAvatar admin={admin} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-affecio-text">{admin.name}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-affecio-muted">
            {admin.email ?? (admin.role ? admin.role.replace(/_/g, " ") : admin.id.slice(0, 8))}
          </span>
        ) : null}
      </span>
    </span>
  );
}
