import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/types/user";

const statusVariant: Record<UserStatus, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  pending: "warning",
  suspended: "warning",
  banned: "destructive",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}
