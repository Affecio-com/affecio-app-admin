import { ListPageShell } from "@/components/layout/ListPageShell";
import { EmptyState } from "@/components/shared/EmptyState";

export default function SupportPage() {
  return (
    <ListPageShell
      title="Support"
      description="Customer support tools and account recovery."
      showPagination={false}
    >
      <EmptyState
        title="Support workspace"
        description="Support notes and recovery tools will be available in a future release."
      />
    </ListPageShell>
  );
}
