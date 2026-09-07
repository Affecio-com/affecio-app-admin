import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <PageHeader title="User detail" description={`Viewing user ${id}`} />
      <EmptyState title="User timeline" description="User activity timeline will appear here." />
    </div>
  );
}
