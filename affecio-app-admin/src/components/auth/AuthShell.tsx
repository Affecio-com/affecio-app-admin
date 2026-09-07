import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-affecio-bg px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex w-full max-w-[960px] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-affecio-border bg-affecio-surface shadow-[0_24px_80px_rgba(0,0,0,0.55)] lg:flex-row lg:min-h-[580px]">
        <AuthBrandingPanel />
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="mb-8 space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-affecio-text sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-affecio-muted sm:text-base">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
