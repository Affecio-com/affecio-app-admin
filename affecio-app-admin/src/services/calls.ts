import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface CallRecord {
  id: string;
  channelName: string;
  userAId: string;
  userBId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  userA?: { id: string; name: string; email: string | null };
  userB?: { id: string; name: string; email: string | null };
}

export async function getCalls(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CallRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<CallRecord>>("/calls", { params });
  return data;
}
