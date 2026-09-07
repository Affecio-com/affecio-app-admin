import { adminV1Client } from "@/config/api";

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  openReports: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const { data } = await adminV1Client.get<{ data: OverviewMetrics }>("/metrics/summary");
  return data.data;
}
