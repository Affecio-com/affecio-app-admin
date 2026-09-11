"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getReports } from "@/services/reports";
import { AppUserCell } from "@/components/users/AppUserCell";
import { trustReadRoles } from "@/config/access";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Open: "open",
  "In review": "reviewing",
  Resolved: "resolved",
  Dismissed: "dismissed",
};

export default function ReportsPage() {
  return (
    <RoleGate allowedRoles={trustReadRoles}>
      <DataListPage
        title="Reports"
        description="Safety reports from members. Trust & Safety owns resolve/dismiss. Support can look up a case, not close it."
        queryKey="reports"
        fetcher={({ page, pageSize, status }) => getReports({ page, pageSize, status })}
        tabs={["All", "Open", "In review", "Resolved", "Dismissed"]}
        statusFromTab={(tab) => tabStatus[tab]}
        searchPlaceholder="Search reports..."
        emptyTitle="No reports"
        emptyDescription="Reports from users will appear here."
        columns={[
          {
            key: "id",
            header: "Report",
            cell: (r) => (
              <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                {r.id.slice(0, 8)}…
              </Link>
            ),
          },
          { key: "type", header: "Type", cell: (r) => <StatusPill label={r.type} tone="muted" /> },
          {
            key: "reporter",
            header: "Reporter",
            cell: (r) => <AppUserCell user={r.reporter} fallbackId={r.reporterId} />,
          },
          {
            key: "target",
            header: "Reported user",
            cell: (r) => <AppUserCell user={r.target} fallbackId={r.targetId} />,
          },
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
    </RoleGate>
  );
}
