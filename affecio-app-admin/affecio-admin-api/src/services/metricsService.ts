import { prisma } from "../lib/prisma";

export async function getOverviewMetrics() {
  const [totalUsers, pendingMedia, pendingVerifications, openReports] = await Promise.all([
    prisma.user.count(),
    prisma.userMedia.count({ where: { status: "PENDING" } }),
    prisma.verification.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "open" } }),
  ]);

  return {
    totalUsers,
    activeUsers: totalUsers,
    pendingVerifications: pendingVerifications + pendingMedia,
    openReports,
  };
}
