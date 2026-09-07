import { apiClient } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface VerificationItem {
  id: string;
  userId: string;
  mediaUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export async function getVerificationQueue(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<VerificationItem>> {
  const { data } = await apiClient.get<PaginatedResponse<VerificationItem>>(
    "/admin/verifications",
    { params },
  );
  return data;
}

export async function getVerification(mediaId: string): Promise<VerificationItem> {
  const { data } = await apiClient.get<{ data: VerificationItem }>(
    `/admin/verifications/${mediaId}`,
  );
  return data.data;
}
