"use client";

import Link from "next/link";
import { DataListPage } from "@/components/layout/DataListPage";
import { formatDateTime } from "@/lib/format";
import { getMatches } from "@/services/matches";

export default function MatchesPage() {
  return (
    <DataListPage
      title="Matches"
      description="Mutual matches between users on the platform."
      queryKey="matches"
      fetcher={({ page, pageSize }) => getMatches({ page, pageSize })}
      emptyTitle="No matches"
      emptyDescription="Match records will appear here."
      columns={[
        {
          key: "userA",
          header: "User A",
          cell: (m) =>
            m.userA ? (
              <Link href={`/users/${m.userA.id}`} className="hover:underline">
                {m.userA.name}
              </Link>
            ) : (
              m.userAId
            ),
        },
        {
          key: "userB",
          header: "User B",
          cell: (m) =>
            m.userB ? (
              <Link href={`/users/${m.userB.id}`} className="hover:underline">
                {m.userB.name}
              </Link>
            ) : (
              m.userBId
            ),
        },
        {
          key: "created",
          header: "Matched",
          cell: (m) => formatDateTime(m.createdAt),
        },
      ]}
    />
  );
}
