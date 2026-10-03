import { Router } from "express";
import express from "express";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";
import {
  changePasswordSchema,
  loginSchema,
  mfaDisableSchema,
  mfaVerifySchema,
  updateProfileSchema,
  uploadAdminPhotoSchema,
} from "../schemas/auth";
import { adminPublicSelect, serializeAdminPublic } from "../lib/adminPhotos";
import { deleteObject, isR2Configured, putObjectBuffer } from "../lib/r2";
import { prisma } from "../lib/prisma";
import {
  signAdminToken,
  signMfaChallengeToken,
  signRefreshToken,
  verifyMfaChallengeToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from "../lib/password";
import { buildOtpAuthUrl, generateMfaSecret, verifyMfaCode } from "../lib/mfa";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { rateLimit } from "../middleware/rateLimit";
import { auditAction, writeAuthAudit } from "../middleware/auditAction";

const router = Router();
const photoBodyParser = express.json({ limit: "7mb" });

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function sniffImageContentType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

async function sessionResponse(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
  lastActivityAt?: Date | null;
  photoKey?: string | null;
  tokenVersion?: number;
}) {
  const tv = admin.tokenVersion ?? 0;
  const accessToken = signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    tv,
  });
  const refreshToken = signRefreshToken(admin.id, tv);
  return {
    admin: await serializeAdminPublic({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mfaEnabled: admin.mfaEnabled,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt ?? null,
      lastActivityAt: admin.lastActivityAt ?? null,
      photoKey: admin.photoKey ?? null,
    }),
    accessToken,
    refreshToken,
  };
}

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60_000;

router.post("/login", rateLimit(8, 60_000), async (req, res) => {
  try {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid credentials" });
    return;
  }

  const found = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const admin = found?.disabledAt ? null : found;
  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    res.status(423).json({ message: "Account locked. Try again later." });
    return;
  }

  const valid = await verifyPasswordOrDummy(parsed.data.password, admin?.passwordHash ?? null);
  if (!admin || !valid) {
    if (admin) {
      const failedLoginCount = admin.failedLoginCount + 1;
      const lockedUntil = failedLoginCount >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : null;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { failedLoginCount, lockedUntil },
      });
      await writeAuthAudit({ adminId: admin.id, action: "auth.login.failed", req }).catch(() => undefined);
    }
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (admin.mfaEnabled) {
    res.json({ data: { requiresMfa: true, mfaToken: signMfaChallengeToken(admin.id, admin.tokenVersion) } });
    return;
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await writeAuthAudit({ adminId: admin.id, action: "auth.login.success", req }).catch(() => undefined);

  res.json({ data: await sessionResponse({ ...admin, ...updated }) });
  } catch (err) {
    console.error("login failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Login failed. Check API database and auth configuration." });
    }
  }
});

router.post("/refresh", rateLimit(30, 60_000), async (req, res) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || admin.disabledAt || admin.tokenVersion !== payload.tv) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      res.status(423).json({ message: "Account locked. Try again later." });
      return;
    }

    const accessToken = signAdminToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tv: admin.tokenVersion,
    });
    res.json({ data: { accessToken } });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.get("/me", requireAdminAuth, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin!.id },
    select: adminPublicSelect,
  });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({ data: await serializeAdminPublic(admin) });
});

router.patch(
  "/me",
  requireAdminAuth,
  auditAction("admin.profile.update", "admin", (req) => req.admin!.id),
  async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid profile data" });
      return;
    }

    const admin = await prisma.adminUser.update({
      where: { id: req.admin!.id },
      data: { name: parsed.data.name },
      select: adminPublicSelect,
    });

    res.json({ data: await serializeAdminPublic(admin) });
  },
);

router.post(
  "/me/photo",
  requireAdminAuth,
  rateLimit(12, 60_000),
  photoBodyParser,
  auditAction("admin.profile.photo", "admin", (req) => req.admin!.id),
  async (req, res) => {
    if (!isR2Configured()) {
      res.status(503).json({
        message: "Photo storage is not configured. Set R2_* variables on the admin API.",
      });
      return;
    }

    const parsed = uploadAdminPhotoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid photo payload" });
      return;
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(parsed.data.dataBase64, "base64");
    } catch {
      res.status(400).json({ message: "Invalid photo data" });
      return;
    }

    if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) {
      res.status(400).json({ message: "Photo must be under 5 MB" });
      return;
    }

    const sniffed = sniffImageContentType(buffer);
    if (!sniffed || sniffed !== parsed.data.contentType) {
      res.status(400).json({ message: "File must be a valid JPEG, PNG, or WebP image" });
      return;
    }

    const adminId = req.admin!.id;
    const ext = extensionForContentType(parsed.data.contentType);
    const photoKey = `admin-portraits/${adminId}/${Date.now()}.${ext}`;

    const existing = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { photoKey: true },
    });

    try {
      await putObjectBuffer(photoKey, buffer, parsed.data.contentType);
    } catch (err) {
      console.error("admin photo upload failed:", err);
      res.status(500).json({ message: "Failed to upload photo" });
      return;
    }

    const admin = await prisma.adminUser.update({
      where: { id: adminId },
      data: { photoKey },
      select: adminPublicSelect,
    });

    if (existing?.photoKey && existing.photoKey !== photoKey) {
      void deleteObject(existing.photoKey);
    }

    res.json({ data: await serializeAdminPublic(admin) });
  },
);

