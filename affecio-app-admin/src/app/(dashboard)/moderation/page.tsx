"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getModerationFlags } from "@/services/moderation";
import { AppUserCell } from "@/components/users/AppUserCell";
import { enforceRoles } from "@/config/access";

export default function ModerationPage() {
  return (
    <RoleGate allowedRoles={enforceRoles}>
      <DataListPage
        title="Moderation"
        description="Flagged photos and profiles. Open the member to hide media or enforce, then resolve the report."
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
            header: "User",
            cell: (f) => <AppUserCell user={f.target} fallbackId={f.targetId} />,
          },
          {
            key: "reporter",
            header: "Reporter",
            cell: (f) => <AppUserCell user={f.reporter} fallbackId={undefined} />,
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
          {
            key: "review",
            header: "",
            cell: (f) => (
              <div className="flex gap-3 text-sm">
                <Link href={`/reports/${f.id}`} className="hover:underline">
                  Report
                </Link>
                <Link href={`/users/${f.targetId}`} className="hover:underline">
                  Member
                </Link>
              </div>
            ),
          },
        ]}
      />
    </RoleGate>
  );
}
