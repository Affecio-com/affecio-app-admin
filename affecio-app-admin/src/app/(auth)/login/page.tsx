"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
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
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Login to your account"
      description="Access moderation tools, user management, verification queues, and platform analytics from one secure dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-affecio-text">
            Email <span className="text-affecio-accent">*</span>
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
            Password <span className="text-affecio-accent">*</span>
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

        <AffecioButton type="submit" className="h-11 w-full rounded-xl" disabled={isLoading}>
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
