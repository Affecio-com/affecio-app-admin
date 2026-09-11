"use client";

import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { AppUserCell } from "@/components/users/AppUserCell";
import { formatDateTime } from "@/lib/format";
import { getMatches } from "@/services/matches";
import { memberOpsRoles } from "@/config/access";

export default function MatchesPage() {
  return (
    <RoleGate allowedRoles={memberOpsRoles}>
      <DataListPage
        title="Matches"
        description="Mutual matches. Support uses this when a member says a match disappeared."
        queryKey="matches"
        fetcher={({ page, pageSize }) => getMatches({ page, pageSize })}
        emptyTitle="No matches"
        emptyDescription="Match records will appear here."
        columns={[
          {
            key: "userA",
            header: "User A",
            cell: (m) => <AppUserCell user={m.userA} fallbackId={m.userAId} />,
          },
          {
            key: "userB",
            header: "User B",
            cell: (m) => <AppUserCell user={m.userB} fallbackId={m.userBId} />,
          },
          {
            key: "created",
            header: "Matched",
            cell: (m) => formatDateTime(m.createdAt),
          },
        ]}
      />
    </RoleGate>
  );
}
