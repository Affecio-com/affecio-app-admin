"use client";

import Link from "next/link";
import { ChevronRight, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { getSessionStartedAt } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

export function SettingsProfileCard() {
  const { admin } = useAuth();
  if (!admin) return null;

  return (
    <AffecioCard className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-affecio-muted">Signed in as</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-affecio-text">{admin.name}</h2>
          <p className="mt-1 text-sm text-affecio-muted">{admin.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill label={admin.role.replace(/_/g, " ")} />
            {admin.mfaEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                MFA enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-affecio-muted">
                <ShieldOff className="h-3.5 w-3.5" />
                MFA off
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-affecio-muted">
          {admin.lastLoginAt ? (
            <p>Last login {formatDateTime(admin.lastLoginAt)}</p>
          ) : (
            <p>First session</p>
          )}
          <p>Last activity {formatRelativeTime(admin.lastActivityAt)}</p>
          {getSessionStartedAt() ? (
            <p>This session since {formatDateTime(getSessionStartedAt()!)}</p>
          ) : null}
          <Link
            href="/settings/profile"
            className="mt-2 inline-flex items-center gap-1 text-affecio-link hover:underline"
          >
            Edit profile
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </AffecioCard>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <AffecioCard>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-affecio-text">{title}</h2>
        {description ? <p className="mt-1 text-sm text-affecio-muted">{description}</p> : null}
      </div>
      {children}
    </AffecioCard>
  );
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-affecio-border py-4 last:border-b-0">
      <span>
        <span className="block text-sm font-medium text-affecio-text">{label}</span>
        <span className="mt-0.5 block text-xs text-affecio-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-affecio-border accent-affecio-text"
      />
    </label>
  );
}

export function SettingsBackLink({ href = "/settings", label = "← Settings" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="text-sm text-affecio-muted transition-colors hover:text-affecio-text">
      {label}
    </Link>
  );
}

export function SecurityIcon() {
  return <Shield className="h-4 w-4 text-affecio-muted" />;
}
