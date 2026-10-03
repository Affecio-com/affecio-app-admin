import { Router } from "express";
import { z } from "zod";
import { adminRefSelect, serializeAdminRef } from "../lib/adminPhotos";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin"));

router.get("/", async (req, res) => {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const pageSize = z.coerce.number().default(20).parse(req.query.pageSize);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: adminRefSelect },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const serialized = await Promise.all(
    data.map(async (row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      admin: await serializeAdminRef(row.admin),
    })),
  );

  res.json({
    data: serialized,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default router;
