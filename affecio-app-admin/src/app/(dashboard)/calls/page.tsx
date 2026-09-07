import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CallsPage() {
  return (
    <div>
      <PageHeader title="Calls" description="Review call sessions and incidents." />
      <EmptyState title="No call data" description="Call monitoring will appear here." />
    </div>
  );
}
