import { adminV1Client } from "@/config/api";

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  openReports: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface AnalyticsDashboard {
  overview: OverviewMetrics;
  totals: {
    matches: number;
    swipes: number;
    calls: number;
    blocks: number;
    media: number;
    pushTokens: number;
  };
  genderBreakdown: { gender: string; count: number }[];
  swipeActions: { action: string; count: number }[];
  timeSeries: {
    userSignups: DailyCount[];
    matches: DailyCount[];
    swipes: DailyCount[];
    calls: DailyCount[];
  };
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const { data } = await adminV1Client.get<{ data: OverviewMetrics }>("/metrics/summary");
  return data.data;
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const { data } = await adminV1Client.get<{ data: AnalyticsDashboard }>("/metrics/analytics");
  return data.data;
}
