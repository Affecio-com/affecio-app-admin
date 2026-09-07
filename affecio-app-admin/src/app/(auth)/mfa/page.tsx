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
    setIsLoading(true);
    try {
      const session = await adminAuthService.verifyMfa(code);
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
      description="Enter the 6-digit code from your authenticator app to complete sign in."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="mfa-code" className="text-sm font-medium text-affecio-text">
            Verification code <span className="text-affecio-accent">*</span>
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
        <AffecioButton type="submit" className="h-11 w-full rounded-xl" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify"}
        </AffecioButton>
      </form>
    </AuthShell>
  );
}
