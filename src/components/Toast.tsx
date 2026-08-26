import { createPortal } from "react-dom";
import { useEffect, type ReactNode } from "react";

export type ToastTone = "info" | "success" | "warning" | "error";

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  tone?: ToastTone;
  title?: string;
  duration?: number;
};

const toneStyles: Record<ToastTone, { icon: ReactNode; iconClassName: string; accentClassName: string; title: string }> = {
  info: {
    icon: <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    iconClassName: "bg-brand-primary-50 text-brand-primary-600",
    accentClassName: "bg-brand-primary-500",
    title: "Informasi",
  },
  success: {
    icon: <path d="m8 12 2.5 2.5L16 9m5 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    iconClassName: "bg-emerald-50 text-emerald-600",
    accentClassName: "bg-emerald-500",
    title: "Berhasil",
  },
  warning: {
    icon: <path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    iconClassName: "bg-amber-50 text-amber-600",
    accentClassName: "bg-amber-500",
    title: "Perlu diperhatikan",
  },
  error: {
    icon: <path d="M15 9 9 15m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    iconClassName: "bg-red-50 text-red-600",
    accentClassName: "bg-red-500",
    title: "Terjadi kendala",
  },
};

export function inferToastTone(message: string): ToastTone {
  const normalizedMessage = message.toLocaleLowerCase("id-ID");

  if (/(gagal|error|tidak valid|bermasalah)/.test(normalizedMessage)) return "error";
  if (/(belum|masih|lengkapi|fallback|cache|pilih)/.test(normalizedMessage)) return "warning";
  if (/(berhasil|tersimpan|diterapkan|sudah lengkap|revision)/.test(normalizedMessage)) return "success";
  return "info";
}

export function Toast({ open, message, onClose, tone = "info", title, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose, open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open || !message || typeof document === "undefined") return null;

  const style = toneStyles[tone];

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-28 z-[160] w-[min(420px,calc(100vw-2rem))] sm:right-6" aria-live={tone === "error" ? "assertive" : "polite"}>
      <div
        className="pointer-events-auto relative overflow-hidden rounded-2xl border border-border-primary bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]"
        role={tone === "error" ? "alert" : "status"}
      >
        <div className={`absolute inset-y-0 left-0 w-1 ${style.accentClassName}`} />
        <div className="flex items-start gap-3 py-4 pl-5 pr-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconClassName}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              {style.icon}
            </svg>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[13px] font-semibold text-neutral-800">{title ?? style.title}</div>
            <div className="mt-1 text-[12px] leading-5 text-neutral-600">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-primary-200"
            aria-label="Tutup notifikasi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
