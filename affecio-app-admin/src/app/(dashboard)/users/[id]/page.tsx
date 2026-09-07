"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDate } from "@/lib/format";
import { getUser } from "@/services/users";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
  });

  return (
    <div>
      <PageHeader
        title={user?.name ?? "User detail"}
        description={user ? `${user.email ?? user.phoneNumber} · Joined ${formatDate(user.createdAt)}` : `User ${id}`}
        action={
          user ? (
            <Link
              href="/users"
              className="text-sm text-affecio-muted transition-colors hover:text-affecio-text"
            >
              ← Back to users
            </Link>
          ) : null
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
        <div className="grid gap-6 lg:grid-cols-2">
          <AffecioCard>
            <h2 className="font-mondwest text-lg font-semibold">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">Email</dt>
                <dd>{user.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">Phone</dt>
                <dd>{user.phoneNumber}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">Gender</dt>
                <dd>{user.gender}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-affecio-muted">About</dt>
                <dd className="max-w-xs text-right">{user.aboutMe ?? "—"}</dd>
              </div>
            </dl>
          </AffecioCard>

          <AffecioCard>
            <h2 className="font-mondwest text-lg font-semibold">Media</h2>
            {user.UserMedia?.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {user.UserMedia.map((media) => (
                  <li
                    key={media.id}
                    className="flex items-center justify-between border-b border-affecio-border py-2 last:border-0"
                  >
                    <span className="capitalize">{media.kind.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="text-affecio-muted">{media.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-affecio-muted">No media uploaded.</p>
            )}
          </AffecioCard>
        </div>
      ) : null}
    </div>
  );
}
