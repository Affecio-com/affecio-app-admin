"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { ServiceHealthBanner } from "@/components/developers/ServiceHealthBanner";
import { ServiceHealthGroup } from "@/components/developers/ServiceHealthGroup";
import { StatusPill } from "@/components/shared/StatusPill";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDateTime } from "@/lib/format";
import { getServiceHealthSnapshot, updateServiceComponent } from "@/services/developers";
import { useAuth } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminRole } from "@/types/admin";

const ALL_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "support",
  "developer",
  "marketing",
];

export default function ServiceHealthPage() {
  const { admin } = useAuth();
  const canEdit = Boolean(admin && ["super_admin", "developer"].includes(admin.role));
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["service-health"],
    queryFn: getServiceHealthSnapshot,
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      message,
    }: {
      id: string;
      status: Parameters<typeof updateServiceComponent>[1]["status"];
      message: string;
    }) => updateServiceComponent(id, { status, message }),
    onSuccess: (snapshot) => {
      void queryClient.setQueryData(["service-health"], snapshot);
    },
  });

  return (
    <RoleGate allowedRoles={ALL_ROLES}>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Service health"
          description={
            canEdit
              ? "Publish live status. This same feed will power the public status page."
              : "Live platform status. Engineering publishes updates here."
          }
          action={
            admin?.role === "developer" || admin?.role === "super_admin" ? (
              <Link href="/developers" className="text-sm text-affecio-muted hover:text-affecio-text">
                ← Developers
              </Link>
            ) : null
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
            {mutation.isError ? (
              <ApiErrorMessage message={getApiErrorMessage(mutation.error, "Failed to publish status.")} />
            ) : null}

            <AffecioCard padding="none" className="overflow-hidden">
              {data.groups.map((group, index) => (
                <ServiceHealthGroup
                  key={group.id}
                  group={group}
                  defaultOpen={index === 0}
                  canEdit={canEdit}
                  pending={mutation.isPending}
                  onUpdate={(id, status, message) => mutation.mutate({ id, status, message })}
                />
              ))}
            </AffecioCard>

            {(data.events ?? []).length > 0 ? (
              <AffecioCard>
                <h2 className="text-base font-semibold tracking-tight">Incident log</h2>
                <ul className="mt-4 space-y-3">
                  {data.events?.map((event) => (
                    <li key={event.id} className="border-b border-affecio-border pb-3 last:border-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={event.status} />
                        <span className="text-xs text-affecio-muted">
                          {formatDateTime(event.createdAt)} · {event.createdBy}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{event.message}</p>
                    </li>
                  ))}
                </ul>
              </AffecioCard>
            ) : null}

            <p className="text-center text-xs text-affecio-muted">
              Last checked {formatDateTime(dataUpdatedAt ? new Date(dataUpdatedAt) : data.lastUpdated)}
              {" · "}
              Public endpoint: GET /api/status
            </p>
          </div>
        ) : null}
      </div>
    </RoleGate>
  );
}
