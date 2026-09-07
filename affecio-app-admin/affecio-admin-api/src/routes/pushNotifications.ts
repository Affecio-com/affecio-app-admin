import { Router } from "express";
import { z } from "zod";
import * as pushService from "../services/pushNotificationService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { getRouteParam } from "../lib/params";

const router = Router();

const pushRoles = ["super_admin", "admin", "marketing"] as const;

router.use(requireAdminAuth, requireRole(...pushRoles));

const createCampaignSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  audience: z.enum(["all", "new_users", "active_users"]),
});

const registerTokenSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

router.get("/stats", async (_req, res) => {
  const stats = await pushService.getPushStats();
  res.json({ data: stats });
});

router.get("/campaigns", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const result = await pushService.listPushCampaigns(page, pageSize);
  res.json(result);
});

router.post(
  "/campaigns",
  auditAction("push.send", "push_campaign", (req) => req.body.title ?? "campaign"),
  async (req, res) => {
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid campaign payload" });
      return;
    }

    const result = await pushService.createAndSendCampaign({
      ...parsed.data,
      createdById: req.admin!.id,
    });

    res.status(201).json({
      data: {
        id: result.campaign.id,
        title: result.campaign.title,
        body: result.campaign.body,
        audience: result.campaign.audience,
        status: result.campaign.status,
        sentCount: result.campaign.sentCount,
        failedCount: result.campaign.failedCount,
        targetCount: result.campaign.targetCount,
        sentAt: result.campaign.sentAt?.toISOString() ?? null,
        createdAt: result.campaign.createdAt.toISOString(),
        createdBy: result.campaign.createdBy,
      },
      message: result.message,
      dryRun: result.dryRun,
    });
  },
);

router.post("/tokens", async (req, res) => {
  const parsed = registerTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid token payload" });
    return;
  }

  const token = await pushService.registerDeviceToken(parsed.data);
  res.status(201).json({ data: token });
});

router.get("/tokens/:userId", async (req, res) => {
  const userId = getRouteParam(req.params.userId);
  const { prisma } = await import("../lib/prisma");
  const tokens = await prisma.pushDeviceToken.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ data: tokens });
});

export default router;
