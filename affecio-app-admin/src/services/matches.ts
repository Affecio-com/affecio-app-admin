import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface MatchRecord {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  userA?: { id: string; name: string; email: string | null };
  userB?: { id: string; name: string; email: string | null };
}

export async function getMatches(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<MatchRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<MatchRecord>>("/matches", { params });
  return data;
}
