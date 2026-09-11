import Image from "next/image";

export function AuthBrandingPanel() {
  return (
    <div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden bg-[#0b0b0b] p-8 text-[#f5f5f3] lg:min-h-0 lg:w-[40%] lg:p-10">
      <div className="relative z-10 flex items-center gap-3">
        <Image
          src="/icon.png"
          alt="Affecio"
          width={32}
          height={32}
          priority
          className="h-8 w-8"
        />
        <span className="font-brand text-xl leading-none">Affecio</span>
      </div>

      <div className="relative z-10 mt-auto hidden pt-12 lg:block">
        <p className="text-[28px] font-semibold leading-tight tracking-tight xl:text-[32px]">
          Internal operations for the Affecio app.
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9a9a94]">
          Users, trust & safety, analytics, and marketing — in one secure workspace.
        </p>
      </div>
    </div>
  );
}
