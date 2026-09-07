import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ModerationPage() {
  return (
    <div>
      <PageHeader title="Moderation" description="Review flagged media and profiles." />
      <EmptyState title="No flags" description="Moderation flags will appear here." />
    </div>
  );
}
