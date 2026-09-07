import type { PushAudience } from "@prisma/client";
import { prisma } from "../lib/prisma";

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

async function resolveAudienceUserIds(audience: PushAudience): Promise<string[]> {
  const now = new Date();

  if (audience === "new_users") {
    const since = new Date(now);
    since.setDate(since.getDate() - 7);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  if (audience === "active_users") {
    const since = new Date(now);
    since.setDate(since.getDate() - 30);
    const users = await prisma.user.findMany({
      where: { updatedAt: { gte: since } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((u) => u.id);
}

async function resolveTokensForAudience(audience: PushAudience): Promise<string[]> {
  const userIds = await resolveAudienceUserIds(audience);
  if (userIds.length === 0) return [];

  const tokens = await prisma.pushDeviceToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
  return tokens.map((t) => t.token);
}

async function sendFcmBatch(tokens: string[], title: string, body: string) {
  if (!FCM_SERVER_KEY || tokens.length === 0) {
    return { sent: 0, failed: tokens.length };
  }

  const batchSize = 500;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const chunk = tokens.slice(i, i + batchSize);
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration_ids: chunk,
          notification: { title, body },
          data: { type: "marketing" },
        }),
      });

      if (!res.ok) {
        failed += chunk.length;
        continue;
      }

      const payload = (await res.json()) as {
        success?: number;
        failure?: number;
      };
      sent += payload.success ?? 0;
      failed += payload.failure ?? 0;
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

export async function getPushStats() {
  const [totalTokens, totalUsers, campaigns] = await Promise.all([
    prisma.pushDeviceToken.count(),
    prisma.user.count(),
    prisma.pushCampaign.count(),
  ]);

  return {
    totalTokens,
    totalUsers,
    reachableUsers: totalTokens > 0 ? await prisma.pushDeviceToken.groupBy({ by: ["userId"] }).then((g) => g.length) : 0,
    campaignsSent: campaigns,
  };
}

export async function listPushCampaigns(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    prisma.pushCampaign.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.pushCampaign.count(),
  ]);

  return {
    data: data.map((c) => ({
      id: c.id,
      title: c.title,
      body: c.body,
      audience: c.audience,
      status: c.status,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      targetCount: c.targetCount,
      sentAt: c.sentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      createdBy: c.createdBy,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createAndSendCampaign(input: {
  title: string;
  body: string;
  audience: PushAudience;
  createdById: string;
}) {
  const userIds = await resolveAudienceUserIds(input.audience);
  const tokens = await resolveTokensForAudience(input.audience);
  const targetCount = userIds.length;

  const campaign = await prisma.pushCampaign.create({
    data: {
      title: input.title,
      body: input.body,
      audience: input.audience,
      targetCount,
      createdById: input.createdById,
      status: "draft",
    },
  });

  if (tokens.length === 0) {
    const updated = await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "failed",
        sentCount: 0,
        failedCount: 0,
        sentAt: new Date(),
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    return {
      campaign: updated,
      dryRun: !FCM_SERVER_KEY,
      message: "No device tokens registered for this audience.",
    };
  }

  if (!FCM_SERVER_KEY) {
    const updated = await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "sent",
        sentCount: tokens.length,
        failedCount: 0,
        sentAt: new Date(),
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    return {
      campaign: updated,
      dryRun: true,
      message: `Dry run — would deliver to ${tokens.length} device(s). Set FCM_SERVER_KEY to send live.`,
    };
  }

  const { sent, failed } = await sendFcmBatch(tokens, input.title, input.body);

  let status: "sent" | "failed" | "partial" = "sent";
  if (sent === 0 && failed > 0) status = "failed";
  else if (failed > 0) status = "partial";

  const updated = await prisma.pushCampaign.update({
    where: { id: campaign.id },
    data: {
      status,
      sentCount: sent,
      failedCount: failed,
      sentAt: new Date(),
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return {
    campaign: updated,
    dryRun: !FCM_SERVER_KEY,
    message: FCM_SERVER_KEY
      ? `Delivered to ${sent} device(s).`
      : "Campaign recorded (dry run — set FCM_SERVER_KEY to deliver pushes).",
  };
}

export async function registerDeviceToken(input: {
  userId: string;
  token: string;
  platform: string;
}) {
  return prisma.pushDeviceToken.upsert({
    where: { token: input.token },
    create: {
      userId: input.userId,
      token: input.token,
      platform: input.platform,
    },
    update: {
      userId: input.userId,
      platform: input.platform,
    },
  });
}
