import { navItems } from "@/config/nav";

const detailTitles: Record<string, string> = {
  admins: "Admin management",
  "feature-flags": "Feature flags",
  "service-health": "Service health",
  profile: "Profile",
  security: "Security",
  playbook: "Support playbook",
  escalations: "Escalations",
  "push-notifications": "Push notifications",
};

export function getPageTitleFromPath(pathname: string): string {
  if (pathname === "/") return "Overview";

  const segments = pathname.split("/").filter(Boolean);
  const base = `/${segments[0]}`;

  const navMatch = navItems.find((item) => item.href === base);
  if (navMatch) {
    if (segments.length === 1) return navMatch.label;
    const detailKey = segments[segments.length - 1];
    if (detailTitles[detailKey]) return detailTitles[detailKey];
    if (segments[0] === "users") return "User detail";
    if (segments[0] === "reports") return "Report detail";
    if (segments[0] === "verifications") return "Verification review";
    if (segments[0] === "support") return "Ticket";
    return navMatch.label;
  }

  return "Dashboard";
}