router.delete(
  "/me/photo",
  requireAdminAuth,
  auditAction("admin.profile.photo.remove", "admin", (req) => req.admin!.id),
  async (req, res) => {
    const existing = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: { photoKey: true },
    });

    const admin = await prisma.adminUser.update({
      where: { id: req.admin!.id },
      data: { photoKey: null },
      select: adminPublicSelect,
    });

    if (existing?.photoKey) {
      void deleteObject(existing.photoKey);
    }

    res.json({ data: await serializeAdminPublic(admin) });
  },
);

router.post(
  "/change-password",
  requireAdminAuth,
  rateLimit(5, 60_000),
  auditAction("admin.password.change", "admin", (req) => req.admin!.id),
  async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      res.status(400).json({ message: first ?? "Invalid password payload" });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    res.json({ message: "Password updated" });
  },
);

router.get("/mfa/status", requireAdminAuth, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin!.id },
    select: { mfaEnabled: true, mfaSecret: true },
  });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({
    data: {
      enabled: admin.mfaEnabled,
      pending: !!admin.mfaSecret && !admin.mfaEnabled,
    },
  });
});

router.post(
  "/mfa/setup",
  requireAdminAuth,
  rateLimit(5, 60_000),
  async (req, res) => {
    try {
      const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

      if (admin.mfaEnabled) {
        res.status(400).json({ message: "MFA is already enabled" });
        return;
      }

      const secret = admin.mfaSecret ?? generateMfaSecret();
      if (!admin.mfaSecret) {
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { mfaSecret: secret, mfaEnabled: false },
        });
      }

      const otpauthUrl = buildOtpAuthUrl(admin.email, secret);

      res.json({
        data: {
          secret,
          otpauthUrl,
        },
      });
    } catch (error) {
      console.error("MFA setup failed:", error);
      const message =
        error instanceof Error && error.message.includes("mfaSecret")
          ? "Database is missing MFA columns. Run: npx prisma db push (in affecio-admin-api)"
          : "Failed to start MFA setup";
      res.status(500).json({ message });
    }
  },
);

router.post(
  "/mfa/enable",
  requireAdminAuth,
  rateLimit(10, 60_000),
  auditAction("admin.mfa.enable", "admin", (req) => req.admin!.id),
  async (req, res) => {
    const parsed = mfaVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid verification code" });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin?.mfaSecret) {
      res.status(400).json({ message: "Run MFA setup first" });
      return;
    }

    if (admin.mfaEnabled) {
      res.status(400).json({ message: "MFA is already enabled" });
      return;
    }

    if (!verifyMfaCode(admin.mfaSecret, parsed.data.code)) {
      res.status(401).json({ message: "Invalid verification code" });
      return;
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaEnabled: true },
      select: adminPublicSelect,
    });

    res.json({ data: await serializeAdminPublic(updated) });
  },
);

router.post(
  "/mfa/disable",
  requireAdminAuth,
  rateLimit(5, 60_000),
  auditAction("admin.mfa.disable", "admin", (req) => req.admin!.id),
  async (req, res) => {
    const parsed = mfaDisableSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin?.mfaEnabled || !admin.mfaSecret) {
      res.status(400).json({ message: "MFA is not enabled" });
      return;
    }

    const validPassword = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!validPassword) {
      res.status(401).json({ message: "Password is incorrect" });
      return;
    }

    if (!verifyMfaCode(admin.mfaSecret, parsed.data.code)) {
      res.status(401).json({ message: "Invalid verification code" });
      return;
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaEnabled: false, mfaSecret: null },
      select: adminPublicSelect,
    });

    res.json({ data: await serializeAdminPublic(updated) });
  },
);

router.post(
  "/mfa/cancel-setup",
  requireAdminAuth,
  async (req, res) => {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    if (admin.mfaEnabled) {
      res.status(400).json({ message: "Cannot cancel — MFA is already enabled" });
      return;
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaSecret: null },
    });

    res.json({ message: "MFA setup cancelled" });
  },
);

router.post("/logout", requireAdminAuth, async (req, res) => {
  await prisma.adminUser.update({
    where: { id: req.admin!.id },
    data: { tokenVersion: { increment: 1 } },
  });
  await writeAuthAudit({ adminId: req.admin!.id, action: "auth.logout", req }).catch(() => undefined);
  res.json({ message: "Logged out" });
});

/** Login-time MFA verification — must stay at POST /mfa (after all /mfa/* settings routes). */
router.post("/mfa", rateLimit(10, 60_000), async (req, res) => {
  const parsed = mfaVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid MFA code" });
    return;
  }

  const mfaToken = typeof req.body?.mfaToken === "string" ? req.body.mfaToken : "";
  let challenge: { sub: string; tv: number };
  try {
    challenge = verifyMfaChallengeToken(mfaToken);
  } catch {
    res.status(401).json({ message: "MFA session expired. Sign in again." });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: challenge.sub } });
  if (!admin || admin.disabledAt || admin.tokenVersion !== challenge.tv) {
    res.status(401).json({ message: "MFA session expired. Sign in again." });
    return;
  }
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    res.status(423).json({ message: "Account locked. Try again later." });
    return;
  }

  if (!admin.mfaSecret || !admin.mfaEnabled) {
    res.status(401).json({ message: "MFA not configured" });
    return;
  }

  if (!verifyMfaCode(admin.mfaSecret, parsed.data.code)) {
    const failedLoginCount = admin.failedLoginCount + 1;
    const lockedUntil = failedLoginCount >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : null;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginCount, lockedUntil },
    });
    await writeAuthAudit({ adminId: admin.id, action: "auth.mfa.failed", req }).catch(() => undefined);
    res.status(401).json({ message: "Invalid MFA code" });
    return;
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await writeAuthAudit({ adminId: admin.id, action: "auth.login.success", req }).catch(() => undefined);

  res.json({ data: await sessionResponse({ ...admin, ...updated }) });
});

export default router;
