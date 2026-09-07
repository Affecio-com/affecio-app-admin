import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" description="Notes, account recovery, and support tools." />
      <EmptyState title="Support workspace" description="Support notes and recovery tools will appear here." />
    </div>
  );
}
