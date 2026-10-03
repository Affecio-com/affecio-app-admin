"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsBackLink, SettingsSection } from "@/components/settings/SettingsSections";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { getSessionStartedAt } from "@/lib/auth-storage";
import { AdminPhotoUpload } from "@/components/settings/AdminPhotoUpload";
import { updateProfile } from "@/services/adminAuth";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfileSettingsPage() {
  const { admin, updateAdmin } = useAuth();
  const [name, setName] = useState(admin?.name ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin?.name) setName(admin.name);
  }, [admin?.name]);

  const mutation = useMutation({
    mutationFn: () => updateProfile(name.trim()),
    onSuccess: (updated) => {
      updateAdmin(updated);
      setMessage("Profile updated.");
      setError("");
    },
    onError: () => setError("Failed to update profile."),
  });

  if (!admin) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="Your admin account details." action={<SettingsBackLink />} />

      <SettingsSection title="Account information">
        <AdminPhotoUpload admin={admin} />
        {message ? <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
        {error ? (
          <div className="mb-4">
            <ApiErrorMessage message={error} />
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-affecio-text">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-affecio-text">Email</label>
            <Input value={admin.email} disabled className="opacity-60" />
            <p className="mt-1 text-xs text-affecio-muted">Contact a super admin to change your email.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-affecio-muted">Role</span>
            <StatusPill label={admin.role.replace(/_/g, " ")} />
          </div>
          <div className="text-sm text-affecio-muted">
            Member since {formatDateTime(admin.createdAt)}
            {admin.lastLoginAt ? ` · Last login ${formatDateTime(admin.lastLoginAt)}` : null}
          </div>
          <div className="text-sm text-affecio-muted">
            Last activity {formatRelativeTime(admin.lastActivityAt)}
            {getSessionStartedAt()
              ? ` · This session started ${formatDateTime(getSessionStartedAt()!)}`
              : null}
          </div>
          <AffecioButton
            disabled={mutation.isPending || !name.trim() || name.trim() === admin.name}
            onClick={() => mutation.mutate()}
          >
            Save changes
          </AffecioButton>
        </div>
      </SettingsSection>
    </div>
  );
}
