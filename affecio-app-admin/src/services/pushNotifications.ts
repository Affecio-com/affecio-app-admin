import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export type PushAudience = "all" | "new_users" | "active_users";
export type PushCampaignStatus = "draft" | "sent" | "failed" | "partial";

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  audience: PushAudience;
  status: PushCampaignStatus;
  sentCount: number;
  failedCount: number;
  targetCount: number;
  sentAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
}

export interface PushStats {
  totalTokens: number;
  totalUsers: number;
  reachableUsers: number;
  campaignsSent: number;
}

export interface CreatePushCampaignInput {
  title: string;
  body: string;
  audience: PushAudience;
}

export async function getPushStats(): Promise<PushStats> {
  const { data } = await adminV1Client.get<{ data: PushStats }>("/push/stats");
  return data.data;
}

export async function getPushCampaigns(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<PushCampaign>> {
  const { data } = await adminV1Client.get<PaginatedResponse<PushCampaign>>("/push/campaigns", {
    params,
  });
  return data;
}

export async function createPushCampaign(
  input: CreatePushCampaignInput,
): Promise<{ campaign: PushCampaign; message: string; dryRun: boolean }> {
  const { data } = await adminV1Client.post<{
    data: PushCampaign;
    message: string;
    dryRun: boolean;
  }>("/push/campaigns", input);
  return { campaign: data.data, message: data.message, dryRun: data.dryRun };
}
