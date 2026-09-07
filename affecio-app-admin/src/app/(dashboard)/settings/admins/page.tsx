"use client";

import { useQuery } from "@tanstack/react-query";
import { RoleGate } from "@/components/layout/RoleGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getAdminUsers } from "@/services/adminUsers";

export default function AdminManagementPage() {
  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <AdminUsersContent />
    </RoleGate>
  );
}

function AdminUsersContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  return (
    <div>
      <PageHeader
        title="Admin management"
        description="Manage admin accounts and access roles."
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
          <EmptyState title="No admins" description="Run db:seed to create initial admin accounts." />
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
                cell: (a) => (a.mfaEnabled ? "Enabled" : "Off"),
              },
              {
                key: "lastLogin",
                header: "Last login",
                cell: (a) => (a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"),
              },
            ]}
          />
        )}
      </ContentPanel>
    </div>
  );
}
