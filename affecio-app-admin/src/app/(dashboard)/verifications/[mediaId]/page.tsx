"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getVerification, reviewVerification } from "@/services/verifications";

export default function VerificationReviewPage({ params }: { params: { mediaId: string } }) {
  const { mediaId } = params;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verification", mediaId],
    queryFn: () => getVerification(mediaId),
  });

  const reviewMutation = useMutation({
    mutationFn: (status: "approved" | "rejected") => reviewVerification(mediaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      queryClient.invalidateQueries({ queryKey: ["verification", mediaId] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Verification review"
        description={data ? `Submitted ${formatDateTime(data.submittedAt)}` : `Review ${mediaId}`}
        action={
          <Link href="/verifications" className="text-sm text-affecio-muted hover:text-affecio-text">
            ← Back to queue
          </Link>
        }
      />

      {isLoading ? (
        <AffecioCard>
          <TableSkeleton />
        </AffecioCard>
      ) : isError ? (
        <AffecioCard>
          <ApiErrorMessage message={error instanceof Error ? error.message : "Failed to load verification"} />
        </AffecioCard>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AffecioCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mondwest text-lg font-semibold">Details</h2>
              <StatusPill label={data.status} />
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">User ID</dt>
                <dd className="font-mono text-xs">{data.userId}</dd>
              </div>
              <div className="flex justify-between border-b border-affecio-border pb-3">
                <dt className="text-affecio-muted">Media key</dt>
                <dd className="max-w-[200px] truncate font-mono text-xs">{data.mediaKey}</dd>
              </div>
            </dl>
            {data.status === "pending" ? (
              <div className="mt-6 flex gap-3">
                <AffecioButton
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate("approved")}
                >
                  Approve
                </AffecioButton>
                <AffecioButton
                  variant="danger"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate("rejected")}
                >
                  Reject
                </AffecioButton>
              </div>
            ) : null}
          </AffecioCard>

          <AffecioCard>
            <h2 className="font-mondwest text-lg font-semibold">Media preview</h2>
            {data.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.mediaUrl}
                alt="Verification media"
                className="mt-4 max-h-[420px] w-full rounded-lg border border-affecio-border object-contain"
              />
            ) : (
              <p className="mt-4 text-sm text-affecio-muted">
                Media preview unavailable. Configure R2 credentials in the API to view files.
              </p>
            )}
          </AffecioCard>
        </div>
      ) : null}
    </div>
  );
}
