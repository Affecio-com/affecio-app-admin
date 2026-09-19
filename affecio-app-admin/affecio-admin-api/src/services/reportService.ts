import type { ListReportsInput, UpdateReportInput } from "../schemas/reports";
import { prisma } from "../lib/prisma";
import { hydrateUsersByIds } from "../lib/profilePhotos";
import { toReportApiShape, type ReportDbRow } from "../lib/reportMapping";

async function withUsers(rows: ReportDbRow[]) {
  const users = await hydrateUsersByIds(rows.flatMap((r) => [r.reporterId, r.reportedId]));
  return rows.map((row) => {
    const api = toReportApiShape(row);
    return {
      ...api,
      reporter: users.get(row.reporterId) ?? null,
      target: users.get(row.reportedId) ?? null,
    };
  });
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
