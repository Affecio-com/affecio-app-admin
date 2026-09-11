import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-affecio-bg px-4 py-8 sm:px-6 lg:px-10">
      <div className="absolute right-6 top-6">
        <ThemeToggle showLabel />
      </div>
      <div className="flex w-full max-w-[920px] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-affecio-border bg-affecio-surface shadow-panel lg:flex-row lg:min-h-[560px]">
        <AuthBrandingPanel />
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-affecio-text sm:text-[28px]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-affecio-muted sm:text-[15px]">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
