"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserDetailView } from "@/components/users/UserDetailView";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDate } from "@/lib/format";
import { getUser } from "@/services/users";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
  });

  return (
    <div>
      <PageHeader
        title={user?.name ?? "User detail"}
        description={
          user
            ? `${user.email ?? user.phoneNumber} · Joined ${formatDate(user.createdAt)} · ID ${user.id}`
            : `Loading user ${id}…`
        }
        action={
          <Link
            href="/users"
            className="text-sm text-affecio-muted transition-colors hover:text-affecio-text"
          >
            ← Back to users
          </Link>
        }
      />

      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage message={error instanceof Error ? error.message : "Failed to load user"} />
        </AffecioCard>
      ) : user ? (
        <UserDetailView user={user} />
      ) : null}
    </div>
  );
}
