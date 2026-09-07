"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavForRole } from "@/config/nav";
import { useAuth } from "@/providers/AuthProvider";

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin } = useAuth();
  const items = admin ? getNavForRole(admin.role) : [];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[240px] shrink-0 flex-col border-r border-affecio-border bg-affecio-bg">
      <div className="flex h-16 items-center gap-3 border-b border-affecio-divider px-5">
        <Image src="/icon.png" alt="Affecio" width={28} height={28} className="h-7 w-7" />
        <Link href="/" className="font-mondwest text-lg font-semibold text-affecio-text">
          Admin
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-affecio-accent bg-affecio-surface pl-[10px] text-affecio-text"
                  : "border-l-2 border-transparent text-affecio-muted hover:bg-affecio-input hover:text-affecio-text",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
