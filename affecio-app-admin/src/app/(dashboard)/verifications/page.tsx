import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function VerificationsPage() {
  return (
    <div>
      <PageHeader title="Verifications" description="Review pending identity verifications." />
      <EmptyState title="Queue empty" description="No verification items in the review queue." />
    </div>
  );
}
