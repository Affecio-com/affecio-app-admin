import jwt, { type SignOptions } from "jsonwebtoken";
import type { AdminRole } from "@prisma/client";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = (process.env.ADMIN_JWT_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];
const REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET ?? JWT_SECRET;

if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-me") {
  throw new Error("ADMIN_JWT_SECRET must be set in production.");
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
  return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
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
