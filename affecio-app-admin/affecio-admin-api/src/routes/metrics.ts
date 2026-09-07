import { Router } from "express";
import { z } from "zod";
import * as metricsService from "../services/metricsService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

const analyticsRoles = ["super_admin", "admin", "developer", "marketing"] as const;

router.use(requireAdminAuth);

router.get(
  "/summary",
  requireRole("super_admin", "admin", "moderator", "support", "developer", "marketing"),
  async (_req, res) => {
    const metrics = await metricsService.getOverviewMetrics();
    res.json({ data: metrics });
  },
);

router.get("/overview", requireRole(...analyticsRoles), async (_req, res) => {
  const metrics = await metricsService.getOverviewMetrics();
  res.json({ data: metrics });
});

router.get("/analytics", requireRole(...analyticsRoles), async (_req, res) => {
  const data = await metricsService.getAnalyticsDashboard();
  res.json({ data });
});

export default router;
