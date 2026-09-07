import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  blocker?: { id: string; name: string; email: string | null };
  blocked?: { id: string; name: string; email: string | null };
}

export async function getBlocks(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<BlockRecord>> {
  const { data } = await adminV1Client.get<PaginatedResponse<BlockRecord>>("/blocks", { params });
  return data;
}
