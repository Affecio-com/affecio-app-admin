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
import { createAdminUser, getAdminUsers } from "@/services/adminUsers";
import { isStrongPassword, STRONG_PASSWORD_HINT } from "@/lib/password-policy";
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
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as AdminRole,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "admin" });
      setFormError("");
    },
    onError: () => setFormError("Failed to create admin. Check the email is unique."),
  });

  return (
    <div>
      <PageHeader
        title="Admin management"
        description="Create and review admin accounts."
        action={
          <div className="flex items-center gap-3">
            <SettingsBackLink />
            <AffecioButton onClick={() => setDialogOpen(true)}>+ Add admin</AffecioButton>
          </div>
        }
      />

      <ContentPanel showToolbar={false} showPagination={false}>
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ApiErrorMessage message={error instanceof Error ? error.message : "Failed to load admins"} />
          </div>
        ) : !data?.length ? (
          <EmptyState title="No admins" description="Run db:seed or create the first admin account." />
        ) : (
          <DataTable
            data={data}
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
        )}
      </ContentPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add admin</DialogTitle>
            <DialogDescription>
              Create a new admin account. Temporary password: {STRONG_PASSWORD_HINT}
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <ApiErrorMessage message={formError} />
          ) : null}
          <div className="space-y-3 py-2">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Temporary password (12+ chars, mixed case, number, symbol)"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
              disabled={
                createMutation.isPending ||
                !form.name ||
                !form.email ||
                form.password.length < 12 ||
                !isStrongPassword(form.password)
              }
              onClick={() => createMutation.mutate(form)}
            >
              Create admin
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
