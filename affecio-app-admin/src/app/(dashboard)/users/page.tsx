"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { StatusPill } from "@/components/shared/StatusPill";
import { getUsers } from "@/services/users";
import { formatDate } from "@/lib/format";

export default function UsersPage() {
  return (
    <DataListPage
      title="Users"
      description="Search and manage registered app users."
      queryKey="users"
      fetcher={({ page, pageSize, search }) => getUsers({ page, pageSize, search })}
      searchPlaceholder="Search by name, email, or phone..."
      emptyTitle="No users found"
      emptyDescription="Try adjusting your search or check that the API is connected."
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
        { key: "gender", header: "Gender", cell: (user) => user.gender },
        {
          key: "joined",
          header: "Joined",
          cell: (user) => formatDate(user.createdAt),
        },
      ]}
    />
  );
}
