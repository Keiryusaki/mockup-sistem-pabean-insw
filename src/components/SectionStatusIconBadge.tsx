import { Badge } from "./Badge";
import { Tooltip } from "./Tooltip";

export type SectionStatus = {
  label: "Tidak Digunakan" | "Belum Diisi" | "Wajib Dilengkapi" | "Belum Lengkap" | "Lengkap";
  tone: "secondary" | "warning" | "error" | "success";
  detail: string;
};

function StatusSymbol({ status, className = "h-3 w-3" }: { status: SectionStatus; className?: string }) {
  if (status.tone === "success") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} fill-current`}><path d="m9.2 16.2-3.7-3.7-1.4 1.4 5.1 5.1L20 8.2l-1.4-1.4-9.4 9.4Z" /></svg>;
  }
  return <span aria-hidden="true">{status.tone === "secondary" ? "–" : "!"}</span>;
}

export function SectionStatusIconBadge({ status, size = "sm" }: { status: SectionStatus; size?: "xs" | "sm" }) {
  const toneClass = status.tone === "success"
    ? "bg-success-100 text-success-600 ring-success-200"
    : status.tone === "error"
      ? "bg-error-100 text-error-600 ring-error-200"
      : status.tone === "warning"
        ? "bg-warning-100 text-warning-600 ring-warning-200"
        : "bg-neutral-100 text-neutral-600 ring-neutral-200";
  const sizeClass = size === "xs" ? "h-4 w-4 text-[9px]" : "h-6 w-6 text-[12px]";

  return (
    <Tooltip placement="right" content={<div><div className="font-semibold text-neutral-800">{status.label}</div><div className="mt-0.5 text-neutral-600">{status.detail}</div></div>}>
      <span tabIndex={0} aria-label={status.label} className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ${sizeClass} ${toneClass}`}>
        <StatusSymbol status={status} className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </span>
    </Tooltip>
  );
}

export function SectionStatusTextBadge({ status }: { status: SectionStatus }) {
  return <Badge variant={status.tone} title={status.detail} startIcon={<StatusSymbol status={status} />}>{status.label}</Badge>;
}
