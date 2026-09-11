"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Activity, BadgeCheck, Flag, LifeBuoy, Siren, Users } from "lucide-react";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { AppUserCell } from "@/components/users/AppUserCell";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { getOverviewMetrics } from "@/services/metrics";
import { getReports } from "@/services/reports";
import { getEscalations, getSupportStats, getSupportTickets } from "@/services/support";

export default function DashboardPage() {
  const { admin } = useAuth();
  const role = admin?.role;
  const showReports = Boolean(role && ["super_admin", "admin", "moderator"].includes(role));
  const showTickets = Boolean(role && ["super_admin", "admin", "support"].includes(role));
  const showEscalations = Boolean(role && ["super_admin", "admin", "support", "developer"].includes(role));
  const supportDesk = role === "support";
  const developerDesk = role === "developer";

  const metricsQuery = useQuery({
    queryKey: ["metrics", "summary"],
    queryFn: getOverviewMetrics,
  });

  const recentReportsQuery = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => getReports({ page: 1, pageSize: 5 }),
    enabled: showReports && !supportDesk && !developerDesk,
  });

  const statsQuery = useQuery({
    queryKey: ["support", "stats"],
    queryFn: getSupportStats,
    enabled: showTickets,
  });

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", "overview"],
    queryFn: () => getSupportTickets({ page: 1, pageSize: 6 }),
    enabled: showTickets,
  });

  const escalationsQuery = useQuery({
    queryKey: ["support-escalations", "overview"],
    queryFn: () => getEscalations({ page: 1, pageSize: 6, status: "open" }),
    enabled: showEscalations && (developerDesk || supportDesk || role === "admin" || role === "super_admin"),
  });

  const description = supportDesk
    ? "Member complaints, live chat load, and tickets waiting on you."
    : developerDesk
      ? "Engineering queue: issues support escalated from the member desk."
      : "Live platform metrics and recent operations activity.";

  return (
    <div>
      <PageHeader title="Overview" description={description} />

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
          {showTickets ? (
            <AffecioStatCard
              label="Open tickets"
              value={statsQuery.isLoading ? "…" : String(statsQuery.data?.open ?? 0)}
              icon={LifeBuoy}
            />
          ) : (
            <AffecioStatCard
              label="Open reports"
              value={metricsQuery.isLoading ? "…" : metricsQuery.data?.openReports.toLocaleString() ?? "0"}
              icon={Flag}
            />
          )}
        </div>
      )}

      {showTickets && statsQuery.data ? (
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AffecioStatCard label="In progress" value={statsQuery.data.inProgress} />
          <AffecioStatCard label="Waiting on member" value={statsQuery.data.waiting} />
          <AffecioStatCard label="Escalated" value={statsQuery.data.escalated} icon={Siren} />
          <AffecioStatCard label="Resolved today" value={statsQuery.data.resolvedToday} />
        </div>
      ) : null}

      {showTickets ? (
        <div className="mb-8">
          <ContentPanel
            tabs={["Support inbox"]}
            showToolbar={false}
            showPagination={false}
          >
            {ticketsQuery.isLoading ? (
              <div className="p-5">
                <TableSkeleton />
              </div>
            ) : ticketsQuery.isError ? (
              <div className="p-5">
                <ApiErrorMessage message="Failed to load tickets." />
              </div>
            ) : !ticketsQuery.data?.data.length ? (
              <EmptyState title="No tickets yet" description="Member complaints will appear in Support inbox." />
            ) : (
              <DataTable
                data={ticketsQuery.data.data}
                columns={[
                  {
                    key: "member",
                    header: "Member",
                    cell: (t) => <AppUserCell user={t.user} fallbackId={t.userId} />,
                  },
                  {
                    key: "subject",
                    header: "Ticket",
                    cell: (t) => (
                      <Link href={`/support/${t.id}`} className="font-medium hover:underline">
                        {t.subject}
                      </Link>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (t) => <StatusPill label={t.status} />,
                  },
                  {
                    key: "updated",
                    header: "Updated",
                    cell: (t) => formatDateTime(t.updatedAt),
                  },
                ]}
              />
            )}
          </ContentPanel>
        </div>
      ) : null}

      {developerDesk || (showEscalations && !showReports) ? (
        <ContentPanel tabs={["Open escalations"]} showToolbar={false} showPagination={false}>
          {escalationsQuery.isLoading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : escalationsQuery.isError ? (
            <div className="p-5">
              <ApiErrorMessage message="Failed to load escalations." />
            </div>
          ) : !escalationsQuery.data?.data.length ? (
            <EmptyState title="No open escalations" description="Support will send bugs and policy calls here." />
          ) : (
            <DataTable
              data={escalationsQuery.data.data}
              columns={[
                {
                  key: "member",
                  header: "Member",
                  cell: (e) => <AppUserCell user={e.ticket?.user} fallbackId={e.ticketId} />,
                },
                {
                  key: "ticket",
                  header: "Ticket",
                  cell: (e) => (
                    <Link href={`/support/${e.ticketId}`} className="font-medium hover:underline">
                      {e.ticket?.subject ?? e.ticketId}
                    </Link>
                  ),
                },
                {
                  key: "target",
                  header: "Queue",
                  cell: (e) => <StatusPill label={e.target} />,
                },
                {
                  key: "reason",
                  header: "Reason",
                  cell: (e) => <span className="line-clamp-2 text-sm">{e.reason}</span>,
                },
              ]}
            />
          )}
        </ContentPanel>
      ) : showReports ? (
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
      ) : (
        <ContentPanel tabs={["Workspace"]} showToolbar={false} showPagination={false}>
          <EmptyState
            title="Welcome"
            description="Use the sidebar to open the tools for your role."
          />
        </ContentPanel>
      )}
    </div>
  );
}
