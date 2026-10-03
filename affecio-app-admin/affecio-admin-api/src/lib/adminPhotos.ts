import { getPresignedMediaUrl } from "./r2";

export const adminRefSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  photoKey: true,
} as const;

export const adminPublicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  mfaEnabled: true,
  lastLoginAt: true,
  lastActivityAt: true,
  createdAt: true,
  photoKey: true,
} as const;

type WithPhotoKey = { photoKey?: string | null };

export async function photoUrlForKey(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  try {
    return await getPresignedMediaUrl(key);
  } catch {
    return null;
  }
}

export async function getPhotoUrlMap(keys: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(keys.filter(Boolean) as string[])];
  const pairs = await Promise.all(
    unique.map(async (key) => {
      const url = await photoUrlForKey(key);
      return url ? ([key, url] as const) : null;
    }),
  );
  return new Map(pairs.filter(Boolean) as [string, string][]);
}

export async function serializeAdminRef<T extends WithPhotoKey>(
  ref: T | null | undefined,
): Promise<(Omit<T, "photoKey"> & { photoUrl: string | null }) | null> {
  if (!ref) return null;
  const { photoKey, ...rest } = ref;
  return { ...rest, photoUrl: await photoUrlForKey(photoKey) } as Omit<T, "photoKey"> & {
    photoUrl: string | null;
  };
}

export async function serializeAdminRefs<T extends WithPhotoKey>(
  refs: T[],
): Promise<(Omit<T, "photoKey"> & { photoUrl: string | null })[]> {
  const map = await getPhotoUrlMap(refs.map((r) => r.photoKey));
  return refs.map((ref) => {
    const { photoKey, ...rest } = ref;
    return {
      ...rest,
      photoUrl: photoKey ? (map.get(photoKey) ?? null) : null,
    } as Omit<T, "photoKey"> & { photoUrl: string | null };
  });
}

export async function serializeAdminPublic(admin: {
  id: string;
  email: string;
  name: string;
  role: string;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
  lastActivityAt?: Date | null;
  photoKey?: string | null;
}) {
  const photoUrl = await photoUrlForKey(admin.photoKey);
  const { photoKey: _photoKey, ...rest } = admin;
  return {
    ...rest,
    createdAt: admin.createdAt.toISOString(),
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    lastActivityAt: admin.lastActivityAt?.toISOString() ?? null,
    photoUrl,
  };
}
