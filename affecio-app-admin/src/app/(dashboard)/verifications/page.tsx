"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getVerificationQueue } from "@/services/verifications";
import { AppUserCell } from "@/components/users/AppUserCell";
import { trustReadRoles } from "@/config/access";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

export default function VerificationsPage() {
  return (
    <RoleGate allowedRoles={trustReadRoles}>
      <DataListPage
        title="Verifications"
        description="Photo verification queue. Only Trust & Safety can approve or reject. Support can explain status to a member."
        queryKey="verifications"
        fetcher={({ page, pageSize, status }) => getVerificationQueue({ page, pageSize, status })}
        tabs={["All", "Pending", "Approved", "Rejected"]}
        statusFromTab={(tab) => tabStatus[tab]}
        searchPlaceholder="Search by user ID..."
        emptyTitle="No verifications"
        emptyDescription="Verification queue items will appear here."
        columns={[
          {
            key: "id",
            header: "ID",
            cell: (item) => (
              <Link href={`/verifications/${item.id}`} className="font-mono text-xs hover:underline">
                {item.id.slice(0, 8)}…
              </Link>
            ),
          },
          {
            key: "user",
            header: "User",
            cell: (item) => <AppUserCell user={item.user} fallbackId={item.userId} subtitle />,
          },
          {
            key: "status",
            header: "Status",
            cell: (item) => (
              <StatusPill
                label={item.status}
                tone={item.status === "pending" ? "warning" : item.status === "approved" ? "success" : "danger"}
              />
            ),
          },
          {
            key: "submitted",
            header: "Submitted",
            cell: (item) => formatDateTime(item.submittedAt),
          },
        ]}
      />
    </RoleGate>
  );
}
