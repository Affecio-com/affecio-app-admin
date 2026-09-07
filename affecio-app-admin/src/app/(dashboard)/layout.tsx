"use client";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { useRequireRole } from "@/hooks/useRequireRole";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireRole([
    "super_admin",
    "admin",
    "moderator",
    "support",
    "developer",
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen min-w-desktop items-center justify-center bg-affecio-bg text-sm text-affecio-muted">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-desktop bg-affecio-bg">
      <AdminSidebar />
      <div className="ml-[240px] flex min-h-screen flex-col">
        <AdminTopBar />
        <main className="flex-1 px-8 py-6">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
