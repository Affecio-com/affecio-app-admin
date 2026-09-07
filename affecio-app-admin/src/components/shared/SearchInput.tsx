import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "panel";
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  variant = "default",
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-affecio-muted" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 pl-9",
          variant === "panel" && "rounded-xl border-affecio-border bg-affecio-input",
        )}
      />
    </div>
  );
}
