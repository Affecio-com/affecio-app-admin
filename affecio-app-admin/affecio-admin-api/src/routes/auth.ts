import { Router } from "express";
import { z } from "zod";
import { loginSchema, mfaVerifySchema } from "../schemas/auth";
import { prisma } from "../lib/prisma";
import { signAdminToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { verifyPassword } from "../lib/password";
import { verifyMfaCode } from "../lib/mfa";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

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

  const accessToken = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role });
  const refreshToken = signRefreshToken(admin.id);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  res.json({
    data: {
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
    },
  });
});

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
  if (!admin?.mfaSecret) {
    res.status(401).json({ message: "MFA not configured" });
    return;
  }

  if (!verifyMfaCode(admin.mfaSecret, parsed.data.code)) {
    res.status(401).json({ message: "Invalid MFA code" });
    return;
  }

  const accessToken = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role });
  const refreshToken = signRefreshToken(admin.id);

  res.json({
    data: {
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
    },
  });
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
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({ data: admin });
});

router.post("/logout", requireAdminAuth, (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
