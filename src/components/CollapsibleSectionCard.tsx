import { useState, type ReactNode } from "react";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 fill-current transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="m7 10 5 5 5-5H7Z" />
    </svg>
  );
}

export function CollapsibleSectionCard({ title, subtitle, children, defaultOpen = true, headerActions, leadingIcon }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerActions?: ReactNode;
  leadingIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-border-primary bg-white shadow-sm">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          {leadingIcon ? <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">{leadingIcon}</span> : null}
          <span className="min-w-0">
            <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">{title}</span>
            {subtitle ? <span className="mt-1 block text-[12px] text-neutral-600">{subtitle}</span> : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          {headerActions}
          <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? "Ciutkan section" : "Buka section"} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>
      {open ? <div className="border-t border-border-primary p-4">{children}</div> : null}
    </section>
  );
}
