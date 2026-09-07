import { PageHeader } from "@/components/layout/PageHeader";
import { AffecioMenuRow } from "@/components/affecio/AffecioMenuRow";

export default function DevelopersPage() {
  return (
    <div>
      <PageHeader title="Developers" description="Health checks, flags, and logs." />
      <div className="space-y-3">
        <AffecioMenuRow href="/developers/feature-flags" label="Feature flags" description="Toggle platform features" />
        <AffecioMenuRow label="Service health" description="API and worker status" />
        <AffecioMenuRow label="Logs" description="Recent error and audit logs" />
      </div>
    </div>
  );
}
