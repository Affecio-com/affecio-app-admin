import { Router } from "express";
import { z } from "zod";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { rateLimit } from "../middleware/rateLimit";
import { getRouteParam } from "../lib/params";
import * as healthService from "../services/healthService";

const router = Router();

const updateSchema = z.object({
  status: z.enum(["operational", "degraded", "partial_outage", "major_outage", "maintenance"]),
  message: z.string().min(1).max(280),
});

router.use(requireAdminAuth);

router.get("/health", requireRole("super_admin", "developer"), (_req, res) => {
  res.json({
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.patch(
  "/status/components/:id",
  requireRole("super_admin", "developer"),
  rateLimit(40, 60_000),
  auditAction("status.update", "service_health", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Status and a short public note are required." });
      return;
    }
    const snapshot = await healthService.updateComponentStatus({
      componentId: getRouteParam(req.params.id),
      status: parsed.data.status,
      message: parsed.data.message,
      adminId: req.admin!.id,
    });
    if (!snapshot) {
      res.status(404).json({ message: "Component not found" });
      return;
    }
    res.json({ data: snapshot });
  },
);

router.get("/feature-flags", requireRole("super_admin", "developer"), (_req, res) => {
  res.json({ data: [], message: "Feature flags endpoint scaffold ready" });
});

router.get("/logs", requireRole("super_admin", "developer"), (_req, res) => {
  res.json({ data: [], message: "Logs endpoint scaffold ready" });
});

export default router;
