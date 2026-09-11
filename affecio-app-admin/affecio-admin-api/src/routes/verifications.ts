import { Router } from "express";
import { z } from "zod";
import * as verificationService from "../services/verificationService";
import { getRouteParam } from "../lib/params";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";

const router = Router();

const readRoles = ["super_admin", "admin", "moderator", "support"] as const;
const writeRoles = ["super_admin", "admin", "moderator"] as const;

router.use(requireAdminAuth);

router.get("/", requireRole(...readRoles), async (req, res) => {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const pageSize = z.coerce.number().default(20).parse(req.query.pageSize);
  const status = z.enum(["pending", "approved", "rejected"]).optional().parse(req.query.status);
  const result = await verificationService.listVerificationQueue(page, pageSize, status);
  res.json(result);
});

router.get("/:id", requireRole(...readRoles), async (req, res) => {
  const item = await verificationService.getVerificationById(getRouteParam(req.params.id));
  if (!item) {
    res.status(404).json({ message: "Verification not found" });
    return;
  }
  res.json({ data: item });
});

router.post(
  "/:id/review",
  requireRole(...writeRoles),
  auditAction("verification.review", "verification", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const status = z.enum(["approved", "rejected"]).parse(req.body.status);
    const item = await verificationService.reviewVerification(
      getRouteParam(req.params.id),
      status,
      req.admin!.id,
    );
    res.json({ data: item });
  },
);

export default router;
