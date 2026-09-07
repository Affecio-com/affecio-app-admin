import { Router } from "express";
import { z } from "zod";
import * as moderationService from "../services/moderationService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "moderator"));

router.get("/", async (req, res) => {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const pageSize = z.coerce.number().default(20).parse(req.query.pageSize);
  const result = await moderationService.listModerationFlags(page, pageSize);
  res.json(result);
});

export default router;
