"use client";

import { ListPageShell } from "@/components/layout/ListPageShell";
import { RoleGate } from "@/components/layout/RoleGate";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FeatureFlagsPage() {
  return (
    <RoleGate allowedRoles={["super_admin", "developer"]}>
      <ListPageShell
        title="Feature flags"
        description="Platform feature toggles and experiments."
        showPagination={false}
      >
        <EmptyState title="No feature flags" description="Feature flag management coming soon." />
      </ListPageShell>
    </RoleGate>
  );
}
