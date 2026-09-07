import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ mediaId: string }>;
}) {
  const { mediaId } = await params;

  return (
    <div>
      <PageHeader title="Verification review" description={`Media ${mediaId}`} />
      <EmptyState title="Media review" description="Media viewer and actions will appear here." />
    </div>
  );
}
