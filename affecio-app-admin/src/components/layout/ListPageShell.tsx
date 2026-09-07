"use client";

import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentPanel } from "@/components/shared/ContentPanel";

interface ListPageShellProps {
  title: string;
  description: string;
  action?: ReactNode;
  tabs?: string[];
  searchPlaceholder?: string;
  showToolbar?: boolean;
  showPagination?: boolean;
  children: ReactNode;
}

export function ListPageShell({
  title,
  description,
  action,
  tabs = ["All"],
  searchPlaceholder = "Search...",
  showToolbar = true,
  showPagination = true,
  children,
}: ListPageShellProps) {
  const [search, setSearch] = useState("");

  return (
    <div>
      <PageHeader title={title} description={description} action={action} />
      <ContentPanel
        tabs={tabs}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        showToolbar={showToolbar}
        showPagination={showPagination}
        total={0}
      >
        {children}
      </ContentPanel>
    </div>
  );
}
