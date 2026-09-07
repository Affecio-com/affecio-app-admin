import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "moderator"));

router.get("/", async (req, res) => {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const pageSize = z.coerce.number().default(20).parse(req.query.pageSize);

  const [rows, total] = await Promise.all([
    prisma.callSession.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startedAt: "desc" },
      include: {
        User_CallSession_userAIdToUser: { select: { id: true, name: true, email: true } },
        User_CallSession_userBIdToUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.callSession.count(),
  ]);

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      channelName: row.channelName,
      userAId: row.userAId,
      userBId: row.userBId,
      status: row.status,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      userA: row.User_CallSession_userAIdToUser,
      userB: row.User_CallSession_userBIdToUser,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default router;
