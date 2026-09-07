import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "developer"));

router.get("/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.get("/feature-flags", (_req, res) => {
  res.json({ data: [], message: "Feature flags endpoint scaffold ready" });
});

router.get("/logs", (_req, res) => {
  res.json({ data: [], message: "Logs endpoint scaffold ready" });
});

export default router;
