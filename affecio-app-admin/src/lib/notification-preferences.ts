export interface NotificationPreferences {
  emailReports: boolean;
  emailVerifications: boolean;
  emailSecurity: boolean;
  browserAlerts: boolean;
}

const STORAGE_KEY = "affecio_admin_notification_prefs";

export const defaultNotificationPreferences: NotificationPreferences = {
  emailReports: true,
  emailVerifications: true,
  emailSecurity: true,
  browserAlerts: false,
};

export function loadNotificationPreferences(adminId: string): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${adminId}`);
    if (!raw) return defaultNotificationPreferences;
    return { ...defaultNotificationPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(
  adminId: string,
  prefs: NotificationPreferences,
): void {
  localStorage.setItem(`${STORAGE_KEY}:${adminId}`, JSON.stringify(prefs));
}
