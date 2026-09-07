"use client";

import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import type { AppUser } from "@/types/user";

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
          header: "User",
          cell: (user) => (
            <Link href={`/users/${user.id}`} className="font-medium hover:underline">
              {user.displayName}
            </Link>
          ),
        },
        { key: "email", header: "Email", cell: (user) => user.email },
        {
          key: "status",
          header: "Status",
          cell: (user) => <UserStatusBadge status={user.status} />,
        },
        {
          key: "created",
          header: "Joined",
          cell: (user) => new Date(user.createdAt).toLocaleDateString(),
        },
      ]}
    />
  );
}
