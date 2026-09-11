import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export interface MatchRecord {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  userA?: UserRef;
  userB?: UserRef;
}

export async function getMatches(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<MatchRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<MatchRecord>>("/matches", { params });
  return data;
}
