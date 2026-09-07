import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminsSettingsPage() {
  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <div>
        <PageHeader title="Admin management" description="Super Admin only — manage admin accounts." />
        <EmptyState title="No admins loaded" description="Admin accounts will appear here." />
      </div>
    </RoleGate>
  );
}
