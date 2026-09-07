import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { cn } from "@/lib/utils";

interface AffecioMenuRowProps {
  href?: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AffecioMenuRow({
  href,
  label,
  description,
  icon,
  trailing,
  onClick,
  className,
}: AffecioMenuRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        {icon ? <span className="text-affecio-muted">{icon}</span> : null}
        <div>
          <div className="font-medium text-affecio-text">{label}</div>
          {description ? <div className="text-sm text-affecio-muted">{description}</div> : null}
        </div>
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 text-affecio-muted" />}
    </>
  );

  const classes = cn(
    "flex items-center justify-between px-5 py-4 transition-colors hover:bg-affecio-input",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(classes, "w-full text-left")}>
      {content}
    </button>
  );
}

interface AffecioMenuListProps {
  children: ReactNode;
  className?: string;
}

export function AffecioMenuList({ children, className }: AffecioMenuListProps) {
  return (
    <AffecioCard padding="none" className={cn("divide-y divide-affecio-divider overflow-hidden", className)}>
      {children}
    </AffecioCard>
  );
}
