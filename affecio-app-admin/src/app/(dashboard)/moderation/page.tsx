"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getModerationFlags } from "@/services/moderation";

export default function ModerationPage() {
  return (
    <DataListPage
      title="Moderation"
      description="Review flagged media and profile content."
      queryKey="moderation"
      fetcher={({ page, pageSize }) => getModerationFlags({ page, pageSize })}
      tabs={["All", "Pending", "Actioned"]}
      emptyTitle="No moderation flags"
      emptyDescription="Open media and profile flags will appear here."
      columns={[
        {
          key: "type",
          header: "Type",
          cell: (f) => <StatusPill label={f.type} tone="muted" />,
        },
        {
          key: "target",
          header: "Target",
          cell: (f) => <span className="font-mono text-xs">{f.targetId}</span>,
        },
        { key: "reason", header: "Reason", cell: (f) => f.reason },
        {
          key: "status",
          header: "Status",
          cell: (f) => (
            <StatusPill label={f.status} tone={f.status === "pending" ? "warning" : "success"} />
          ),
        },
        {
          key: "created",
          header: "Flagged",
          cell: (f) => formatDateTime(f.createdAt),
        },
      ]}
    />
  );
}
