import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Zm-2 1H7v-6a5 5 0 1 1 10 0v6Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="m7 10 5 5 5-5H7Z" />
    </svg>
  );
}

function LogoMark() {
  const baseUrl = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");

  return (
    <img
      src={`${baseUrl}/lnswlogo-BtrvXW6X.png`}
      alt="Indonesia National Single Window"
      className="h-9 w-auto object-contain"
    />
  );
}

export function ShellHeader({ breadcrumb, action }: { breadcrumb: string; action?: ReactNode }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateText = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);
  const timeText = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-primary-700 bg-brand-primary-500 text-white shadow-[0_2px_10px_rgba(1,33,78,0.22)]">
      <div className="shell-header-top mx-auto flex h-[50px] w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Beranda" className="shrink-0">
          <LogoMark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden min-w-0 flex-col items-end sm:flex">
            <div className="border-b border-white/80 pb-1 text-[14px] font-medium leading-none whitespace-nowrap">
              {dateText} pukul {timeText}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Notifikasi"
          >
            <BellIcon />
          </button>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[12px] font-bold leading-none text-white">
            0
          </span>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7d8794] text-lg font-bold text-white shadow-sm"
            aria-label="Profil pengguna"
          >
            A
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
            aria-label="Buka menu"
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 bg-brand-primary-700 px-4 py-2 text-[13px] text-white sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-medium">INSW</span>
            <span className="mx-2 text-white/65">/</span>
            <span className="text-white/85">{breadcrumb}</span>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </header>
  );
}
