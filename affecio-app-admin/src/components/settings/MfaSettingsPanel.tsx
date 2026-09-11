"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "@/components/settings/SettingsSections";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import {
  cancelMfaSetup,
  disableMfa,
  enableMfa,
  getMfaStatus,
  setupMfa,
} from "@/services/adminAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/providers/AuthProvider";

export function MfaSettingsPanel() {
  const queryClient = useQueryClient();
  const { admin, updateAdmin } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const statusQuery = useQuery({
    queryKey: ["mfa-status"],
    queryFn: getMfaStatus,
  });

  const setupMutation = useMutation({
    mutationFn: setupMfa,
    onSuccess: (data) => {
      setSetupData(data);
      setError("");
      void statusQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to start MFA setup.")),
  });

  const enableMutation = useMutation({
    mutationFn: enableMfa,
    onSuccess: (updated) => {
      updateAdmin(updated);
      setSetupData(null);
      setCode("");
      setMessage("Two-factor authentication is now enabled.");
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
    onError: () => setError("Invalid code. Check your authenticator app and try again."),
  });

  const disableMutation = useMutation({
    mutationFn: () => disableMfa(password, code),
    onSuccess: (updated) => {
      updateAdmin(updated);
      setPassword("");
      setCode("");
      setMessage("Two-factor authentication has been disabled.");
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
    onError: () => setError("Could not disable MFA. Check your password and code."),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelMfaSetup,
    onSuccess: () => {
      setSetupData(null);
      setCode("");
      void statusQuery.refetch();
    },
  });

  const status = statusQuery.data;
  const enabled = status?.enabled ?? admin?.mfaEnabled;
  const pending = status?.pending ?? false;

  useEffect(() => {
    if (
      pending &&
      !enabled &&
      !setupData &&
      !setupMutation.isPending &&
      !setupMutation.isError &&
      !error
    ) {
      setupMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, enabled]);

  const qrUrl = setupData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`
    : null;

  return (
    <SettingsSection
      title="Two-factor authentication"
      description="Require a verification code from your authenticator app when signing in."
    >
      {message ? <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
      {error ? (
        <div className="mb-4">
          <ApiErrorMessage message={error} />
        </div>
      ) : null}

      {enabled ? (
        <div className="space-y-4">
          <p className="text-sm text-affecio-muted">
            MFA is active on <span className="text-affecio-text">{admin?.email}</span>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="password"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <AffecioButton
            variant="danger"
            disabled={disableMutation.isPending || !password || code.length !== 6}
            onClick={() => disableMutation.mutate()}
          >
            Disable MFA
          </AffecioButton>
        </div>
      ) : setupData || pending ? (
        <div className="space-y-5">
          <p className="text-sm text-affecio-muted">
            Scan this QR code with Google Authenticator, Authy, or 1Password. The entry will appear as{" "}
            <span className="text-affecio-text">Affecio</span> (issuer name — authenticator apps do not
            show custom logos from the QR code).
          </p>
          <div className="flex flex-wrap items-start gap-6">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="MFA QR code"
                className="rounded-lg border border-affecio-border bg-white p-2"
                width={180}
                height={180}
              />
            ) : (
              <p className="text-sm text-affecio-muted">Generating QR code…</p>
            )}
            {setupData ? (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-affecio-muted">Manual entry key</p>
                <code className="mt-2 block break-all rounded-lg bg-affecio-input px-3 py-2 text-xs text-affecio-text">
                  {setupData.secret}
                </code>
              </div>
            ) : null}
          </div>
          <Input
            inputMode="numeric"
            placeholder="Enter 6-digit code to confirm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <AffecioButton
              disabled={enableMutation.isPending || code.length !== 6}
              onClick={() => enableMutation.mutate(code)}
            >
              Confirm & enable
            </AffecioButton>
            <AffecioButton
              variant="secondary"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel setup
            </AffecioButton>
          </div>
        </div>
      ) : (
        <AffecioButton disabled={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
          Set up authenticator app
        </AffecioButton>
      )}
    </SettingsSection>
  );
}
