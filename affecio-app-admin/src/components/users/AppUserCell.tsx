"use client";

import Link from "next/link";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

export interface AppUserCellUser {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  profilePhotoUrl?: string | null;
}

interface AppUserCellProps {
  user: AppUserCellUser | null | undefined;
  fallbackId?: string;
  subtitle?: boolean;
  size?: "sm" | "md" | "lg";
  link?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-sm",
};

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user?: Pick<AppUserCellUser, "name" | "profilePhotoUrl"> | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = user?.profilePhotoUrl;
  const initials = getInitials(user?.name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={user?.name ?? "User"}
        className={cn("shrink-0 rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-affecio-text font-semibold text-affecio-bg",
        sizeMap[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function AppUserCell({
  user,
  fallbackId,
  subtitle = false,
  size = "md",
  link = true,
  className,
}: AppUserCellProps) {
  if (!user) {
    return <span className="font-mono text-xs text-affecio-muted">{fallbackId ?? "Unknown user"}</span>;
  }

  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <UserAvatar user={user} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-affecio-text">{user.name}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-affecio-muted">
            {user.email ?? user.phoneNumber ?? user.id.slice(0, 8)}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!link) return content;

  return (
    <Link href={`/users/${user.id}`} className="hover:opacity-80">
      {content}
    </Link>
  );
}
