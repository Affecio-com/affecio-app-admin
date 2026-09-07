import { Badge } from "@/components/ui/badge";

type UserStatus = "active" | "suspended" | "banned" | "pending";

const labels: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  pending: "Pending",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const variant =
    status === "active" ? "success" : status === "banned" ? "destructive" : "secondary";
  return <Badge variant={variant}>{labels[status]}</Badge>;
}
