"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, BadgeCheck, Flag, Users } from "lucide-react";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getOverviewMetrics } from "@/services/metrics";
import { getReports } from "@/services/reports";

export default function DashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ["metrics", "summary"],
    queryFn: getOverviewMetrics,
  });

  const recentReportsQuery = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => getReports({ page: 1, pageSize: 5 }),
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Platform metrics and recent activity."
      />

      {metricsQuery.isError ? (
        <div className="mb-6">
          <ApiErrorMessage message="Could not load metrics. Ensure the API is running on port 4001." />
        </div>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AffecioStatCard
            label="Total users"
            value={metricsQuery.isLoading ? "…" : metricsQuery.data?.totalUsers.toLocaleString() ?? "0"}
            icon={Users}
          />
          <AffecioStatCard
            label="Active users"
            value={metricsQuery.isLoading ? "…" : metricsQuery.data?.activeUsers.toLocaleString() ?? "0"}
            icon={Activity}
          />
          <AffecioStatCard
            label="Pending verifications"
            value={
              metricsQuery.isLoading ? "…" : metricsQuery.data?.pendingVerifications.toLocaleString() ?? "0"
            }
            icon={BadgeCheck}
          />
          <AffecioStatCard
            label="Open reports"
            value={metricsQuery.isLoading ? "…" : metricsQuery.data?.openReports.toLocaleString() ?? "0"}
            icon={Flag}
          />
        </div>
      )}

      <ContentPanel tabs={["Recent reports"]} showToolbar={false} showPagination={false}>
        {recentReportsQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : recentReportsQuery.isError ? (
          <div className="p-5">
            <ApiErrorMessage message="Failed to load recent reports." />
          </div>
        ) : !recentReportsQuery.data?.data.length ? (
          <EmptyState title="No reports yet" description="Open reports will appear here." />
        ) : (
          <DataTable
            data={recentReportsQuery.data.data}
            columns={[
              { key: "type", header: "Type", cell: (r) => <StatusPill label={r.type} tone="muted" /> },
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              {
                key: "status",
                header: "Status",
                cell: (r) => <StatusPill label={r.status} tone={reportStatusTone(r.status)} />,
              },
              {
                key: "created",
                header: "Created",
                cell: (r) => formatDateTime(r.createdAt),
              },
            ]}
          />
        )}
      </ContentPanel>
    </div>
  );
}
