import { Router } from "express";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";
import {
  changePasswordSchema,
  loginSchema,
  mfaDisableSchema,
  mfaVerifySchema,
  updateProfileSchema,
} from "../schemas/auth";
import { prisma } from "../lib/prisma";
import { signAdminToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { buildOtpAuthUrl, generateMfaSecret, verifyMfaCode } from "../lib/mfa";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { rateLimit } from "../middleware/rateLimit";
import { auditAction } from "../middleware/auditAction";

const router = Router();

function adminPublicSelect() {
  return {
    id: true,
    email: true,
    name: true,
    role: true,
    mfaEnabled: true,
    lastLoginAt: true,
    createdAt: true,
  } as const;
}

function sessionResponse(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  createdAt: Date;
}) {
  const accessToken = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role });
  const refreshToken = signRefreshToken(admin.id);
  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mfaEnabled: admin.mfaEnabled,
      createdAt: admin.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

router.post("/login", rateLimit(20, 60_000), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid credentials" });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!admin) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (admin.mfaEnabled) {
    res.json({ data: { requiresMfa: true, adminId: admin.id } });
    return;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  res.json({ data: sessionResponse(admin) });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = z.string().optional().parse(req.body.refreshToken);
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const accessToken = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role });
    res.json({ data: { accessToken } });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.get("/me", requireAdminAuth, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin!.id },
    select: adminPublicSelect(),
  });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({ data: admin });
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
      select: adminPublicSelect(),
    });

    res.json({ data: admin });
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
      res.status(400).json({ message: "Invalid password payload" });
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
      data: { passwordHash },
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
      select: adminPublicSelect(),
    });

    res.json({ data: updated });
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
      select: adminPublicSelect(),
    });

    res.json({ data: updated });
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

router.post("/logout", requireAdminAuth, (_req, res) => {
  res.json({ message: "Logged out" });
});

/** Login-time MFA verification — must stay at POST /mfa (after all /mfa/* settings routes). */
router.post("/mfa", rateLimit(10, 60_000), async (req, res) => {
  const parsed = mfaVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid MFA code" });
    return;
  }

  const adminId = z.string().optional().parse(req.body.adminId);
  if (!adminId) {
    res.status(400).json({ message: "Admin ID required" });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin?.mfaSecret || !admin.mfaEnabled) {
    res.status(401).json({ message: "MFA not configured" });
    return;
  }

  if (!verifyMfaCode(admin.mfaSecret, parsed.data.code)) {
    res.status(401).json({ message: "Invalid MFA code" });
    return;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  res.json({ data: sessionResponse(admin) });
});

export default router;
