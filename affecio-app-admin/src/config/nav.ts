import type { AdminRole } from "@/types/admin";

export interface NavItem {
  label: string;
  href: string;
  roles: AdminRole[];
}

export const navItems: NavItem[] = [
  { label: "Overview", href: "/", roles: ["super_admin", "admin", "moderator", "support", "developer"] },
  { label: "Users", href: "/users", roles: ["super_admin", "admin", "moderator", "support"] },
  { label: "Verifications", href: "/verifications", roles: ["super_admin", "admin", "moderator"] },
  { label: "Reports", href: "/reports", roles: ["super_admin", "admin", "moderator"] },
  { label: "Moderation", href: "/moderation", roles: ["super_admin", "admin", "moderator"] },
  { label: "Matches", href: "/matches", roles: ["super_admin", "admin", "moderator"] },
  { label: "Calls", href: "/calls", roles: ["super_admin", "admin", "moderator"] },
  { label: "Blocks", href: "/blocks", roles: ["super_admin", "admin", "moderator", "support"] },
  { label: "Support", href: "/support", roles: ["super_admin", "admin", "support"] },
  { label: "Analytics", href: "/analytics", roles: ["super_admin", "admin", "developer"] },
  { label: "Developers", href: "/developers", roles: ["super_admin", "developer"] },
  { label: "Audit Logs", href: "/audit-logs", roles: ["super_admin", "admin"] },
  { label: "Settings", href: "/settings", roles: ["super_admin", "admin"] },
];

export function getNavForRole(role: AdminRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
