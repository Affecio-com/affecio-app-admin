import { apiClient } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export async function getAuditLogs(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>("/admin/audit-logs", {
    params,
  });
  return data;
}
