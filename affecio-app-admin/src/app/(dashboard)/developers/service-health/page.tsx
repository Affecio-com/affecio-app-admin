"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceHealthBanner } from "@/components/developers/ServiceHealthBanner";
import { ServiceHealthGroup } from "@/components/developers/ServiceHealthGroup";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDateTime } from "@/lib/format";
import { getMockServiceHealthSnapshot } from "@/config/service-health-mock";
import { getServiceHealthSnapshot } from "@/services/developers";

export default function ServiceHealthPage() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["service-health"],
    queryFn: getServiceHealthSnapshot,
    refetchInterval: 60_000,
    placeholderData: getMockServiceHealthSnapshot(),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Service health"
        description="Platform and dependency status across Affecio services."
        action={
          <Link href="/developers" className="text-sm text-affecio-muted hover:text-affecio-text">
            ← Developers
          </Link>
        }
      />

      {isLoading && !data ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage
            message={error instanceof Error ? error.message : "Failed to load service health."}
          />
        </AffecioCard>
      ) : data ? (
        <div className="space-y-6">
          <ServiceHealthBanner snapshot={data} />

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-mondwest text-lg font-semibold text-affecio-text">System status</h2>
                <p className="text-sm text-affecio-muted">{data.periodLabel}</p>
              </div>
              <select
                className="h-9 rounded-lg border border-affecio-border bg-affecio-surface px-3 text-sm text-affecio-text"
                defaultValue="90d"
                aria-label="Status period"
              >
                <option value="90d">Last 90 days</option>
                <option value="30d">Last 30 days</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>

            <AffecioCard padding="none" className="overflow-hidden">
              {data.groups.map((group, index) => (
                <ServiceHealthGroup key={group.id} group={group} defaultOpen={index === 0} />
              ))}
            </AffecioCard>
          </div>

          <p className="text-center text-xs text-affecio-muted">
            Last updated {formatDateTime(dataUpdatedAt ? new Date(dataUpdatedAt) : data.lastUpdated)}
            {" · "}
            Placeholder metrics — live monitoring will replace mock uptime values.
          </p>
        </div>
      ) : null}
    </div>
  );
}
