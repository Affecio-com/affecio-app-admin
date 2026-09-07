import type { LucideIcon } from "lucide-react";
import {
  Ban,
  BarChart3,
  BadgeCheck,
  Code2,
  Flag,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  Phone,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { AdminRole } from "@/types/admin";

export type NavSection = "main" | "operations" | "general";

export interface NavItem {
  label: string;
  href: string;
  roles: AdminRole[];
  icon: LucideIcon;
  section: NavSection;
}

export const navSectionLabels: Record<NavSection, string> = {
  main: "Main menu",
  operations: "Trust & safety",
  general: "General",
};

export const navSectionOrder: NavSection[] = ["main", "operations", "general"];

export const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    roles: ["super_admin", "admin", "moderator", "support", "developer"],
    icon: LayoutDashboard,
    section: "main",
  },
  {
    label: "Users",
    href: "/users",
    roles: ["super_admin", "admin", "moderator", "support"],
    icon: Users,
    section: "main",
  },
  {
    label: "Verifications",
    href: "/verifications",
    roles: ["super_admin", "admin", "moderator"],
    icon: BadgeCheck,
    section: "main",
  },
  {
    label: "Reports",
    href: "/reports",
    roles: ["super_admin", "admin", "moderator"],
    icon: Flag,
    section: "main",
  },
  {
    label: "Moderation",
    href: "/moderation",
    roles: ["super_admin", "admin", "moderator"],
    icon: Shield,
    section: "operations",
  },
  {
    label: "Matches",
    href: "/matches",
    roles: ["super_admin", "admin", "moderator"],
    icon: Heart,
    section: "operations",
  },
  {
    label: "Calls",
    href: "/calls",
    roles: ["super_admin", "admin", "moderator"],
    icon: Phone,
    section: "operations",
  },
  {
    label: "Blocks",
    href: "/blocks",
    roles: ["super_admin", "admin", "moderator", "support"],
    icon: Ban,
    section: "operations",
  },
  {
    label: "Support",
    href: "/support",
    roles: ["super_admin", "admin", "support"],
    icon: LifeBuoy,
    section: "general",
  },
  {
    label: "Analytics",
    href: "/analytics",
    roles: ["super_admin", "admin", "developer"],
    icon: BarChart3,
    section: "general",
  },
  {
    label: "Developers",
    href: "/developers",
    roles: ["super_admin", "developer"],
    icon: Code2,
    section: "general",
  },
  {
    label: "Audit logs",
    href: "/audit-logs",
    roles: ["super_admin", "admin"],
    icon: ScrollText,
    section: "general",
  },
  {
    label: "Settings",
    href: "/settings",
    roles: ["super_admin", "admin"],
    icon: Settings,
    section: "general",
  },
];

export function getNavForRole(role: AdminRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export function getNavGroupsForRole(role: AdminRole): { section: NavSection; label: string; items: NavItem[] }[] {
  const items = getNavForRole(role);
  return navSectionOrder
    .map((section) => ({
      section,
      label: navSectionLabels[section],
      items: items.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
}
