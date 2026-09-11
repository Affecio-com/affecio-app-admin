"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { AffecioMenuList, AffecioMenuRow } from "@/components/affecio/AffecioMenuRow";

export default function DevelopersPage() {
  return (
    <RoleGate allowedRoles={["super_admin", "developer"]}>
      <div>
        <PageHeader
          title="Developers"
          description="Flags, logs, and engineering tools. Service health is available to every role."
        />
        <AffecioMenuList>
          <AffecioMenuRow
            href="/support/escalations"
            label="Support escalations"
            description="Tickets support sent to engineering"
          />
          <AffecioMenuRow
            href="/developers/feature-flags"
            label="Feature flags"
            description="Toggle platform features"
          />
          <AffecioMenuRow
            href="/developers/service-health"
            label="Service health"
            description="Publish live status for the whole team (and the future public page)"
          />
          <AffecioMenuRow label="Logs" description="Recent error and audit logs" />
        </AffecioMenuList>
      </div>
    </RoleGate>
  );
}
