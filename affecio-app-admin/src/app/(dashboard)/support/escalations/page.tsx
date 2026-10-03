"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { StatusPill } from "@/components/shared/StatusPill";
import { AdminUserCell } from "@/components/admin/AdminUserCell";
import { AppUserCell } from "@/components/users/AppUserCell";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { getEscalations, updateEscalation } from "@/services/support";
import { useAuth } from "@/providers/AuthProvider";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Open: "open",
  Acknowledged: "acknowledged",
  "To admin": "target_admin",
  "To developer": "target_developer",
  Resolved: "resolved",
};

export default function EscalationsPage() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const canHandle = Boolean(admin && ["super_admin", "admin", "developer"].includes(admin.role));
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "acknowledged" | "resolved";
      notes?: string;
    }) => updateEscalation(id, { status, notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support-escalations"] });
    },
  });

  return (
    <RoleGate allowedRoles={["super_admin", "admin", "support", "developer"]}>
    <DataListPage
      title="Escalations"
      description="Issues support sent to Admin (policy, bans, legal) or Developer (bugs, infra). Acknowledge ownership, then resolve with a note so the desk can close the loop with the member."
      queryKey="support-escalations"
      tabs={["All", "Open", "Acknowledged", "To admin", "To developer", "Resolved"]}
      statusFromTab={(tab) => tabStatus[tab]}
      fetcher={({ page, pageSize, status }) => {
        if (status === "target_admin") return getEscalations({ page, pageSize, target: "admin" });
        if (status === "target_developer") return getEscalations({ page, pageSize, target: "developer" });
        return getEscalations({ page, pageSize, status });
      }}
      emptyTitle="No escalations"
      emptyDescription="When support cannot resolve a ticket, it appears here for Admin or Engineering."
      columns={[
        {
          key: "member",
          header: "Member",
          cell: (e) => <AppUserCell user={e.ticket?.user} fallbackId={e.ticketId} />,
        },
        {
          key: "ticket",
          header: "Ticket",
          cell: (e) => (
            <Link href={`/support/${e.ticketId}`} className="font-medium hover:underline">
              {e.ticket?.subject ?? e.ticketId}
            </Link>
          ),
        },
        {
          key: "target",
          header: "Sent to",
          cell: (e) => <StatusPill label={e.target} />,
        },
        {
          key: "reason",
          header: "Reason",
          cell: (e) => <span className="line-clamp-2 text-sm">{e.reason}</span>,
        },
        {
          key: "raisedBy",
          header: "Raised by",
          cell: (e) => <AdminUserCell admin={e.createdBy} />,
        },
        {
          key: "status",
          header: "Status",
          cell: (e) => (
            <StatusPill
              label={e.status}
              tone={e.status === "resolved" ? "success" : e.status === "open" ? "warning" : "default"}
            />
          ),
        },
        {
          key: "when",
          header: "Opened",
          cell: (e) => formatDateTime(e.createdAt),
        },
        {
          key: "actions",
          header: "",
          cell: (e) =>
            canHandle && e.status !== "resolved" ? (
              <div className="flex min-w-[220px] flex-col gap-2">
                <Input
                  placeholder="Resolution note"
                  value={notesById[e.id] ?? ""}
                  onChange={(ev) => setNotesById((m) => ({ ...m, [e.id]: ev.target.value }))}
                />
                <div className="flex gap-2">
                  {e.status === "open" ? (
                    <AffecioButton
                      variant="secondary"
                      onClick={() =>
                        mutation.mutate({
                          id: e.id,
                          status: "acknowledged",
                          notes: notesById[e.id],
                        })
                      }
                    >
                      Acknowledge
                    </AffecioButton>
                  ) : null}
                  <AffecioButton
                    variant="secondary"
                    onClick={() =>
                      mutation.mutate({
                        id: e.id,
                        status: "resolved",
                        notes: notesById[e.id],
                      })
                    }
                  >
                    Resolve
                  </AffecioButton>
                </div>
              </div>
            ) : (
              <AdminUserCell admin={e.handledBy ?? e.createdBy} />
            ),
        },
      ]}
    />
    </RoleGate>
  );
}
