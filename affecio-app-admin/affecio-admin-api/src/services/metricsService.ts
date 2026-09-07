import { prisma } from "../lib/prisma";

const DAYS = 30;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(
  rows: { date: Date; count: bigint | number }[],
  days: number,
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(dateKey(row.date), Number(row.count));
  }

  const series: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    series.push({ date: key, count: map.get(key) ?? 0 });
  }

  return series;
}

export async function getOverviewMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalUsers, pendingMedia, pendingVerifications, openReports, activeUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.userMedia.count({ where: { status: "PENDING" } }),
      prisma.verification.count({ where: { status: "pending" } }),
      prisma.report.count({ where: { status: "open" } }),
      prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    ]);

  return {
    totalUsers,
    activeUsers,
    pendingVerifications: pendingVerifications + pendingMedia,
    openReports,
  };
}

export async function getAnalyticsDashboard() {
  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  since.setHours(0, 0, 0, 0);

  const [
    overview,
    totalMatches,
    totalSwipes,
    totalCalls,
    totalBlocks,
    totalMedia,
    pushTokens,
    genderRows,
    swipeActionRows,
    userSignupRows,
    matchRows,
    swipeRows,
    callRows,
  ] = await Promise.all([
    getOverviewMetrics(),
    prisma.match.count(),
    prisma.swipe.count(),
    prisma.callSession.count(),
    prisma.block.count(),
    prisma.userMedia.count(),
    prisma.pushDeviceToken.count(),
    prisma.$queryRaw<{ gender: string; count: bigint }[]>`
      SELECT gender, COUNT(*)::bigint AS count
      FROM "User"
      GROUP BY gender
      ORDER BY count DESC
    `,
    prisma.$queryRaw<{ action: string; count: bigint }[]>`
      SELECT action::text AS action, COUNT(*)::bigint AS count
      FROM "Swipe"
      GROUP BY action
      ORDER BY count DESC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
      FROM "Match"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
      FROM "Swipe"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("startedAt") AS date, COUNT(*)::bigint AS count
      FROM "CallSession"
      WHERE "startedAt" >= ${since}
      GROUP BY DATE("startedAt")
      ORDER BY date ASC
    `,
  ]);

  return {
    overview,
    totals: {
      matches: totalMatches,
      swipes: totalSwipes,
      calls: totalCalls,
      blocks: totalBlocks,
      media: totalMedia,
      pushTokens,
    },
    genderBreakdown: genderRows.map((r) => ({
      gender: r.gender,
      count: Number(r.count),
    })),
    swipeActions: swipeActionRows.map((r) => ({
      action: r.action,
      count: Number(r.count),
    })),
    timeSeries: {
      userSignups: buildDailySeries(userSignupRows, DAYS),
      matches: buildDailySeries(matchRows, DAYS),
      swipes: buildDailySeries(swipeRows, DAYS),
      calls: buildDailySeries(callRows, DAYS),
    },
  };
}
