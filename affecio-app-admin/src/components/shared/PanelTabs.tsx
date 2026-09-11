"use client";

import { cn } from "@/lib/utils";

interface PanelTabsProps {
  tabs: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function PanelTabs({ tabs, activeTab = tabs[0], onTabChange, className }: PanelTabsProps) {
  return (
    <div className={cn("flex gap-1 border-b border-affecio-border px-5 pt-2", className)}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange?.(tab)}
            className={cn(
              "px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-b-2 border-affecio-text font-medium text-affecio-text"
                : "text-affecio-muted hover:text-affecio-text",
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
