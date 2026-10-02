import { prisma } from "../lib/prisma";
import { getPresignedMediaUrl } from "../lib/r2";
import { hydrateUsersByIds } from "../lib/profilePhotos";

async function withUser<T extends { userId: string }>(item: T) {
  const users = await hydrateUsersByIds([item.userId]);
  return { ...item, user: users.get(item.userId) ?? null };
}

export async function listVerificationQueue(page: number, pageSize: number, status?: string) {
  const where = status ? { status: status as "pending" | "approved" | "rejected" } : {};
  const [data, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { submittedAt: "asc" },
    }),
    prisma.verification.count({ where }),
  ]);

  const users = await hydrateUsersByIds(data.map((item) => item.userId));
  const withUrls = await Promise.all(
    data.map(async (item) => ({
      ...item,
      mediaUrl: await getPresignedMediaUrl(item.mediaKey).catch(() => null),
      user: users.get(item.userId) ?? null,
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
  return withUser({ ...item, mediaUrl });
}

export async function reviewVerification(
  id: string,
  status: "approved" | "rejected",
  adminId: string,
) {
  const result = await prisma.verification.updateMany({
    where: { id, status: "pending" },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  });
  if (result.count === 0) return null;
  return prisma.verification.findUnique({ where: { id } });
}
