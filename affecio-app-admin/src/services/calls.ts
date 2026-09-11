import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export interface CallRecord {
  id: string;
  channelName: string;
  userAId: string;
  userBId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  userA?: UserRef;
  userB?: UserRef;
}

export async function getCalls(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CallRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<CallRecord>>("/calls", { params });
  return data;
}
