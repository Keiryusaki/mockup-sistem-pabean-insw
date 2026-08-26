import type { ReactNode } from "react";
import { ArrowRightIcon } from "./Icons";
import { SectionStatusIconBadge, type SectionStatus } from "./SectionStatusIconBadge";
import { Tooltip } from "./Tooltip";

type CompactTocItem = {
  id: string;
  label: string;
  icon: ReactNode;
  status?: SectionStatus;
  onClick: () => void;
};

type DrawerTocLayoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toc: ReactNode;
  compactItems: CompactTocItem[];
  children: ReactNode;
};

export function DrawerTocLayout({ open, onOpenChange, toc, compactItems, children }: DrawerTocLayoutProps) {
  return (
    <div className="flex h-full min-h-0 bg-transparent">
      <aside
        className="hidden h-full shrink-0 justify-end overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex"
        style={{ width: open ? 280 : 64 }}
      >
        <div className="relative h-full w-[272px] shrink-0">
          <div className={`absolute right-2 top-[112px] flex max-h-[calc(100dvh-128px)] w-[264px] min-h-0 flex-col overflow-hidden rounded-2xl border border-border-primary bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-[opacity,transform] duration-300 ${open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-6 opacity-0"}`}>
              {toc}
          </div>

          <div className={`absolute right-1 top-[112px] flex max-h-[calc(100dvh-128px)] w-14 min-h-0 flex-col items-center overflow-hidden rounded-2xl border border-border-primary bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-[opacity,transform] duration-300 ${open ? "pointer-events-none translate-x-5 opacity-0" : "translate-x-0 opacity-100"}`}>
            <Tooltip content="Buka TOC" placement="right">
              <button type="button" onClick={() => onOpenChange(true)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-primary-500 text-brand-primary-600 transition-colors hover:bg-brand-primary-50" aria-label="Buka TOC">
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </Tooltip>
            <div className="my-2 h-px w-full shrink-0 bg-border-primary" />
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
              {compactItems.map((item) => (
                <Tooltip key={item.id} content={item.label} placement="right">
                  <button type="button" onClick={item.onClick} className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600 transition-colors hover:bg-brand-primary-500 hover:text-white" aria-label={item.label}>
                    {item.icon}
                    {item.status ? <span className="absolute -right-1 -top-1 rounded-full ring-2 ring-white"><SectionStatusIconBadge status={item.status} size="xs" /></span> : null}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1 border-l border-border-primary bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
        {children}
      </div>
    </div>
  );
}

export function DrawerTocIcon({ kind, className = "h-4 w-4" }: { kind: string; className?: string }) {
  const normalized = kind.toLowerCase();
  const path = normalized.includes("identitas") || normalized.includes("info")
    ? <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h4M8 14h8" /></>
    : normalized.includes("kuantitas") || normalized.includes("kemasan") || normalized.includes("satuan")
      ? <><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="m4 8v8l8 4 8-4V8M12 12v8" /></>
      : normalized.includes("nilai") || normalized.includes("harga") || normalized.includes("tarif") || normalized.includes("cukai")
        ? <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.6-.7-1.4-1-2.5-1-1.4 0-2.5.7-2.5 1.8 0 2.8 5 1.2 5 4 0 1.1-1.1 1.8-2.5 1.8-1.1 0-2-.4-2.6-1.1M12 6.5v11" /></>
        : normalized.includes("dokumen") || normalized.includes("document")
          ? <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>
          : normalized.includes("spesifikasi")
            ? <><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="17" r="2" /></>
            : normalized.includes("karantina") || normalized.includes("lartas") || normalized.includes("compliance")
              ? <><path d="M12 3 19 6v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>
              : <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>;

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{path}</svg>;
}
