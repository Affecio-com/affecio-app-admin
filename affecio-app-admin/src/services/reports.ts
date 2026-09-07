import { apiClient } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { Report } from "@/types/report";

export async function getReports(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<Report>> {
  const { data } = await apiClient.get<PaginatedResponse<Report>>("/admin/reports", { params });
  return data;
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await apiClient.get<{ data: Report }>(`/admin/reports/${id}`);
  return data.data;
}
