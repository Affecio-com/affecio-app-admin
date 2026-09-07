import { PageHeader } from "@/components/layout/PageHeader";
import { AffecioMenuList, AffecioMenuRow } from "@/components/affecio/AffecioMenuRow";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Admin workspace configuration and preferences." />
      <AffecioMenuList>
        <AffecioMenuRow href="/settings/admins" label="Admins" description="Manage admin accounts and roles" />
        <AffecioMenuRow label="Notifications" description="Alert preferences" />
        <AffecioMenuRow label="Security" description="Session and MFA settings" />
      </AffecioMenuList>
    </div>
  );
}
