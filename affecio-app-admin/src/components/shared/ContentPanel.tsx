"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PanelTabs } from "@/components/shared/PanelTabs";
import { PanelToolbar } from "@/components/shared/PanelToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { cn } from "@/lib/utils";

interface ContentPanelProps {
  children: ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showToolbar?: boolean;
  showFilter?: boolean;
  toolbarActions?: ReactNode;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
  className?: string;
}

export function ContentPanel({
  children,
  tabs,
  activeTab,
  onTabChange,
  searchValue: controlledSearch,
  onSearchChange,
  searchPlaceholder,
  showToolbar = true,
  showFilter = false,
  toolbarActions,
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  showPagination = true,
  className,
}: ContentPanelProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalTab, setInternalTab] = useState(tabs?.[0] ?? "All");

  const searchValue = controlledSearch ?? internalSearch;
  const handleSearchChange = onSearchChange ?? setInternalSearch;
  const currentTab = activeTab ?? internalTab;
  const handleTabChange = onTabChange ?? setInternalTab;

  return (
    <AffecioCard padding="none" className={cn("overflow-hidden", className)}>
      {tabs && tabs.length > 0 ? (
        <PanelTabs tabs={tabs} activeTab={currentTab} onTabChange={handleTabChange} />
      ) : null}
      {showToolbar ? (
        <PanelToolbar
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          showFilter={showFilter}
          actions={toolbarActions}
        />
      ) : null}
      <div>{children}</div>
      {showPagination ? (
        <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      ) : null}
    </AffecioCard>
  );
}
