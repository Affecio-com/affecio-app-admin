import type { VerificationItem } from "@/services/verifications";
import { formatDateTime } from "@/lib/format";

interface MediaReviewViewerProps {
  item: VerificationItem;
}

export function MediaReviewViewer({ item }: MediaReviewViewerProps) {
  return (
    <div className="rounded-lg border border-affecio-border bg-affecio-surface p-5">
      <div className="aspect-video overflow-hidden rounded-lg bg-black/40">
        {item.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mediaUrl} alt="Verification media" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-affecio-muted">
            Preview unavailable
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-affecio-muted">Submitted {formatDateTime(item.submittedAt)}</p>
    </div>
  );
}
