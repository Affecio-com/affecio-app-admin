"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { Input } from "@/components/ui/input";
import { MfaSettingsPanel } from "@/components/settings/MfaSettingsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsBackLink, SettingsSection } from "@/components/settings/SettingsSections";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { changePassword } from "@/services/adminAuth";
import { useAuth } from "@/providers/AuthProvider";

export default function SecuritySettingsPage() {
  const { admin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      await changePassword(currentPassword, newPassword);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
      setPasswordError("");
    },
    onError: (err) => {
      setPasswordMessage("");
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    },
  });

  return (
    <div>
      <PageHeader
        title="Security"
        description={`Password and authentication for ${admin?.email ?? "your account"}.`}
        action={<SettingsBackLink />}
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <SettingsSection title="Change password" description="Use at least 8 characters.">
          {passwordMessage ? <p className="mb-4 text-sm text-emerald-400">{passwordMessage}</p> : null}
          {passwordError ? (
            <div className="mb-4">
              <ApiErrorMessage message={passwordError} />
            </div>
          ) : null}
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <AffecioButton
              disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
              onClick={() => changePasswordMutation.mutate()}
            >
              Update password
            </AffecioButton>
          </div>
        </SettingsSection>

        <MfaSettingsPanel />
      </div>
    </div>
  );
}
