import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function BlocksPage() {
  return (
    <div>
      <PageHeader title="Blocks" description="View user blocks and restrictions." />
      <EmptyState title="No blocks" description="Block records will appear here." />
    </div>
  );
}
