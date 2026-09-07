"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { AffecioMenuList, AffecioMenuRow } from "@/components/affecio/AffecioMenuRow";
import { SettingsProfileCard } from "@/components/settings/SettingsSections";
import { useAuth } from "@/providers/AuthProvider";
import { Bell, Shield, User, Users } from "lucide-react";

export default function SettingsPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your account, security, and workspace preferences." />
      <SettingsProfileCard />
      <AffecioMenuList>
        <AffecioMenuRow
          href="/settings/profile"
          label="Profile"
          description="Display name and account details"
          icon={<User className="h-4 w-4" />}
        />
        <AffecioMenuRow
          href="/settings/security"
          label="Security"
          description="Password and two-factor authentication"
          icon={<Shield className="h-4 w-4" />}
        />
        <AffecioMenuRow
          href="/settings/notifications"
          label="Notifications"
          description="Email and in-app alert preferences"
          icon={<Bell className="h-4 w-4" />}
        />
        {isSuperAdmin ? (
          <AffecioMenuRow
            href="/settings/admins"
            label="Admins"
            description="Manage admin accounts and roles"
            icon={<Users className="h-4 w-4" />}
          />
        ) : null}
      </AffecioMenuList>
    </div>
  );
}
