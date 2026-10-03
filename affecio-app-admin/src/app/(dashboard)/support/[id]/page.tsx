"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { AdminUserCell } from "@/components/admin/AdminUserCell";
import { AppUserCell, UserAvatar } from "@/components/users/AppUserCell";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api-error";
import { CANNED_REPLIES } from "@/config/support-playbook";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
  escalateSupportTicket,
  getSupportTicket,
  sendSupportMessage,
  updateSupportTicket,
  type SupportEscalationTarget,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/services/support";

function ticketTone(status: string) {
  switch (status) {
    case "open":
      return "warning" as const;
    case "escalated":
      return "danger" as const;
    case "resolved":
    case "closed":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export default function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [asUser, setAsUser] = useState(false);
  const [internal, setInternal] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState<SupportEscalationTarget>("admin");
  const [escalateReason, setEscalateReason] = useState("");
  const [error, setError] = useState("");

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["support", "ticket", id],
    queryFn: () => getSupportTicket(id),
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const authorType = internal ? "internal" : asUser ? "user" : "agent";

  const sendMutation = useMutation({
    mutationFn: () => sendSupportMessage(id, { body: draft.trim(), authorType }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["support", "ticket", id], updated);
      setDraft("");
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to send.")),
  });

  const statusMutation = useMutation({
    mutationFn: (status: SupportTicketStatus) => updateSupportTicket(id, { status }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["support", "ticket", id], updated);
    },
  });

  const metaMutation = useMutation({
    mutationFn: (input: { priority?: SupportTicketPriority; assignedToId?: string | null }) =>
      updateSupportTicket(id, input),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["support", "ticket", id], updated);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () =>
      escalateSupportTicket(id, { target: escalateTarget, reason: escalateReason.trim() }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["support", "ticket", id], updated);
      setEscalateOpen(false);
      setEscalateReason("");
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to escalate.")),
  });

  const canChat = Boolean(admin && ["super_admin", "admin", "support", "developer"].includes(admin.role));
  const canEscalate = Boolean(admin && ["super_admin", "admin", "support"].includes(admin.role));
  const assignedToMe = Boolean(admin && ticket?.assignedToId === admin.id);

  return (
    <RoleGate allowedRoles={["super_admin", "admin", "support", "developer"]}>
    <div>
      <PageHeader
        title={ticket?.subject ?? "Ticket"}
        description={
          ticket
            ? `${ticket.category} · last updated ${formatDateTime(ticket.updatedAt)}`
            : `Loading ${id}…`
        }
        action={
          <Link
            href={admin?.role === "developer" ? "/support/escalations" : "/support"}
            className="text-sm text-affecio-muted hover:text-affecio-text"
          >
            ← {admin?.role === "developer" ? "Escalations" : "Inbox"}
          </Link>
        }
      />

      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError || !ticket ? (
        <AffecioCard>
          <ApiErrorMessage message="Ticket not found." />
        </AffecioCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <AffecioCard padding="none" className="flex min-h-[560px] flex-col">
            <div className="flex items-center justify-between border-b border-affecio-border px-5 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={ticket.user} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-affecio-muted">
                    Live chat with member
                  </p>
                  <p className="text-sm text-affecio-text">{ticket.user?.name ?? "Member"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ticket.slaBreached ? <StatusPill label="SLA breached" tone="danger" /> : null}
                <StatusPill label={ticket.status} tone={ticketTone(ticket.status)} />
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {(ticket.messages ?? []).map((message) => {
                const isAgent = message.authorType === "agent";
                const isSystem = message.authorType === "system";
                const isInternal = message.authorType === "internal";
                const agentAdmin = message.admin;
                const memberUser = ticket.user;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      isInternal || isSystem ? "justify-center" : isAgent ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isSystem && !isInternal && !isAgent ? (
                      <UserAvatar user={memberUser} size="sm" className="mt-1" />
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        isSystem && "w-full rounded-lg bg-affecio-input text-center text-xs text-affecio-muted",
                        isInternal &&
                          "w-full rounded-lg border border-dashed border-affecio-border bg-affecio-input text-xs",
                        isAgent && "bg-affecio-text text-affecio-bg",
                        message.authorType === "user" && "bg-affecio-input text-affecio-text",
                      )}
                    >
                      {!isSystem ? (
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-70">
                          {isInternal || isAgent ? (
                            <AdminAvatar admin={agentAdmin} size="sm" className="h-5 w-5 text-[9px]" />
                          ) : null}
                          <span>
                            {isInternal
                              ? `Internal · ${agentAdmin?.name ?? "Agent"}`
                              : isAgent
                                ? agentAdmin?.name ?? "Agent"
                                : memberUser?.name ?? "Member"}
                          </span>
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p className="mt-1 text-[10px] opacity-60">{formatDateTime(message.createdAt)}</p>
                    </div>
                    {!isSystem && !isInternal && isAgent ? (
                      <AdminAvatar admin={agentAdmin} size="sm" className="mt-1" />
                    ) : null}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {canChat ? (
              <div className="border-t border-affecio-border p-4">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CANNED_REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      type="button"
                      onClick={() => setDraft(reply.body)}
                      className="rounded-full border border-affecio-border px-2.5 py-1 text-[11px] text-affecio-muted hover:bg-affecio-input hover:text-affecio-text"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder={
                    internal
                      ? "Internal note for Admin / Developer — not shown to the member…"
                      : "Reply to the member…"
                  }
                  className="w-full rounded-lg border border-affecio-border bg-affecio-surface px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                      sendMutation.mutate();
                    }
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-affecio-muted">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={asUser}
                        onChange={(e) => {
                          setAsUser(e.target.checked);
                          if (e.target.checked) setInternal(false);
                        }}
                      />
                      Log as member message
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={internal}
                        onChange={(e) => {
                          setInternal(e.target.checked);
                          if (e.target.checked) setAsUser(false);
                        }}
                      />
                      Internal note
                    </label>
                  </div>
                  <AffecioButton
                    disabled={sendMutation.isPending || !draft.trim()}
                    onClick={() => sendMutation.mutate()}
                  >
                    {internal ? "Add note" : "Send"}
                  </AffecioButton>
                </div>
                {error ? <p className="mt-2 text-sm text-affecio-danger">{error}</p> : null}
              </div>
            ) : null}
          </AffecioCard>

          <div className="space-y-4">
            <AffecioCard>
              <p className="text-xs font-medium uppercase tracking-wider text-affecio-muted">Member</p>
              <div className="mt-3">
                <AppUserCell user={ticket.user} fallbackId={ticket.userId} subtitle />
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-affecio-muted">Priority</dt>
                  <dd>
                    {canEscalate ? (
                      <select
                        value={ticket.priority}
                        onChange={(e) =>
                          metaMutation.mutate({ priority: e.target.value as SupportTicketPriority })
                        }
                        className="h-8 rounded-md border border-affecio-border bg-affecio-surface px-2 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <StatusPill label={ticket.priority} />
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-affecio-muted">Category</dt>
                  <dd className="capitalize">{ticket.category}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-affecio-muted">Assignee</dt>
                  <dd>
                    <AdminUserCell admin={ticket.assignedTo} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-affecio-muted">SLA</dt>
                  <dd>
                    {ticket.slaBreached
                      ? "Breached"
                      : ticket.slaDueAt
                        ? `Due ${formatDateTime(ticket.slaDueAt)}`
                        : "—"}
                  </dd>
                </div>
              </dl>
              {canEscalate && admin ? (
                <AffecioButton
                  className="mt-3 w-full"
                  variant="secondary"
                  onClick={() =>
                    metaMutation.mutate({ assignedToId: assignedToMe ? null : admin.id })
                  }
                >
                  {assignedToMe ? "Unassign" : "Assign to me"}
                </AffecioButton>
              ) : null}
            </AffecioCard>

            {canEscalate ? (
              <AffecioCard>
                <p className="text-sm font-medium">Ticket actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AffecioButton variant="secondary" onClick={() => statusMutation.mutate("in_progress")}>
                    In progress
                  </AffecioButton>
                  <AffecioButton variant="secondary" onClick={() => statusMutation.mutate("waiting_on_user")}>
                    Waiting
                  </AffecioButton>
                  <AffecioButton variant="secondary" onClick={() => statusMutation.mutate("resolved")}>
                    Resolve
                  </AffecioButton>
                  <AffecioButton variant="secondary" onClick={() => statusMutation.mutate("closed")}>
                    Close
                  </AffecioButton>
                  <AffecioButton variant="secondary" onClick={() => setEscalateOpen((v) => !v)}>
                    Escalate
                  </AffecioButton>
                </div>
                {escalateOpen ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-affecio-muted">
                      Send this issue to management or engineering. They will see it in Escalations.
                    </p>
                    <select
                      value={escalateTarget}
                      onChange={(e) => setEscalateTarget(e.target.value as SupportEscalationTarget)}
                      className="h-10 w-full rounded-lg border border-affecio-border bg-affecio-surface px-3 text-sm"
                    >
                      <option value="admin">To Admin / management</option>
                      <option value="developer">To Developer / engineering</option>
                    </select>
                    <Input
                      placeholder="Why does this need them?"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                    />
                    <AffecioButton
                      disabled={!escalateReason.trim() || escalateMutation.isPending}
                      onClick={() => escalateMutation.mutate()}
                    >
                      Send escalation
                    </AffecioButton>
                  </div>
                ) : null}
              </AffecioCard>
            ) : null}

            {(ticket.escalations ?? []).length > 0 ? (
              <AffecioCard>
                <p className="text-sm font-medium">Escalations</p>
                <ul className="mt-3 space-y-3 text-sm">
                  {ticket.escalations?.map((item) => (
                    <li key={item.id} className="border-b border-affecio-border pb-2 last:border-0">
                      <StatusPill label={`${item.target} · ${item.status}`} />
                      <p className="mt-1 text-affecio-muted">{item.reason}</p>
                      {item.notes ? <p className="mt-1 text-xs">{item.notes}</p> : null}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/support/escalations"
                  className="mt-3 inline-block text-xs text-affecio-muted hover:text-affecio-text"
                >
                  Open escalation queue →
                </Link>
              </AffecioCard>
            ) : null}
          </div>
        </div>
      )}
    </div>
    </RoleGate>
  );
}
