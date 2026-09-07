import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit logs" description="Track admin actions across the platform." />
      <EmptyState title="No audit entries" description="Audit log entries will appear here." />
    </div>
  );
}
