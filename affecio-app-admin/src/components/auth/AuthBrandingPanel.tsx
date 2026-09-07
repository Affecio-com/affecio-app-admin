import Image from "next/image";

export function AuthBrandingPanel() {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-affecio-bg p-8 lg:min-h-0 lg:w-[42%] lg:p-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_100%,rgba(255,75,99,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_10%,rgba(255,75,99,0.18),transparent_50%),linear-gradient(145deg,#0a0a0a_0%,#1a1012_45%,#12080a_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-affecio-accent/20 blur-3xl lg:h-64 lg:w-64"
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-3">
        <Image
          src="/icon.png"
          alt="Affecio"
          width={40}
          height={40}
          priority
          className="h-10 w-10"
        />
        <span className="font-display text-xl font-semibold tracking-tight text-affecio-text">
          Affecio
        </span>
      </div>

      <div className="relative z-10 mt-auto hidden pt-12 lg:block">
        <p className="font-display text-3xl font-semibold leading-tight text-affecio-text xl:text-4xl">
          Matches that truly{" "}
          <span className="text-affecio-accent">click.</span>
        </p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-affecio-muted">
          Secure admin portal for moderation, verification, and platform operations.
        </p>
      </div>
    </div>
  );
}
