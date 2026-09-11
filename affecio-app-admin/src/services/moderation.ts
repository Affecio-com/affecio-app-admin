import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export interface ModerationFlag {
  id: string;
  type: "media" | "profile";
  targetId: string;
  reason: string;
  status: "pending" | "actioned" | "dismissed";
  createdAt: string;
  target?: UserRef | null;
  reporter?: UserRef | null;
}

export async function getModerationFlags(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ModerationFlag>> {
  const { data } = await adminV1Client.get<PaginatedResponse<ModerationFlag>>("/moderation", {
    params,
  });
  return data;
}
