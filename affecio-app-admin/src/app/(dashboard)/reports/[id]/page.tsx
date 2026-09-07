"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportActionBar } from "@/components/reports/ReportActionBar";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getReport, updateReportStatus } from "@/services/reports";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
  });

  const updateMutation = useMutation({
    mutationFn: (status: "resolved" | "dismissed") => updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report", id] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Report detail"
        description={data ? `${data.type} report · ${formatDateTime(data.createdAt)}` : `Report ${id}`}
        action={
          data ? (
            <ReportActionBar
              onResolve={() => updateMutation.mutate("resolved")}
              onDismiss={() => updateMutation.mutate("dismissed")}
            />
          ) : null
        }
      />

      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage message={error instanceof Error ? error.message : "Failed to load report"} />
        </AffecioCard>
      ) : data ? (
        <AffecioCard>
          <div className="mb-6 flex items-center gap-3">
            <StatusPill label={data.type} tone="muted" />
            <StatusPill label={data.status} tone={reportStatusTone(data.status)} />
          </div>
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-affecio-muted">Reason</dt>
              <dd className="mt-1">{data.reason}</dd>
            </div>
            <div>
              <dt className="text-affecio-muted">Reporter ID</dt>
              <dd className="mt-1 font-mono text-xs">{data.reporterId}</dd>
            </div>
            <div>
              <dt className="text-affecio-muted">Target ID</dt>
              <dd className="mt-1 font-mono text-xs">{data.targetId}</dd>
            </div>
            <div>
              <dt className="text-affecio-muted">Updated</dt>
              <dd className="mt-1">{formatDateTime(data.updatedAt)}</dd>
            </div>
          </dl>
          <Link href="/reports" className="mt-6 inline-block text-sm text-affecio-muted hover:text-affecio-text">
            ← Back to reports
          </Link>
        </AffecioCard>
      ) : null}
    </div>
  );
}
