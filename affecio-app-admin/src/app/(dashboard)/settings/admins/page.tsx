"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RoleGate } from "@/components/layout/RoleGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsBackLink } from "@/components/settings/SettingsSections";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import {
  getAdminUsers,
  inviteAdminUser,
  removeAdminUser,
  resendAdminInvite,
  revokeAdminInvite,
  type InviteAdminResult,
} from "@/services/adminUsers";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/providers/AuthProvider";
import type { AdminRole } from "@/types/admin";

const ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "support", "developer", "marketing"];

type PendingAction =
  | { type: "revoke"; id: string; label: string }
  | { type: "remove"; id: string; label: string };

export default function AdminManagementPage() {
  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <AdminUsersContent />
    </RoleGate>
  );
}

function AdminUsersContent() {
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<{ message: string; link?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminRole,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  function showInviteResult(result: InviteAdminResult) {
    setCopied(false);
    if (result.emailSent) {
      setNotice({ message: `Invitation email sent to ${result.email}.` });
    } else {
      setNotice({
        message: `Invitation saved for ${result.email}, but the email could not be delivered. Share this link with them:`,
        link: result.acceptUrl,
        error: result.emailError,
      });
    }
  }

  const inviteMutation = useMutation({
    mutationFn: inviteAdminUser,
    onSuccess: (result) => {
      refresh();
      setDialogOpen(false);
      setForm({ name: "", email: "", role: "admin" });
      setFormError("");
      showInviteResult(result);
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to create invitation.")),
  });

  const resendMutation = useMutation({
    mutationFn: resendAdminInvite,
    onSuccess: (result) => {
      refresh();
      setActionError("");
      showInviteResult(result);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "Failed to resend invitation.")),
  });

  const confirmMutation = useMutation({
    mutationFn: (action: PendingAction) =>
      action.type === "revoke" ? revokeAdminInvite(action.id) : removeAdminUser(action.id),
    onSuccess: (_data, action) => {
      refresh();
      setConfirm(null);
      setActionError("");
      setNotice({
        message: action.type === "revoke" ? `Invitation for ${action.label} revoked.` : `Access removed for ${action.label}.`,
      });
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "Action failed.")),
  });

  const admins = data?.admins ?? [];
  const pending = data?.pendingInvites ?? [];

  return (
    <div>
      <PageHeader
        title="Admin management"
        description="Invite team members by email. They set their own password before signing in."
        action={
          <div className="flex items-center gap-3">
            <SettingsBackLink />
            <AffecioButton onClick={() => setDialogOpen(true)}>+ Invite admin</AffecioButton>
          </div>
        }
      />

      {notice ? (
        <div className="mb-4 rounded-lg border border-affecio-border bg-affecio-surface px-4 py-3 text-sm text-affecio-text">
          <div className="flex items-start justify-between gap-3">
            <p>{notice.message}</p>
            <button
              type="button"
              className="text-affecio-muted hover:text-affecio-text"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          {notice.error ? <p className="mt-1 text-xs text-affecio-muted">Reason: {notice.error}</p> : null}
          {notice.link ? (
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={notice.link} onFocus={(e) => e.currentTarget.select()} />
              <AffecioButton
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(notice.link!).then(() => setCopied(true));
                }}
              >
                {copied ? "Copied" : "Copy"}
              </AffecioButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {actionError && !confirm ? (
        <div className="mb-4">
          <ApiErrorMessage message={actionError} />
        </div>
      ) : null}

      <ContentPanel showToolbar={false} showPagination={false}>
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ApiErrorMessage message={getApiErrorMessage(error, "Failed to load admins")} />
          </div>
        ) : !admins.length && !pending.length ? (
          <EmptyState title="No admins" description="Run db:seed or invite the first admin." />
        ) : (
          <div className="space-y-8 p-5">
            {pending.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-medium text-affecio-muted">Pending invitations</h2>
                <DataTable
                  data={pending}
                  columns={[
                    { key: "name", header: "Name", cell: (a) => a.name },
                    { key: "email", header: "Email", cell: (a) => a.email },
                    {
                      key: "role",
                      header: "Role",
                      cell: (a) => <StatusPill label={a.role.replace(/_/g, " ")} tone="warning" />,
                    },
                    {
                      key: "expires",
                      header: "Expires",
                      cell: (a) =>
                        new Date(a.expiresAt).getTime() <= now ? (
                          <StatusPill label="Expired" tone="muted" />
                        ) : (
                          formatDateTime(a.expiresAt)
                        ),
                    },
                    {
                      key: "invitedBy",
                      header: "Invited by",
                      cell: (a) => a.invitedBy.name,
                    },
                    {
                      key: "actions",
                      header: "",
                      cell: (a) => (
                        <div className="flex justify-end gap-2">
                          <AffecioButton
                            variant="secondary"
                            disabled={resendMutation.isPending}
                            onClick={() => resendMutation.mutate(a.id)}
                          >
                            {resendMutation.isPending && resendMutation.variables === a.id ? "Sending…" : "Resend"}
                          </AffecioButton>
                          <AffecioButton
                            variant="danger"
                            onClick={() => {
                              setActionError("");
                              setConfirm({ type: "revoke", id: a.id, label: a.email });
                            }}
                          >
                            Revoke
                          </AffecioButton>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ) : null}

            <div>
              <h2 className="mb-3 text-sm font-medium text-affecio-muted">Active admins</h2>
              <DataTable
                data={admins}
                columns={[
                  { key: "name", header: "Name", cell: (a) => a.name },
                  { key: "email", header: "Email", cell: (a) => a.email },
                  {
                    key: "role",
                    header: "Role",
                    cell: (a) => <StatusPill label={a.role.replace(/_/g, " ")} />,
                  },
                  {
                    key: "mfa",
                    header: "MFA",
                    cell: (a) => (
                      <StatusPill
                        label={a.mfaEnabled ? "Enabled" : "Off"}
                        tone={a.mfaEnabled ? "success" : "muted"}
                      />
                    ),
                  },
                  {
                    key: "lastLogin",
                    header: "Last login",
                    cell: (a) => (a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"),
                  },
                  {
                    key: "lastActivity",
                    header: "Last activity",
                    cell: (a) => formatRelativeTime(a.lastActivityAt),
                  },
                  {
                    key: "actions",
                    header: "",
                    cell: (a) =>
                      a.id === currentAdmin?.id ? (
                        <span className="block text-right text-xs text-affecio-muted">You</span>
                      ) : (
                        <div className="flex justify-end">
                          <AffecioButton
                            variant="danger"
                            onClick={() => {
                              setActionError("");
                              setConfirm({ type: "remove", id: a.id, label: a.email });
                            }}
                          >
                            Remove
                          </AffecioButton>
                        </div>
                      ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </ContentPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite admin</DialogTitle>
            <DialogDescription>
              We will email a secure link so they can choose their password and sign in.
            </DialogDescription>
          </DialogHeader>
          {formError ? <ApiErrorMessage message={formError} /> : null}
          <div className="space-y-3 py-2">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              type="email"
              placeholder="Work email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <select
              className="h-10 w-full rounded-lg border border-affecio-border bg-affecio-input px-3 text-sm text-affecio-text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminRole }))}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <AffecioButton variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </AffecioButton>
            <AffecioButton
              disabled={inviteMutation.isPending || !form.name.trim() || !form.email.trim()}
              onClick={() => inviteMutation.mutate(form)}
            >
              {inviteMutation.isPending ? "Sending…" : "Send invitation"}
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.type === "revoke" ? "Revoke invitation?" : "Remove admin access?"}</DialogTitle>
            <DialogDescription>
              {confirm?.type === "revoke"
                ? `The invite link sent to ${confirm?.label} will stop working immediately.`
                : `${confirm?.label} will be signed out everywhere and can no longer sign in. Their audit history is kept, and you can re-invite them later.`}
            </DialogDescription>
          </DialogHeader>
          {actionError ? <ApiErrorMessage message={actionError} /> : null}
          <DialogFooter>
            <AffecioButton variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </AffecioButton>
            <AffecioButton
              variant="danger"
              disabled={confirmMutation.isPending}
              onClick={() => confirm && confirmMutation.mutate(confirm)}
            >
              {confirmMutation.isPending
                ? "Working…"
                : confirm?.type === "revoke"
                  ? "Revoke invite"
                  : "Remove access"}
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
