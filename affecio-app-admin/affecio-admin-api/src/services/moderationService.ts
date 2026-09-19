import { prisma } from "../lib/prisma";
import { hydrateUsersByIds } from "../lib/profilePhotos";
import { resolveReportType } from "../lib/reportMapping";

export async function listModerationFlags(page: number, pageSize: number) {
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: ["open", "reviewing"] }, type: { in: ["media", "profile"] } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.count({
      where: { status: { in: ["open", "reviewing"] }, type: { in: ["media", "profile"] } },
    }),
  ]);

  const users = await hydrateUsersByIds(reports.flatMap((r) => [r.reportedId, r.reporterId]));

  return {
    data: reports.map((r) => {
      const type = resolveReportType(r);
      return {
        id: r.id,
        type: type === "media" ? "media" : "profile",
        targetId: r.reportedId,
        reason: r.reason,
        status: r.status === "open" ? "pending" : "actioned",
        createdAt: r.createdAt,
        target: users.get(r.reportedId) ?? null,
        reporter: users.get(r.reporterId) ?? null,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
