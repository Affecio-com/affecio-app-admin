"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { formatDateTime } from "@/lib/format";
import { getBlocks } from "@/services/blocks";

export default function BlocksPage() {
  return (
    <DataListPage
      title="Blocks"
      description="User block relationships and enforcement history."
      queryKey="blocks"
      fetcher={({ page, pageSize }) => getBlocks({ page, pageSize })}
      emptyTitle="No blocks"
      emptyDescription="Block records will appear here when users block each other."
      columns={[
        {
          key: "blocker",
          header: "Blocker",
          cell: (b) =>
            b.blocker ? (
              <Link href={`/users/${b.blocker.id}`} className="hover:underline">
                {b.blocker.name}
              </Link>
            ) : (
              b.blockerId
            ),
        },
        {
          key: "blocked",
          header: "Blocked",
          cell: (b) =>
            b.blocked ? (
              <Link href={`/users/${b.blocked.id}`} className="hover:underline">
                {b.blocked.name}
              </Link>
            ) : (
              b.blockedId
            ),
        },
        {
          key: "created",
          header: "Blocked at",
          cell: (b) => formatDateTime(b.createdAt),
        },
      ]}
    />
  );
}
