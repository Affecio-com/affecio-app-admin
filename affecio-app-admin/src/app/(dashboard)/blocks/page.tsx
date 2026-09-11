"use client";

import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { AppUserCell } from "@/components/users/AppUserCell";
import { formatDateTime } from "@/lib/format";
import { getBlocks } from "@/services/blocks";
import { memberOpsRoles } from "@/config/access";

export default function BlocksPage() {
  return (
    <RoleGate allowedRoles={memberOpsRoles}>
      <DataListPage
        title="Blocks"
        description="Who blocked whom. Support checks this before telling a member a match is gone."
        queryKey="blocks"
        fetcher={({ page, pageSize }) => getBlocks({ page, pageSize })}
        emptyTitle="No blocks"
        emptyDescription="Block records will appear here when users block each other."
        columns={[
          {
            key: "blocker",
            header: "Blocker",
            cell: (b) => <AppUserCell user={b.blocker} fallbackId={b.blockerId} />,
          },
          {
            key: "blocked",
            header: "Blocked",
            cell: (b) => <AppUserCell user={b.blocked} fallbackId={b.blockedId} />,
          },
          {
            key: "created",
            header: "Blocked at",
            cell: (b) => formatDateTime(b.createdAt),
          },
        ]}
      />
    </RoleGate>
  );
}
