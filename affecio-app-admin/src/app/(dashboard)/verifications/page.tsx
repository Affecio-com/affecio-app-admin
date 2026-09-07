"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getVerificationQueue } from "@/services/verifications";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

export default function VerificationsPage() {
  return (
    <DataListPage
      title="Verifications"
      description="Review identity and media verification submissions."
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
        { key: "user", header: "User ID", cell: (item) => item.userId },
        {
          key: "status",
          header: "Status",
          cell: (item) => <StatusPill label={item.status} tone={item.status === "pending" ? "warning" : item.status === "approved" ? "success" : "danger"} />,
        },
        {
          key: "submitted",
          header: "Submitted",
          cell: (item) => formatDateTime(item.submittedAt),
        },
      ]}
    />
  );
}
