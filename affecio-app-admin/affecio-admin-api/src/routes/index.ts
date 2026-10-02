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
import { getPublicStatusSnapshot } from "../services/healthService";
import { rateLimit } from "../middleware/rateLimit";
import { prisma } from "../lib/prisma";

const router = Router();

const DB_CHECK_TIMEOUT_MS = 5_000;

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), DB_CHECK_TIMEOUT_MS),
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/** Cheapest possible keep-alive — no DB. Use this if you only want to stop Render from sleeping. */
router.get("/ping", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/** Cron / uptime-monitor target. Returns 503 when the database is unreachable. */
router.get("/health", rateLimit(60, 60_000), async (_req, res) => {
  const db = await checkDatabase();
  res.set("Cache-Control", "no-store");
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? "ok" : "degraded",
    service: "affecio-admin-api",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database: db },
  });
});

router.get("/status", rateLimit(120, 60_000), async (_req, res) => {
  const data = await getPublicStatusSnapshot();
  res.json({ data });
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
