"use client";

import { useEffect, useState, type ReactNode } from "react";

const MIN_WIDTH = 1024;

export function DesktopOnlyGuard({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= MIN_WIDTH);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isDesktop === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-affecio-bg text-affecio-muted">
        Loading...
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-affecio-bg px-8 text-center">
        <p className="text-2xl font-semibold tracking-tight text-affecio-text">Affecio Admin</p>
        <p className="mt-4 max-w-sm text-affecio-muted">
          Affecio Admin is available on desktop only. Please use a screen at least 1024px wide.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
