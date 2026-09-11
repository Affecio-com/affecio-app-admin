"use client";

import { useEffect, useRef, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { useAuth } from "@/providers/AuthProvider";

const IDLE_MS = 30 * 60 * 1000;
const WARN_MS = 25 * 60 * 1000;
const HEARTBEAT_MS = 60_000;

export function IdleTimeoutGuard() {
  const { logout, isAuthenticated, refreshAdmin } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastActive = useRef(Date.now());
  const lastHeartbeat = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const bump = () => {
      lastActive.current = Date.now();
      setRemaining(null);
      if (Date.now() - lastHeartbeat.current > HEARTBEAT_MS) {
        lastHeartbeat.current = Date.now();
        void refreshAdmin();
      }
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }));

    const timer = window.setInterval(() => {
      const idle = Date.now() - lastActive.current;
      if (idle >= IDLE_MS) {
        logout();
        return;
      }
      if (idle >= WARN_MS) {
        setRemaining(Math.ceil((IDLE_MS - idle) / 1000));
      }
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, bump));
      window.clearInterval(timer);
    };
  }, [isAuthenticated, logout, refreshAdmin]);

  if (remaining == null) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-affecio-border bg-affecio-surface px-4 py-3 shadow-panel">
      <p className="text-sm text-affecio-text">
        Session idle. Signing out in {remaining}s for security.
      </p>
      <AffecioButton
        variant="secondary"
        onClick={() => {
          lastActive.current = Date.now();
          setRemaining(null);
          void refreshAdmin();
        }}
      >
        Stay signed in
      </AffecioButton>
    </div>
  );
}
