"use client";

import { useEffect, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  SettingsBackLink,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/settings/SettingsSections";
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences";
import { useAuth } from "@/providers/AuthProvider";

export default function NotificationSettingsPage() {
  const { admin } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (admin?.id) {
      setPrefs(loadNotificationPreferences(admin.id));
    }
  }, [admin?.id]);

  function updatePref<K extends keyof NotificationPreferences>(key: K, value: boolean) {
    setPrefs((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    if (!admin?.id) return;
    saveNotificationPreferences(admin.id, prefs);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        description="Choose which alerts you receive. Preferences are saved in this browser."
        action={<SettingsBackLink />}
      />

      <SettingsSection title="Email alerts">
        <SettingsToggleRow
          label="New reports"
          description="Email when a high-priority report is opened."
          checked={prefs.emailReports}
          onChange={(v) => updatePref("emailReports", v)}
        />
        <SettingsToggleRow
          label="Verification queue"
          description="Daily summary of pending verifications."
          checked={prefs.emailVerifications}
          onChange={(v) => updatePref("emailVerifications", v)}
        />
        <SettingsToggleRow
          label="Security events"
          description="Login from new devices and MFA changes."
          checked={prefs.emailSecurity}
          onChange={(v) => updatePref("emailSecurity", v)}
        />
      </SettingsSection>

      <div className="mt-6">
        <SettingsSection title="In-app">
          <SettingsToggleRow
            label="Browser notifications"
            description="Show desktop alerts for urgent moderation items."
            checked={prefs.browserAlerts}
            onChange={(v) => updatePref("browserAlerts", v)}
          />
        </SettingsSection>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <AffecioButton onClick={handleSave}>Save preferences</AffecioButton>
        {saved ? <span className="text-sm text-emerald-400">Saved</span> : null}
      </div>
    </div>
  );
}
