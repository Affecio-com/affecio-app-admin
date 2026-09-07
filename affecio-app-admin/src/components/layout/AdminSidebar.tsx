"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavGroupsForRole } from "@/config/nav";
import { useAuth } from "@/providers/AuthProvider";

const SIDEBAR_WIDTH = 248;

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const groups = admin ? getNavGroupsForRole(admin.role) : [];

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-affecio-border bg-affecio-bg"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Image src="/icon.png" alt="Affecio" width={28} height={28} className="h-7 w-7" />
        <Link href="/" className="font-mondwest text-lg font-semibold text-affecio-text">
          Affecio
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-affecio-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                        isActive
                          ? "bg-affecio-surface font-medium text-affecio-text"
                          : "text-affecio-muted hover:bg-affecio-surface/50 hover:text-affecio-text",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-affecio-border p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-affecio-muted transition-colors hover:bg-affecio-surface hover:text-affecio-danger"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export const ADMIN_SIDEBAR_WIDTH = SIDEBAR_WIDTH;
