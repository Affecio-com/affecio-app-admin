"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import * as adminAuthService from "@/services/adminAuth";
import { useAuth } from "@/providers/AuthProvider";

export default function MfaPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const adminId = sessionStorage.getItem("affecio_mfa_admin_id");
    if (!adminId) {
      router.push("/login");
      return;
    }
    setIsLoading(true);
    try {
      const session = await adminAuthService.verifyMfa(code, adminId);
      sessionStorage.removeItem("affecio_mfa_admin_id");
      setSession(session);
      router.push("/");
    } catch {
      setError("Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      description="Enter the 6-digit code from your authenticator app."
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
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="one-time-code"
            className="h-11 tracking-[0.3em]"
          />
        </div>
        {error ? <p className="text-sm text-affecio-danger">{error}</p> : null}
        <AffecioButton type="submit" className="h-11 w-full rounded-lg" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify"}
        </AffecioButton>
      </form>
    </AuthShell>
  );
}
