"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-affecio-border bg-affecio-surface text-affecio-muted transition-colors hover:bg-affecio-input hover:text-affecio-text",
        showLabel ? "px-3" : "w-9",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel ? (
        <span className="text-sm font-medium text-affecio-text">{isDark ? "Light" : "Dark"}</span>
      ) : null}
    </button>
  );
}
