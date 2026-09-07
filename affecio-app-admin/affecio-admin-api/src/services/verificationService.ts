import { prisma } from "../lib/prisma";
import { getPresignedMediaUrl } from "../lib/r2";

export async function listVerificationQueue(page: number, pageSize: number) {
  const where = { status: "pending" as const };
  const [data, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { submittedAt: "asc" },
    }),
    prisma.verification.count({ where }),
  ]);

  const withUrls = await Promise.all(
    data.map(async (item) => ({
      ...item,
      mediaUrl: await getPresignedMediaUrl(item.mediaKey).catch(() => null),
    })),
  );

  return {
    data: withUrls,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getVerificationById(id: string) {
  const item = await prisma.verification.findUnique({ where: { id } });
  if (!item) return null;
  const mediaUrl = await getPresignedMediaUrl(item.mediaKey).catch(() => null);
  return { ...item, mediaUrl };
}

export async function reviewVerification(
  id: string,
  status: "approved" | "rejected",
  adminId: string,
) {
  return prisma.verification.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  });
}
