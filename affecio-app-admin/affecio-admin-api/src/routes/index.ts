import { Router } from "express";
import authRoutes from "./auth";
import usersRoutes from "./users";
import verificationsRoutes from "./verifications";
import reportsRoutes from "./reports";
import moderationRoutes from "./moderation";
import matchesRoutes from "./matches";
import callsRoutes from "./calls";
import blocksRoutes from "./blocks";
import metricsRoutes from "./metrics";
import auditLogsRoutes from "./auditLogs";
import supportRoutes from "./support";
import developersRoutes from "./developers";
import pushNotificationsRoutes from "./pushNotifications";
import adminUsersRoutes from "./adminUsers";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "affecio-admin-api" });
});

router.use("/admin/auth", authRoutes);
router.use("/admin/v1/users", usersRoutes);
router.use("/admin/v1/verifications", verificationsRoutes);
router.use("/admin/v1/reports", reportsRoutes);
router.use("/admin/v1/moderation", moderationRoutes);
router.use("/admin/v1/matches", matchesRoutes);
router.use("/admin/v1/calls", callsRoutes);
router.use("/admin/v1/blocks", blocksRoutes);
router.use("/admin/v1/metrics", metricsRoutes);
router.use("/admin/v1/audit-logs", auditLogsRoutes);
router.use("/admin/v1/support", supportRoutes);
router.use("/admin/v1/developers", developersRoutes);
router.use("/admin/v1/push", pushNotificationsRoutes);
router.use("/admin/v1/admin-users", adminUsersRoutes);

export default router;
