"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import * as adminAuthService from "@/services/adminAuth";
import { useAuth } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-error";

export default function MfaPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const mfaToken = sessionStorage.getItem("affecio_mfa_token");
    if (!mfaToken) {
      router.replace("/login");
      return;
    }
    setAdminEmail(sessionStorage.getItem("affecio_mfa_admin_email"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const mfaToken = sessionStorage.getItem("affecio_mfa_token");
    if (!mfaToken) {
      router.replace("/login");
      return;
    }
    setIsLoading(true);
    try {
      const session = await adminAuthService.verifyMfa(code, mfaToken);
      sessionStorage.removeItem("affecio_mfa_token");
      sessionStorage.removeItem("affecio_mfa_admin_email");
      setSession(session);
      router.push("/");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Invalid verification code. Try the latest code from your authenticator app."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      description={
        adminEmail
          ? `Enter the 6-digit code for ${adminEmail}. MFA is required for this account.`
          : "Enter the 6-digit code from your authenticator app."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="mfa-code" className="text-sm font-medium text-affecio-text">
            Verification code
          </label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            autoComplete="one-time-code"
            autoFocus
            className="h-11 tracking-[0.3em]"
          />
        </div>
        {error ? <p className="text-sm text-affecio-danger">{error}</p> : null}
        <AffecioButton type="submit" className="h-11 w-full rounded-lg" disabled={isLoading || code.length !== 6}>
          {isLoading ? "Verifying..." : "Verify & continue"}
        </AffecioButton>
      </form>
      <p className="mt-6 text-center text-sm text-affecio-muted">
        <Link href="/login" className="affecio-link">
          ← Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
