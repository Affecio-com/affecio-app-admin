import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" description="Platform usage and growth metrics." />
      <EmptyState title="Analytics coming soon" description="Charts and trends will appear here." />
    </div>
  );
}
