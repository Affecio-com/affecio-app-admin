"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportActionBar } from "@/components/reports/ReportActionBar";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api-error";
import { getReport, updateReportStatus } from "@/services/reports";
import { AppUserCell } from "@/components/users/AppUserCell";
import { RoleGate } from "@/components/layout/RoleGate";
import { useAuth } from "@/providers/AuthProvider";
import { hasRole, trustReadRoles, trustWriteRoles } from "@/config/access";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const canWrite = hasRole(admin?.role, trustWriteRoles);

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
    <RoleGate allowedRoles={trustReadRoles}>
    <div>
      <PageHeader
        title="Report detail"
        description={data ? `${data.type} report · ${formatDateTime(data.createdAt)}` : `Report ${id}`}
        action={
          data && canWrite ? (
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
          <ApiErrorMessage message={getApiErrorMessage(error, "Failed to load report")} />
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
              <dt className="text-affecio-muted">Reporter</dt>
              <dd className="mt-1">
                <AppUserCell user={data.reporter} fallbackId={data.reporterId} subtitle />
              </dd>
            </div>
            <div>
              <dt className="text-affecio-muted">Reported user</dt>
              <dd className="mt-1">
                <AppUserCell user={data.target} fallbackId={data.targetId} subtitle />
              </dd>
            </div>
            <div>
              <dt className="text-affecio-muted">Updated</dt>
              <dd className="mt-1">{formatDateTime(data.updatedAt)}</dd>
            </div>
          </dl>
          <Link href="/reports" className="mt-6 mr-4 inline-block text-sm text-affecio-muted hover:text-affecio-text">
            ← Back to reports
          </Link>
          {data.targetId ? (
            <Link href={`/users/${data.targetId}`} className="mt-6 inline-block text-sm text-affecio-muted hover:text-affecio-text">
              Open reported member →
            </Link>
          ) : null}
        </AffecioCard>
      ) : null}
    </div>
    </RoleGate>
  );
}
