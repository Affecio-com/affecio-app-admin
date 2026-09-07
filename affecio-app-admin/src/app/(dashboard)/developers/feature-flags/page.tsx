import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FeatureFlagsPage() {
  return (
    <div>
      <PageHeader title="Feature flags" description="Manage rollout flags across the platform." />
      <EmptyState title="No flags configured" description="Feature flags from the API will appear here." />
    </div>
  );
}
