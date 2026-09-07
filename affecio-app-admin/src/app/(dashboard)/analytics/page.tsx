"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Ban, Heart, ImageIcon, Phone, Repeat, Users } from "lucide-react";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getAnalyticsDashboard } from "@/services/metrics";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["metrics", "analytics-dashboard"],
    queryFn: getAnalyticsDashboard,
  });

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform growth, engagement, and user demographics."
      />

      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage message="Failed to load analytics data." />
        </AffecioCard>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AffecioStatCard label="Total users" value={data.overview.totalUsers.toLocaleString()} icon={Users} />
            <AffecioStatCard
              label="Active (30d)"
              value={data.overview.activeUsers.toLocaleString()}
              icon={Activity}
              hint="Users active in last 30 days"
            />
            <AffecioStatCard label="Total matches" value={data.totals.matches.toLocaleString()} icon={Heart} />
            <AffecioStatCard label="Total swipes" value={data.totals.swipes.toLocaleString()} icon={Repeat} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AffecioStatCard label="Call sessions" value={data.totals.calls.toLocaleString()} icon={Phone} />
            <AffecioStatCard label="Blocks" value={data.totals.blocks.toLocaleString()} icon={Ban} />
            <AffecioStatCard label="Media uploads" value={data.totals.media.toLocaleString()} icon={ImageIcon} />
            <AffecioStatCard
              label="Push tokens"
              value={data.totals.pushTokens.toLocaleString()}
              icon={Activity}
              hint="Registered device tokens"
            />
          </div>

          <AnalyticsCharts data={data} />
        </div>
      ) : null}
    </div>
  );
}
