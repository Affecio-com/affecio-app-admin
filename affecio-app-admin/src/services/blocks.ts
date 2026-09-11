import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  blocker?: UserRef;
  blocked?: UserRef;
}

export async function getBlocks(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<BlockRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<BlockRecord>>("/blocks", { params });
  return data;
}
