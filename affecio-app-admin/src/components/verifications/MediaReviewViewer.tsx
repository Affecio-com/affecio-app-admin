import type { VerificationItem } from "@/services/verifications";

interface MediaReviewViewerProps {
  item: VerificationItem;
}

export function MediaReviewViewer({ item }: MediaReviewViewerProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="aspect-video overflow-hidden rounded-lg bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.mediaUrl} alt="Verification media" className="h-full w-full object-contain" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Submitted {new Date(item.submittedAt).toLocaleString()}</p>
    </div>
  );
}
