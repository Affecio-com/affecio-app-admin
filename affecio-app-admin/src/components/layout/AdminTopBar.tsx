"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPageTitleFromPath } from "@/lib/page-title";
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-affecio-border bg-affecio-bg/90 px-6 backdrop-blur-sm">
      <p className="min-w-0 truncate font-mondwest text-base font-semibold text-affecio-text">
        {pageTitle}
      </p>

      <div className="relative mx-auto hidden max-w-md flex-1 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-affecio-muted" />
        <input
          type="search"
          placeholder="Search..."
          className="h-9 w-full rounded-lg border border-affecio-border bg-affecio-surface pl-9 pr-3 text-sm text-affecio-text placeholder:text-affecio-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-affecio-border"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-affecio-border text-affecio-muted transition-colors hover:bg-affecio-surface hover:text-affecio-text"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-affecio-border py-1 pl-1 pr-2 transition-colors hover:bg-affecio-surface"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-affecio-text text-[11px] font-semibold text-black">
                {getInitials(admin?.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium text-affecio-text">{admin?.name ?? "Admin"}</span>
                <span className="block text-[11px] text-affecio-muted">{formatRole(admin?.role)}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-affecio-muted sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-affecio-border bg-affecio-surface">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm text-affecio-text">{admin?.name}</span>
                <span className="text-xs font-normal text-affecio-muted">{admin?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-affecio-border" />
            <DropdownMenuItem onClick={logout} className="text-affecio-text focus:bg-affecio-input">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
