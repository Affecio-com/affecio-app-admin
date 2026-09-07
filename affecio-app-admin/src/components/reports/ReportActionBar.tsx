import { AffecioButton } from "@/components/affecio/AffecioButton";

interface ReportActionBarProps {
  onResolve?: () => void;
  onDismiss?: () => void;
}

export function ReportActionBar({ onResolve, onDismiss }: ReportActionBarProps) {
  return (
    <div className="flex gap-3">
      <AffecioButton onClick={onResolve}>Resolve</AffecioButton>
      <AffecioButton variant="secondary" onClick={onDismiss}>
        Dismiss
      </AffecioButton>
    </div>
  );
}
