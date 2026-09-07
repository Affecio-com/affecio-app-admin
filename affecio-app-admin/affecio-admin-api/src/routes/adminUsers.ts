import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin"));

const createAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
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
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: admins });
});

router.post(
  "/",
  auditAction("admin.create", "admin", (req) => req.body.email ?? "unknown"),
  async (req, res) => {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid admin payload" });
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
