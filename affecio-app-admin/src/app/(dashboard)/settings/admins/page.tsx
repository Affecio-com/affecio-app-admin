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
import { getAdminUsers, inviteAdminUser } from "@/services/adminUsers";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminRole } from "@/types/admin";

const ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "support", "developer", "marketing"];

export default function AdminManagementPage() {
  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <AdminUsersContent />
    </RoleGate>
  );
}

function AdminUsersContent() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminRole,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteAdminUser,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setForm({ name: "", email: "", role: "admin" });
      setFormError("");
      if (result.emailSent) {
        setSuccessMessage(`Invitation sent to ${result.email}.`);
      } else if (result.acceptUrl) {
        setSuccessMessage(`Email not configured. Dev accept link: ${result.acceptUrl}`);
      } else {
        setSuccessMessage(`Invitation created for ${result.email}.`);
      }
    },
    onError: (err) =>
      setFormError(getApiErrorMessage(err, "Failed to send invitation. Check the email is unique.")),
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

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-affecio-border bg-affecio-surface px-4 py-3 text-sm text-affecio-text">
          {successMessage}
        </div>
      ) : null}

      <ContentPanel showToolbar={false} showPagination={false}>
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ApiErrorMessage message={error instanceof Error ? error.message : "Failed to load admins"} />
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
                      cell: (a) => formatDateTime(a.expiresAt),
                    },
                    {
                      key: "invitedBy",
                      header: "Invited by",
                      cell: (a) => a.invitedBy.name,
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
    </div>
  );
}
