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
        "rounded-full font-medium",
        variant === "primary" &&
          "bg-affecio-text text-black hover:bg-white/90 focus-visible:ring-affecio-accent",
        variant === "secondary" &&
          "border border-affecio-text/30 bg-transparent text-affecio-text hover:bg-white/10",
        variant === "danger" &&
          "bg-affecio-danger text-affecio-text hover:bg-affecio-danger/90",
        className,
      )}
      {...props}
    />
  );
}
