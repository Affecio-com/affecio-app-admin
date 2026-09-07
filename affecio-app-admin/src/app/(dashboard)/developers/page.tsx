import { PageHeader } from "@/components/layout/PageHeader";
import { AffecioMenuList, AffecioMenuRow } from "@/components/affecio/AffecioMenuRow";

export default function DevelopersPage() {
  return (
    <div>
      <PageHeader title="Developers" description="Health checks, feature flags, and service logs." />
      <AffecioMenuList>
        <AffecioMenuRow
          href="/developers/feature-flags"
          label="Feature flags"
          description="Toggle platform features"
        />
        <AffecioMenuRow
          href="/developers/service-health"
          label="Service health"
          description="API and worker status"
        />
        <AffecioMenuRow label="Logs" description="Recent error and audit logs" />
      </AffecioMenuList>
    </div>
  );
}
