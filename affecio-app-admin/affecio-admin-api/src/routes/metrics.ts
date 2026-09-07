import { Router } from "express";
import * as metricsService from "../services/metricsService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth);

router.get(
  "/summary",
  requireRole("super_admin", "admin", "moderator", "support", "developer"),
  async (_req, res) => {
    const metrics = await metricsService.getOverviewMetrics();
    res.json({ data: metrics });
  },
);

// Legacy alias
router.get("/overview", requireRole("super_admin", "admin", "developer"), async (_req, res) => {
  const metrics = await metricsService.getOverviewMetrics();
  res.json({ data: metrics });
});

export default router;
