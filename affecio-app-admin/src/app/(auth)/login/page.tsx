"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-error";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invited = searchParams.get("invited") === "1";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const outcome = await login(email, password);
      if (outcome === "success") {
        router.push("/");
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not sign in. Check your email, password, and admin API URL configuration.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use your Affecio admin credentials to access the internal operations console."
    >
      {invited ? (
        <p className="mb-4 rounded-lg border border-affecio-border bg-affecio-input px-3 py-2 text-sm text-affecio-text">
          Your account is ready. Sign in with the password you just created.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-affecio-text">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-affecio-text">
            Password
          </label>
          <PasswordInput
            id="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11"
          />
        </div>

        {error ? <p className="text-sm text-affecio-danger">{error}</p> : null}

        <AffecioButton type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </AffecioButton>
      </form>

      <p className="mt-8 text-center text-xs text-affecio-muted">
        Desktop admin portal ·{" "}
        <Link href="https://affecio.com" className="affecio-link">
          affecio.com
        </Link>
      </p>
    </AuthShell>
  );
}
