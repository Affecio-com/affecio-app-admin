"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { StatusPill, reportStatusTone } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getReports } from "@/services/reports";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Open: "open",
  "In review": "reviewing",
  Resolved: "resolved",
  Dismissed: "dismissed",
};

export default function ReportsPage() {
  return (
    <DataListPage
      title="Reports"
      description="Review and resolve user and content reports."
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
  );
}
