"use client";

import { DataListPage } from "@/components/layout/DataListPage";
import { StatusPill, callStatusTone } from "@/components/shared/StatusPill";
import { formatDateTime } from "@/lib/format";
import { getCalls } from "@/services/calls";

export default function CallsPage() {
  return (
    <DataListPage
      title="Calls"
      description="Voice and video call sessions between matched users."
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
          key: "participants",
          header: "Participants",
          cell: (c) => (
            <span className="text-sm">
              {c.userA?.name ?? c.userAId} · {c.userB?.name ?? c.userBId}
            </span>
          ),
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
  );
}
