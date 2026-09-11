"use client";

import { useState } from "react";
import { DataListPage } from "@/components/layout/DataListPage";
import { RoleGate } from "@/components/layout/RoleGate";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { AppUserCell } from "@/components/users/AppUserCell";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import {
  StatusPill,
  accountStatusTone,
  activityStatusTone,
  verificationStatusTone,
} from "@/components/shared/StatusPill";
import { getUsers } from "@/services/users";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { hasRole, profileEditRoles, userLookupRoles } from "@/config/access";

function tabToFilter(tab: string): { accountStatus?: string; hasOpenReports?: boolean } {
  switch (tab) {
    case "Active":
      return { accountStatus: "active" };
    case "Warned":
      return { accountStatus: "warned" };
    case "Restricted":
      return { accountStatus: "restricted" };
    case "Shadowbanned":
      return { accountStatus: "shadowbanned" };
    case "Suspended":
      return { accountStatus: "suspended" };
    case "Banned":
      return { accountStatus: "banned" };
    case "Reported":
      return { hasOpenReports: true };
    default:
      return {};
  }
}

export default function UsersPage() {
  const { admin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = hasRole(admin?.role, profileEditRoles);

  return (
    <RoleGate allowedRoles={userLookupRoles}>
      <DataListPage
        title="Members"
        description="Member lookup for Trust & Safety, support, and engineering. Search by name, email, phone, or ID."
        action={
          canCreate ? (
            <AffecioButton onClick={() => setCreateOpen(true)}>+ Create user</AffecioButton>
          ) : undefined
        }
        queryKey="users"
        tabs={[
          "All",
          "Active",
          "Warned",
          "Restricted",
          "Shadowbanned",
          "Suspended",
          "Banned",
          "Reported",
        ]}
        statusFromTab={(tab) => tab}
        fetcher={({ page, pageSize, search, status }) => {
          const filter = tabToFilter(status ?? "All");
          return getUsers({
            page,
            pageSize,
            search,
            accountStatus: filter.accountStatus,
            hasOpenReports: filter.hasOpenReports,
          });
        }}
        searchPlaceholder="Search by name, email, or phone..."
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        columns={[
          {
            key: "name",
            header: "User",
            cell: (user) => <AppUserCell user={user} subtitle />,
          },
          {
            key: "contact",
            header: "Contact",
            cell: (user) => (
              <div>
                <div className="text-sm">{user.email ?? "—"}</div>
                <div className="text-xs text-affecio-muted">{user.phoneNumber}</div>
              </div>
            ),
          },
          {
            key: "account",
            header: "Account",
            cell: (user) => (
              <StatusPill label={user.accountStatus} tone={accountStatusTone(user.accountStatus)} />
            ),
          },
          {
            key: "activity",
            header: "Activity",
            cell: (user) => (
              <StatusPill label={user.activityStatus} tone={activityStatusTone(user.activityStatus)} />
            ),
          },
          {
            key: "verification",
            header: "Verified",
            cell: (user) => (
              <StatusPill
                label={user.verificationStatus}
                tone={verificationStatusTone(user.verificationStatus)}
              />
            ),
          },
          {
            key: "reports",
            header: "Reports",
            cell: (user) =>
              user.openReportsCount > 0 ? (
                <StatusPill label={`${user.openReportsCount} open`} tone="warning" />
              ) : user.reportsCount > 0 ? (
                <span className="text-sm text-affecio-muted">{user.reportsCount} total</span>
              ) : (
                <span className="text-sm text-affecio-muted">—</span>
              ),
          },
          {
            key: "profile",
            header: "Profile",
            cell: (user) => (
              <div className="text-sm">
                <span>{user.profileCompleteness}%</span>
                <span className="ml-2 text-xs text-affecio-muted">{user.mediaCount} media</span>
              </div>
            ),
          },
          {
            key: "joined",
            header: "Joined",
            cell: (user) => formatDate(user.createdAt),
          },
        ]}
      />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </RoleGate>
  );
}
