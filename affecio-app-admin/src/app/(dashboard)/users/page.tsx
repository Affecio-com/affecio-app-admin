"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  useDebounce(search, 300);

  return (
    <div>
      <PageHeader title="Users" description="Search and manage app users." />
      <div className="mb-6 max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      </div>
      <EmptyState title="No users loaded" description="Connect the API to populate the users table." />
    </div>
  );
}
