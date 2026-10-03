"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { getNavGroupsForRole } from "@/config/nav";
import { useAuth } from "@/providers/AuthProvider";

const SIDEBAR_WIDTH = 240;

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const groups = admin ? getNavGroupsForRole(admin.role) : [];

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-affecio-border bg-affecio-sidebar"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Image src="/icon.png" alt="Affecio" width={22} height={22} className="h-5 w-5" />
        <Link href="/" className="font-brand text-[17px] leading-none text-affecio-text">
          Affecio
        </Link>
        <span className="ml-auto rounded-full border border-affecio-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-affecio-muted">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {groups.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-affecio-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.external
                  ? false
                  : item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                const className = cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
                  isActive
                    ? "bg-affecio-text font-medium text-affecio-bg"
                    : "text-affecio-muted hover:bg-affecio-input hover:text-affecio-text",
                );

                return (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="min-w-0 flex-1">{item.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      </a>
                    ) : (
                      <Link href={item.href} className={className}>
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-affecio-border p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2.5">
          <AdminAvatar admin={admin} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-affecio-text">{admin?.name}</p>
            <p className="truncate text-[11px] text-affecio-muted">{admin?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] text-affecio-muted transition-colors hover:bg-affecio-input hover:text-affecio-danger"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export const ADMIN_SIDEBAR_WIDTH = SIDEBAR_WIDTH;
