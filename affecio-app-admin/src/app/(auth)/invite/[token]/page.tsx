"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getApiErrorMessage } from "@/lib/api-error";
import { isStrongPassword, STRONG_PASSWORD_HINT } from "@/lib/password-policy";
import { acceptAdminInvite, getAdminInvite } from "@/services/adminUsers";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteQuery = useQuery({
    queryKey: ["admin-invite", token],
    queryFn: () => getAdminInvite(token),
    retry: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(STRONG_PASSWORD_HINT);
      return;
    }
    setIsSubmitting(true);
    try {
      await acceptAdminInvite(token, password);
      router.push("/login?invited=1");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not accept invitation."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (inviteQuery.isLoading) {
    return (
      <AuthShell title="Checking invitation" description="Please wait while we validate your invite link.">
        <p className="text-sm text-affecio-muted">Loading…</p>
      </AuthShell>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <AuthShell
        title="Invitation unavailable"
        description="This link may have expired or already been used."
      >
        <ApiErrorMessage message="Invalid or expired invitation." />
        <Link href="/login" className="mt-6 inline-block text-sm text-affecio-accent hover:underline">
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  const invite = inviteQuery.data;

  return (
    <AuthShell
      title="Accept invitation"
      description={`Create a password for ${invite.email} (${invite.role.replace(/_/g, " ")}) to join Affecio Admin.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <ApiErrorMessage message={error} /> : null}
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={`Password — ${STRONG_PASSWORD_HINT}`}
        />
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Confirm password"
        />
        <AffecioButton
          type="submit"
          className="w-full"
          disabled={isSubmitting || password.length < 12 || !isStrongPassword(password)}
        >
          {isSubmitting ? "Creating account…" : "Create password & continue"}
        </AffecioButton>
      </form>
      <p className="mt-6 text-center text-sm text-affecio-muted">
        Already have access?{" "}
        <Link href="/login" className="text-affecio-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
