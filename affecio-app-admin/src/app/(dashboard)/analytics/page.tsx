"use client";

import { useQuery } from "@tanstack/react-query";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getOverviewMetrics } from "@/services/metrics";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["metrics", "analytics"],
    queryFn: getOverviewMetrics,
  });

  const metrics = [
    { label: "Total users", value: data?.totalUsers },
    { label: "Active users", value: data?.activeUsers },
    { label: "Pending verifications", value: data?.pendingVerifications },
    { label: "Open reports", value: data?.openReports },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="High-level platform metrics. Detailed charts coming soon."
      />
      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage message="Failed to load analytics data." />
        </AffecioCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <AffecioCard key={metric.label} padding="md">
              <p className="text-sm text-affecio-muted">{metric.label}</p>
              <p className="mt-2 font-mondwest text-3xl font-semibold">
                {metric.value?.toLocaleString() ?? "0"}
              </p>
            </AffecioCard>
          ))}
        </div>
      )}
    </div>
  );
}
