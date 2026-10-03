"use client";

import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

export interface AdminAvatarUser {
  name: string;
  photoUrl?: string | null;
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-sm",
};

export function AdminAvatar({
  admin,
  size = "md",
  className,
}: {
  admin?: AdminAvatarUser | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = admin?.photoUrl;
  const initials = getInitials(admin?.name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={admin?.name ?? "Team member"}
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
