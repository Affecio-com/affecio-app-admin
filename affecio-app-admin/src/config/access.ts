import type { AdminRole } from "@/types/admin";

export const userLookupRoles: AdminRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "support",
  "developer",
];

export const profileEditRoles: AdminRole[] = ["super_admin", "admin", "moderator"];
export const enforceRoles: AdminRole[] = ["super_admin", "admin", "moderator"];
export const userDeleteRoles: AdminRole[] = ["super_admin", "admin"];
export const caseNoteRoles: AdminRole[] = ["super_admin", "admin", "moderator", "support"];
export const trustReadRoles: AdminRole[] = ["super_admin", "admin", "moderator", "support"];
export const trustWriteRoles: AdminRole[] = ["super_admin", "admin", "moderator"];
export const memberOpsRoles: AdminRole[] = ["super_admin", "admin", "moderator", "support"];

export function hasRole(role: AdminRole | undefined, allowed: AdminRole[]) {
  return Boolean(role && allowed.includes(role));
}
