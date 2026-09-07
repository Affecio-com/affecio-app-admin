import type { ListReportsInput, UpdateReportInput } from "../schemas/reports";
import { prisma } from "../lib/prisma";

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
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getReportById(id: string) {
  return prisma.report.findUnique({ where: { id } });
}

export async function updateReport(id: string, input: UpdateReportInput) {
  return prisma.report.update({
    where: { id },
    data: { status: input.status },
  });
}
