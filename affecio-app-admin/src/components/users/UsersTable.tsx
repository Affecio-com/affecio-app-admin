"use client";

import { DataTable } from "@/components/shared/DataTable";
import { AppUserCell } from "@/components/users/AppUserCell";
import type { AppUser } from "@/types/user";
import { formatDate } from "@/lib/format";

interface UsersTableProps {
  users: AppUser[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <DataTable
      data={users}
      columns={[
        {
          key: "name",
          header: "Name",
          cell: (user) => <AppUserCell user={user} subtitle />,
        },
        {
          key: "contact",
          header: "Contact",
          cell: (user) => (
            <div>
              <div>{user.email ?? "—"}</div>
              <div className="text-xs text-affecio-muted">{user.phoneNumber}</div>
            </div>
          ),
        },
        { key: "gender", header: "Gender", cell: (user) => user.gender },
        {
          key: "created",
          header: "Joined",
          cell: (user) => formatDate(user.createdAt),
        },
      ]}
    />
  );
}
