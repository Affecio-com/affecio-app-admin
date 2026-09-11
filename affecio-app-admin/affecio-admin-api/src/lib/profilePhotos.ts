import { prisma } from "./prisma";
import { getPresignedMediaUrl } from "./r2";

export type UserWithPhoto = {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
};

export async function getProfilePhotoMap(userIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, string | null>();
  for (const id of unique) result.set(id, null);
  if (unique.length === 0) return result;

  const rows = await prisma.userMedia.findMany({
    where: { userId: { in: unique }, kind: "PROFILE_PHOTO" },
    orderBy: [{ status: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: { userId: true, publicUrl: true, objectKey: true },
  });

  const hasR2 = Boolean(process.env.R2_ACCESS_KEY_ID && process.env.R2_BUCKET);
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    if (row.publicUrl) {
      result.set(row.userId, row.publicUrl);
      continue;
    }
    if (hasR2 && row.objectKey) {
      try {
        result.set(row.userId, await getPresignedMediaUrl(row.objectKey));
      } catch {
        result.set(row.userId, null);
      }
    }
  }

  return result;
}

export async function hydrateUsersByIds(ids: string[]): Promise<Map<string, UserWithPhoto>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, UserWithPhoto>();
  if (unique.length === 0) return map;

  const [users, photos] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, name: true, email: true, phoneNumber: true },
    }),
    getProfilePhotoMap(unique),
  ]);

  for (const user of users) {
    map.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhotoUrl: photos.get(user.id) ?? null,
    });
  }

  return map;
}

export function withPhoto<T extends { id: string }>(
  user: T,
  photos: Map<string, string | null>,
): T & { profilePhotoUrl: string | null } {
  return { ...user, profilePhotoUrl: photos.get(user.id) ?? null };
}
