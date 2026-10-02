import { Router } from "express";
import { z } from "zod";
import { strongPasswordSchema } from "../schemas/auth";
import * as adminInviteService from "../services/adminInviteService";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

router.get("/:token", rateLimit(30, 60_000), async (req, res) => {
  const token = z.string().min(16).max(128).safeParse(req.params.token);
  if (!token.success) {
    res.status(400).json({ message: "Invalid invitation link" });
    return;
  }

  const invite = await adminInviteService.getInviteByToken(token.data);
  if (!invite) {
    res.status(404).json({ message: "This invitation is invalid or has expired." });
    return;
  }

  res.json({
    data: {
      email: invite.email,
      name: invite.name,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
    },
  });
});

router.post("/accept", rateLimit(10, 60_000), async (req, res) => {
  const parsed = z
    .object({
      token: z.string().min(16).max(128),
      password: strongPasswordSchema,
    })
    .safeParse(req.body);

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    res.status(400).json({ message: first ?? "Invalid request" });
    return;
  }

  try {
    const admin = await adminInviteService.acceptAdminInvite({
      rawToken: parsed.data.token,
      password: parsed.data.password,
    });
    res.json({
      data: admin,
      message: "Account created. You can sign in now.",
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "INVITE_EXPIRED" || code === "INVALID_INVITE") {
      res.status(404).json({ message: "This invitation is invalid or has expired." });
      return;
    }
    if (code === "ALREADY_ADMIN") {
      res.status(409).json({ message: "An account with this email already exists. Sign in instead." });
      return;
    }
    console.error("acceptAdminInvite failed:", err);
    res.status(500).json({ message: "Could not complete invitation." });
  }
});

export default router;
