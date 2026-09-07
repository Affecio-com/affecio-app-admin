import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { Report } from "@/types/report";

export async function getReports(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}): Promise<PaginatedResponse<Report>> {
  const { data } = await adminV1Client.get<PaginatedResponse<Report>>("/reports", { params });
  return data;
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await adminV1Client.get<{ data: Report }>(`/reports/${id}`);
  return data.data;
}

export async function updateReportStatus(id: string, status: Report["status"]): Promise<Report> {
  const { data } = await adminV1Client.patch<{ data: Report }>(`/reports/${id}`, { status });
  return data.data;
}
