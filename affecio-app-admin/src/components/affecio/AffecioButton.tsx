import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AffecioButtonVariant = "primary" | "secondary" | "danger" | "default";

interface AffecioButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: AffecioButtonVariant;
}

export function AffecioButton({
  className,
  variant = "primary",
  ...props
}: AffecioButtonProps) {
  const uiVariant =
    variant === "danger" ? "destructive" : variant === "secondary" ? "secondary" : "default";

  return (
    <Button
      variant={uiVariant}
      className={cn(
        "rounded-lg font-medium",
        variant === "primary" &&
          "bg-affecio-text text-affecio-bg hover:opacity-90 focus-visible:ring-affecio-text",
        variant === "secondary" &&
          "border border-affecio-border bg-affecio-surface text-affecio-text hover:bg-affecio-input",
        variant === "danger" &&
          "bg-affecio-danger text-white hover:opacity-90 dark:text-affecio-bg",
        className,
      )}
      {...props}
    />
  );
}
