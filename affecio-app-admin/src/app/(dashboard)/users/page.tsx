"use client";

import Link from "next/link";
import { useState } from "react";
import { DataListPage } from "@/components/layout/DataListPage";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
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

function tabToFilter(tab: string): { accountStatus?: string; hasOpenReports?: boolean } {
  switch (tab) {
    case "Active":
      return { accountStatus: "active" };
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
  const canCreate = admin && ["super_admin", "admin", "moderator"].includes(admin.role);

  return (
    <>
      <DataListPage
        title="Users"
        description="Search, create, and manage registered app users."
        action={
          canCreate ? (
            <AffecioButton onClick={() => setCreateOpen(true)}>+ Create user</AffecioButton>
          ) : undefined
        }
        queryKey="users"
        tabs={["All", "Active", "Suspended", "Banned", "Reported"]}
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
            header: "Name",
            cell: (user) => (
              <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                {user.name}
              </Link>
            ),
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
    </>
  );
}
