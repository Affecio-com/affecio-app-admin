import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Review user and content reports." />
      <EmptyState title="No reports" description="Reports from the API will appear here." />
    </div>
  );
}
