import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { rateLimit } from "../middleware/rateLimit";
import { strongPasswordSchema } from "../schemas/auth";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin"));

const createAdminSchema = z.object({
  email: z.email(),
  password: strongPasswordSchema,
  name: z.string().min(1).max(100),
  role: z.enum(["super_admin", "admin", "moderator", "support", "developer", "marketing"]),
});

router.get("/", async (_req, res) => {
  const admins = await prisma.adminUser.findMany({
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
  });
  res.json({ data: admins });
});

router.post(
  "/",
  rateLimit(10, 60_000),
  auditAction("admin.create", "admin", (req) => req.body.email ?? "unknown"),
  async (req, res) => {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      res.status(400).json({ message: first ?? "Invalid admin payload" });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const admin = await prisma.adminUser.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        role: parsed.data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });

    res.status(201).json({ data: admin });
  },
);

export default router;
