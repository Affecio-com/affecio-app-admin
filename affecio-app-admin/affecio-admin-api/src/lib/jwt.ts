import jwt, { type SignOptions } from "jsonwebtoken";
import type { AdminRole } from "@prisma/client";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = (process.env.ADMIN_JWT_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];
const REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET ?? JWT_SECRET;

if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-me") {
  console.error("ADMIN_JWT_SECRET is not set — auth tokens will fail in production.");
}

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: AdminRole;
  tv: number;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload & { type?: string };
  // Refresh and MFA-challenge tokens may share this secret; they must never authenticate requests.
  if (payload.type) {
    throw new Error("Invalid access token");
  }
  return payload;
}

export function signMfaChallengeToken(adminId: string, tokenVersion: number): string {
  return jwt.sign({ sub: adminId, type: "mfa", tv: tokenVersion }, JWT_SECRET, { expiresIn: "5m" });
}

export function verifyMfaChallengeToken(token: string): { sub: string; tv: number } {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string; type?: string; tv?: number };
  if (payload.type !== "mfa") {
    throw new Error("Invalid MFA challenge");
  }
  return { sub: payload.sub, tv: payload.tv ?? 0 };
}

export function signRefreshToken(adminId: string, tokenVersion: number): string {
  return jwt.sign({ sub: adminId, type: "refresh", tv: tokenVersion }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyRefreshToken(token: string): { sub: string; tv: number } {
  const payload = jwt.verify(token, REFRESH_SECRET) as { sub: string; type?: string; tv?: number };
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return { sub: payload.sub, tv: payload.tv ?? 0 };
}
