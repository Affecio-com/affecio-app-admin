import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "moderator", "support"));

router.get("/", async (req, res) => {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const pageSize = z.coerce.number().default(20).parse(req.query.pageSize);

  const [rows, total] = await Promise.all([
    prisma.block.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        User_Block_blockerIdToUser: { select: { id: true, name: true, email: true } },
        User_Block_blockedIdToUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.block.count(),
  ]);

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      blockerId: row.blockerId,
      blockedId: row.blockedId,
      createdAt: row.createdAt,
      blocker: row.User_Block_blockerIdToUser,
      blocked: row.User_Block_blockedIdToUser,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default router;
