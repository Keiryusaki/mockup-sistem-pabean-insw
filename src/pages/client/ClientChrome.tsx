import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

function assetUrl(path: string) {
  const baseUrl = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
  if (baseUrl === "/") return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function FlagId() {
  return (
    <span className="inline-flex h-5 w-5 overflow-hidden rounded-full border border-white shadow-sm" aria-hidden="true">
      <span className="h-full w-full bg-[linear-gradient(to_bottom,#e70011_50%,#fff_50%)]" />
    </span>
  );
}

function ThemeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="12" cy="12" r="4" strokeWidth="1.6" />
      <path d="M12 3v1.5M12 19.5V21M4.5 12H3M21 12h-1.5M6.2 6.2l1.1 1.1M16.7 16.7l1.1 1.1M6.2 17.8l1.1-1.1M16.7 7.3l1.1-1.1" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current">
      <path d="m6 9 6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClientTopBar({ rightSlot }: { rightSlot?: ReactNode }) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-3 text-left">
        <img src={assetUrl("/lnswlogo-BtrvXW6X.png")} alt="Indonesia National Single Window" className="h-9 w-auto object-contain" />
        <div className="hidden min-w-0 sm:block">
          <div className="text-[11px] font-semibold leading-4 text-brand-primary-800">NSW provided for</div>
          <div className="text-[12px] leading-4 text-neutral-600">Indonesia National Single Window</div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {rightSlot}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border-primary bg-white px-3 text-[12px] font-medium text-neutral-700 shadow-sm"
          aria-label="Bahasa Indonesia"
        >
          <FlagId />
          <ChevronDown />
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-primary bg-white text-neutral-700 shadow-sm"
          aria-label="Tema"
        >
          <ThemeIcon />
        </button>
      </div>
    </header>
  );
}

export function ClientAuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-full overflow-hidden bg-[#f3f7fc] text-neutral-800"
      style={{
        backgroundImage: `url(${assetUrl("/BgSSO.png")})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-10 flex min-h-full flex-col">
        <ClientTopBar />
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function ClientAuthCard({
  children,
  backLabel,
  onBack,
}: {
  children: ReactNode;
  backLabel?: string;
  onBack?: () => void;
}) {
  return (
    <div className="w-full max-w-[420px] rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
      {backLabel && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:text-brand-primary-700"
        >
          <span aria-hidden="true">←</span>
          <span>{backLabel}</span>
        </button>
      ) : null}
      {children}
    </div>
  );
}
