"use client";

import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { StatusPill, callStatusTone } from "@/components/shared/StatusPill";
import { AppUserCell } from "@/components/users/AppUserCell";
import { formatDateTime } from "@/lib/format";
import { getCalls } from "@/services/calls";
import { memberOpsRoles } from "@/config/access";

export default function CallsPage() {
  return (
    <RoleGate allowedRoles={memberOpsRoles}>
      <DataListPage
        title="Calls"
        description="Voice and video sessions. Support uses this for dropped-call complaints."
        queryKey="calls"
        fetcher={({ page, pageSize }) => getCalls({ page, pageSize })}
        tabs={["All", "Active", "Ended"]}
        emptyTitle="No call sessions"
        emptyDescription="Call records will appear here."
        columns={[
          {
            key: "channel",
            header: "Channel",
            cell: (c) => <span className="font-mono text-xs">{c.channelName}</span>,
          },
          {
            key: "userA",
            header: "Caller",
            cell: (c) => <AppUserCell user={c.userA} fallbackId={c.userAId} />,
          },
          {
            key: "userB",
            header: "Callee",
            cell: (c) => <AppUserCell user={c.userB} fallbackId={c.userBId} />,
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => <StatusPill label={c.status} tone={callStatusTone(c.status)} />,
          },
          {
            key: "started",
            header: "Started",
            cell: (c) => formatDateTime(c.startedAt),
          },
        ]}
      />
    </RoleGate>
  );
}
