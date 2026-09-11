"use client";

import { AdminSidebar, ADMIN_SIDEBAR_WIDTH } from "@/components/layout/AdminSidebar";
import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { IdleTimeoutGuard } from "@/components/layout/IdleTimeoutGuard";
import { useRequireRole } from "@/hooks/useRequireRole";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireRole([
    "super_admin",
    "admin",
    "moderator",
    "support",
    "developer",
    "marketing",
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen min-w-desktop items-center justify-center bg-affecio-bg text-sm text-affecio-muted">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-desktop bg-affecio-bg">
      <IdleTimeoutGuard />
      <AdminSidebar />
      <div className="flex min-h-screen flex-col" style={{ marginLeft: ADMIN_SIDEBAR_WIDTH }}>
        <AdminTopBar />
        <main className="flex-1 px-8 py-8">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
