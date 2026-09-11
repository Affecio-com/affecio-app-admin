"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable } from "@/components/shared/DataTable";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { getSupportTickets } from "@/services/support";
import type { AppUserCellUser } from "@/components/users/AppUserCell";

export function UserSupportTickets({ user }: { user: AppUserCellUser }) {
  const { admin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const canSupport = Boolean(admin && ["super_admin", "admin", "support"].includes(admin.role));

  const { data } = useQuery({
    queryKey: ["support-tickets", "user", user.id],
    queryFn: () => getSupportTickets({ page: 1, pageSize: 8, userId: user.id }),
    enabled: canSupport,
  });

  if (!canSupport) return null;

  return (
    <>
      <AffecioCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Support tickets</h2>
            <p className="mt-1 text-sm text-affecio-muted">
              Complaints and live chats logged against this member.
            </p>
          </div>
          <AffecioButton onClick={() => setCreateOpen(true)}>Open ticket</AffecioButton>
        </div>
        <div className="mt-4">
          {!data?.data.length ? (
            <p className="text-sm text-affecio-muted">No tickets yet.</p>
          ) : (
            <DataTable
              data={data.data}
              columns={[
                {
                  key: "subject",
                  header: "Ticket",
                  cell: (t) => (
                    <Link href={`/support/${t.id}`} className="font-medium hover:underline">
                      {t.subject}
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (t) => <StatusPill label={t.status} />,
                },
                {
                  key: "priority",
                  header: "Priority",
                  cell: (t) => <StatusPill label={t.priority} />,
                },
                {
                  key: "updated",
                  header: "Updated",
                  cell: (t) => formatDateTime(t.updatedAt),
                },
              ]}
            />
          )}
        </div>
      </AffecioCard>
      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} defaultUser={user} />
    </>
  );
}
