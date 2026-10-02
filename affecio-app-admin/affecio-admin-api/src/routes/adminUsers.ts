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

function serializeInvite(invite: { expiresAt: Date; createdAt: Date }) {
  return {
    ...invite,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  };
}

function inviteResponse(result: Awaited<ReturnType<typeof adminInviteService.createAdminInvite>>) {
  return {
    data: {
      ...serializeInvite(result.invite),
      emailSent: result.emailSent,
      emailError: result.emailError,
      acceptUrl: result.acceptUrl,
    },
    message: result.emailSent
      ? "Invitation email sent."
      : "Invitation saved, but the email could not be sent. Share the invite link manually.",
  };
}

router.get("/", async (_req, res) => {
  const [admins, pendingInvites] = await Promise.all([
    prisma.adminUser.findMany({
      where: { disabledAt: null },
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
    pendingInvites: pendingInvites.map(serializeInvite),
  });
});

router.post(
  "/",
  rateLimit(10, 60_000),
  auditAction("admin.invite", "admin", (req) => req.body?.email ?? "unknown"),
  async (req, res) => {
    const parsed = inviteAdminSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid admin payload" });
      return;
    }

    try {
      const result = await adminInviteService.createAdminInvite({
        ...parsed.data,
        invitedById: req.admin!.id,
      });
      res.status(201).json(inviteResponse(result));
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_ADMIN") {
        res.status(409).json({ message: "This email already has an admin account." });
        return;
      }
      console.error("createAdminInvite failed:", err);
      res.status(500).json({ message: "Failed to create invitation." });
    }
  },
);

router.post(
  "/invites/:id/resend",
  rateLimit(10, 60_000),
  auditAction("admin.invite.resend", "admin_invite", (req) => String(req.params.id)),
  async (req, res) => {
    const result = await adminInviteService.resendAdminInvite(String(req.params.id), req.admin!.id);
    if (!result) {
      res.status(404).json({ message: "Invitation not found or already accepted." });
      return;
    }
    res.json(inviteResponse(result));
  },
);

router.delete(
  "/invites/:id",
  auditAction("admin.invite.revoke", "admin_invite", (req) => String(req.params.id)),
  async (req, res) => {
    const revoked = await adminInviteService.revokeAdminInvite(String(req.params.id));
    if (!revoked) {
      res.status(404).json({ message: "Invitation not found or already accepted." });
      return;
    }
    res.json({ message: "Invitation revoked." });
  },
);

router.delete(
  "/:id",
  auditAction("admin.remove", "admin", (req) => String(req.params.id)),
  async (req, res) => {
    try {
      const removed = await adminInviteService.removeAdminAccess(String(req.params.id), req.admin!.id);
      if (!removed) {
        res.status(404).json({ message: "Admin not found." });
        return;
      }
      res.json({ message: `Access removed for ${removed.email}.` });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "CANNOT_REMOVE_SELF") {
        res.status(400).json({ message: "You can't remove your own access." });
        return;
      }
      if (code === "LAST_SUPER_ADMIN") {
        res.status(400).json({ message: "At least one super admin must remain." });
        return;
      }
      throw err;
    }
  },
);

export default router;
