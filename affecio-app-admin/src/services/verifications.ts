import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export interface VerificationItem {
  id: string;
  userId: string;
  mediaKey: string;
  mediaUrl: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  user?: UserRef | null;
}

export async function getVerificationQueue(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<VerificationItem>> {
  const { data } = await adminV1Client.get<PaginatedResponse<VerificationItem>>("/verifications", {
    params,
  });
  return data;
}

export async function getVerification(id: string): Promise<VerificationItem> {
  const { data } = await adminV1Client.get<{ data: VerificationItem }>(`/verifications/${id}`);
  return data.data;
}

export async function reviewVerification(
  id: string,
  status: "approved" | "rejected",
): Promise<VerificationItem> {
  const { data } = await adminV1Client.post<{ data: VerificationItem }>(`/verifications/${id}/review`, {
    status,
  });
  return data.data;
}
