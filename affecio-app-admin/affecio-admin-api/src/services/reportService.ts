import type { ListReportsInput, UpdateReportInput } from "../schemas/reports";
import { prisma } from "../lib/prisma";
import { hydrateUsersByIds } from "../lib/profilePhotos";

async function withUsers<T extends { reporterId: string; targetId: string }>(rows: T[]) {
  const users = await hydrateUsersByIds(rows.flatMap((r) => [r.reporterId, r.targetId]));
  return rows.map((row) => ({
    ...row,
    reporter: users.get(row.reporterId) ?? null,
    target: users.get(row.targetId) ?? null,
  }));
}

export async function listReports(input: ListReportsInput) {
  const { page, pageSize, status, type } = input;
  const where = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    data: await withUsers(data),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getReportById(id: string) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return null;
  const [enriched] = await withUsers([report]);
  return enriched;
}

export async function updateReport(id: string, input: UpdateReportInput) {
  const report = await prisma.report.update({
    where: { id },
    data: { status: input.status },
  });
  const [enriched] = await withUsers([report]);
  return enriched;
}
