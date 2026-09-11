"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { getPageTitleFromPath } from "@/lib/page-title";
import { formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";

function getInitials(name?: string | null): string {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatRole(role?: string): string {
  if (!role) return "Admin";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminTopBar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const pageTitle = getPageTitleFromPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-affecio-border bg-[var(--affecio-topbar)] px-6 backdrop-blur-md">
      <p className="min-w-0 truncate text-sm font-medium tracking-tight text-affecio-text">
        {pageTitle}
      </p>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-affecio-border bg-affecio-surface py-1 pl-1 pr-2 transition-colors hover:bg-affecio-input"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-affecio-text text-[11px] font-semibold text-affecio-bg">
                {getInitials(admin?.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium text-affecio-text">{admin?.name ?? "Admin"}</span>
                <span className="block text-[11px] text-affecio-muted">{formatRole(admin?.role)}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-affecio-muted sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm text-affecio-text">{admin?.name}</span>
                <span className="text-xs font-normal text-affecio-muted">{admin?.email}</span>
                {admin?.lastActivityAt ? (
                  <span className="mt-1 text-[11px] font-normal text-affecio-muted">
                    Active {formatRelativeTime(admin.lastActivityAt)}
                  </span>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
