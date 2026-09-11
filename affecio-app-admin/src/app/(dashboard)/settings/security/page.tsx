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
import { isStrongPassword, STRONG_PASSWORD_HINT } from "@/lib/password-policy";
import { getApiErrorMessage } from "@/lib/api-error";

export default function SecuritySettingsPage() {
  const { admin, logout } = useAuth();
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
      setPasswordMessage("Password updated. All sessions were revoked — sign in again.");
      setPasswordError("");
      window.setTimeout(() => logout(), 800);
    },
    onError: (err) => {
      setPasswordMessage("");
      setPasswordError(getApiErrorMessage(err, "Failed to change password."));
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
        <SettingsSection title="Change password" description={STRONG_PASSWORD_HINT}>
          {passwordMessage ? <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">{passwordMessage}</p> : null}
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
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !isStrongPassword(newPassword) ||
                newPassword !== confirmPassword
              }
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
