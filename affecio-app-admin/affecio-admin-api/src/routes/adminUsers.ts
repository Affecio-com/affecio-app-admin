import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { rateLimit } from "../middleware/rateLimit";
import * as adminInviteService from "../services/adminInviteService";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin"));

const inviteAdminSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["super_admin", "admin", "moderator", "support", "developer", "marketing"]),
});

router.get("/", async (_req, res) => {
  const [admins, pendingInvites] = await Promise.all([
    prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        lastLoginAt: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    adminInviteService.listPendingInvites(),
  ]);

  res.json({
    data: admins,
    pendingInvites: pendingInvites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      name: inv.name,
      role: inv.role,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      invitedBy: inv.invitedBy,
    })),
  });
});

router.post(
  "/",
  rateLimit(10, 60_000),
  auditAction("admin.invite", "admin", (req) => req.body.email ?? "unknown"),
  async (req, res) => {
    const parsed = inviteAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      res.status(400).json({ message: first ?? "Invalid admin payload" });
      return;
    }

    try {
      const result = await adminInviteService.createAdminInvite({
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        invitedById: req.admin!.id,
      });

      res.status(201).json({
        data: {
          ...result.invite,
          expiresAt: result.invite.expiresAt.toISOString(),
          createdAt: result.invite.createdAt.toISOString(),
          emailSent: result.emailSent,
          acceptUrl: result.acceptUrl,
          emailPreviewUrl: result.emailPreviewUrl,
        },
        message: result.emailSent
          ? "Invitation email sent."
          : "Invitation created, but the email could not be sent. Share the invite link manually.",
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "ALREADY_ADMIN") {
        res.status(409).json({ message: "This email already has an admin account." });
        return;
      }
      console.error("createAdminInvite failed:", err);
      res.status(500).json({ message: "Failed to send invitation." });
    }
  },
);

export default router;
