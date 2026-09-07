import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getAuditLogs(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await adminV1Client.get<PaginatedResponse<AuditLogEntry>>("/audit-logs", {
    params,
  });
  return data;
}
