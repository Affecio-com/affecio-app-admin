import { Filter } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";

interface PanelToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showFilter?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function PanelToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showFilter = false,
  actions,
  className,
}: PanelToolbarProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-affecio-border px-4 py-3", className)}>
      {onSearchChange ? (
        <SearchInput
          value={searchValue ?? ""}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="max-w-xs"
          variant="panel"
        />
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2">
        {showFilter ? (
          <Button variant="secondary" size="sm" className="h-8 rounded-lg border-affecio-border bg-transparent text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
