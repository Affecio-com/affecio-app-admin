"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";

export function AdminTopBar() {
  const { admin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-affecio-divider bg-affecio-bg/95 px-8 backdrop-blur">
      <div className="text-sm text-affecio-muted">Admin Console</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="border-affecio-border bg-affecio-surface text-affecio-text hover:bg-affecio-input"
          >
            {admin?.name ?? "Admin"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-affecio-border bg-affecio-surface">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-affecio-text">{admin?.name}</span>
              <span className="text-xs font-normal text-affecio-muted">{admin?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.12)]" />
          <DropdownMenuItem onClick={logout} className="text-affecio-text focus:bg-affecio-input">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
