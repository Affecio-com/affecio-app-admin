"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Plus, Siren } from "lucide-react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { AppUserCell } from "@/components/users/AppUserCell";
import { formatDateTime } from "@/lib/format";
import { getSupportStats, getSupportTickets } from "@/services/support";
import { useQuery } from "@tanstack/react-query";

const tabStatus: Record<string, string | undefined> = {
  All: undefined,
  Mine: "mine",
  Open: "open",
  "In progress": "in_progress",
  Waiting: "waiting_on_user",
  Escalated: "escalated",
  Resolved: "resolved",
};

function ticketTone(status: string) {
  switch (status) {
    case "open":
      return "warning" as const;
    case "in_progress":
      return "default" as const;
    case "waiting_on_user":
      return "muted" as const;
    case "escalated":
      return "danger" as const;
    case "resolved":
    case "closed":
      return "success" as const;
    default:
      return "muted" as const;
  }
}

function priorityTone(priority: string) {
  if (priority === "urgent" || priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "muted" as const;
}

export default function SupportInboxPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const statsQuery = useQuery({ queryKey: ["support", "stats"], queryFn: getSupportStats });

  return (
    <RoleGate allowedRoles={["super_admin", "admin", "support"]}>
    <>
      <DataListPage
        title="Support inbox"
        description="Member complaints and live chat. Own the ticket, reply in-thread, escalate to Admin or Developer when you cannot resolve it."
        banner={
          statsQuery.data ? (
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <AffecioStatCard label="Open" value={statsQuery.data.open} />
              <AffecioStatCard label="In progress" value={statsQuery.data.inProgress} />
              <AffecioStatCard label="Waiting on member" value={statsQuery.data.waiting} />
              <AffecioStatCard label="Escalated" value={statsQuery.data.escalated} />
              <AffecioStatCard label="Resolved today" value={statsQuery.data.resolvedToday} />
            </div>
          ) : null
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/support/playbook">
              <AffecioButton variant="secondary">
                <BookOpen className="h-4 w-4" />
                Playbook
              </AffecioButton>
            </Link>
            <Link href="/support/escalations">
              <AffecioButton variant="secondary">
                <Siren className="h-4 w-4" />
                Escalations
              </AffecioButton>
            </Link>
            <AffecioButton onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New ticket
            </AffecioButton>
          </div>
        }
        queryKey="support-tickets"
        tabs={["All", "Mine", "Open", "In progress", "Waiting", "Escalated", "Resolved"]}
        statusFromTab={(tab) => tabStatus[tab]}
        fetcher={({ page, pageSize, search, status }) =>
          status === "mine"
            ? getSupportTickets({ page, pageSize, search, assignedToId: "me" })
            : getSupportTickets({ page, pageSize, search, status })
        }
        searchPlaceholder="Search by member, subject, or ticket ID..."
        emptyTitle="No tickets"
        emptyDescription="New member complaints and chats will land here."
        columns={[
          {
            key: "member",
            header: "Member",
            cell: (t) => <AppUserCell user={t.user} fallbackId={t.userId} />,
          },
          {
            key: "subject",
            header: "Ticket",
            cell: (t) => (
              <div>
                <Link href={`/support/${t.id}`} className="font-medium hover:underline">
                  {t.subject}
                </Link>
                {t.lastMessage ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-affecio-muted">{t.lastMessage.body}</p>
                ) : null}
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            cell: (t) => <StatusPill label={t.category} tone="muted" />,
          },
          {
            key: "priority",
            header: "Priority",
            cell: (t) => <StatusPill label={t.priority} tone={priorityTone(t.priority)} />,
          },
          {
            key: "sla",
            header: "SLA",
            cell: (t) =>
              t.status === "resolved" || t.status === "closed" ? (
                <span className="text-xs text-affecio-muted">—</span>
              ) : (
                <StatusPill
                  label={t.slaBreached ? "Breached" : `${t.slaHours ?? 24}h`}
                  tone={t.slaBreached ? "danger" : "success"}
                />
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (t) => <StatusPill label={t.status} tone={ticketTone(t.status)} />,
          },
          {
            key: "updated",
            header: "Updated",
            cell: (t) => formatDateTime(t.updatedAt),
          },
        ]}
      />
      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
    </RoleGate>
  );
}
