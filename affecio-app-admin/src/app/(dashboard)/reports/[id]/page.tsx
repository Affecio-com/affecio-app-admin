import { PageHeader } from "@/components/layout/PageHeader";
import { ReportActionBar } from "@/components/reports/ReportActionBar";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <PageHeader title="Report detail" description={`Report ${id}`} action={<ReportActionBar />} />
      <EmptyState title="Report details" description="Report context and history will appear here." />
    </div>
  );
}
