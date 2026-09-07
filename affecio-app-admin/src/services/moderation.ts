import { apiClient } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface ModerationFlag {
  id: string;
  type: "media" | "profile";
  targetId: string;
  reason: string;
  status: "pending" | "actioned" | "dismissed";
  createdAt: string;
}

export async function getModerationFlags(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ModerationFlag>> {
  const { data } = await apiClient.get<PaginatedResponse<ModerationFlag>>(
    "/admin/moderation",
    { params },
  );
  return data;
}
