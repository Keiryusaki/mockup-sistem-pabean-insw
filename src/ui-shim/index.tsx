/* ============================================================
   SHIM @lnsw-ui/react  (PLAN B — sementara)
   ------------------------------------------------------------
   Komponen tiruan dengan NAMA & STYLE mendekati DS asli, pakai
   design token resmi (lihat src/styles.css).

   Import di kode app pakai bentuk asli, contoh:
       import { Button, Skeleton, SkeletonGroup } from "@lnsw-ui/react";

   Saat akses registry sudah dapat:
       1. npm install @lnsw-ui/react
       2. hapus alias di vite.config.ts & tsconfig.json
       3. hapus folder src/ui-shim ini
   Tidak ada perubahan di file-file halaman/layout. Selesai.
   ============================================================ */
import * as React from "react";

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

/* ---------------- Theme provider (no-op pass-through) ------- */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ---------------- Text ------------------------------------- */
type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  size?: "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
  muted?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};
export function Text({ size = "md", weight = "normal", muted, as = "p", className, ...p }: TextProps) {
  const Tag = as as any;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };
  const weights = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" };
  return <Tag className={cx(sizes[size], weights[weight], muted && "text-neutral-600", className)} {...p} />;
}

/* ---------------- Button ----------------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "error";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};
export function Button({ variant = "primary", size = "md", fullWidth, className, ...p }: ButtonProps) {
  const variants = {
    primary: "insw-btn--primary-solid",
    secondary: "insw-btn--secondary-neutral",
    accent: "insw-btn--accent-solid",
    outline: "insw-btn--outline",
    ghost: "insw-btn--ghost",
    error: "insw-btn--error",
  };
  const sizes = { sm: "insw-btn--sm", md: "insw-btn--md", lg: "insw-btn--lg" };
  return <button className={cx("insw-btn", variants[variant], sizes[size], fullWidth && "insw-btn--full", className)} {...p} />;
}

/* ---------------- Input / Textarea ------------------------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string };
export function Input({ label, hint, error, className, id, ...p }: InputProps) {
  const inputId = id || p.name;
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-neutral-800">{label}</label>}
      <input
        id={inputId}
        className={cx(
          "h-10 rounded-md border bg-white px-3 text-sm outline-none transition-colors",
          "border-border-primary focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100",
          error && "border-error-500 focus:border-error-500 focus:ring-error-500/20",
          className
        )}
        {...p}
      />
      {error ? <span className="text-sm text-error-600">{error}</span> : hint ? <span className="text-sm text-neutral-600">{hint}</span> : null}
    </div>
  );
}

export function Textarea({ label, hint, error, className, id, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  const inputId = id || (p as any).name;
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-neutral-800">{label}</label>}
      <textarea
        id={inputId}
        className={cx(
          "min-h-24 rounded-md border bg-white p-3 text-sm outline-none transition-colors",
          "border-border-primary focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100",
          error && "border-error-500",
          className
        )}
        {...p}
      />
      {error ? <span className="text-sm text-error-600">{error}</span> : hint ? <span className="text-sm text-neutral-600">{hint}</span> : null}
    </div>
  );
}

export function Select({ label, children, className, id, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const inputId = id || p.name;
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-neutral-800">{label}</label>}
      <select
        id={inputId}
        className={cx("h-10 rounded-md border border-border-primary bg-white px-3 text-sm outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100", className)}
        {...p}
      >
        {children}
      </select>
    </div>
  );
}

export function Checkbox({ label, className, id, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputId = id || p.name;
  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm text-neutral-800">
      <input id={inputId} type="checkbox" className={cx("h-4 w-4 rounded border-border-secondary text-brand-primary-500 focus:ring-brand-primary-300", className)} {...p} />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked?: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
      <span
        onClick={() => onChange?.(!checked)}
        className={cx("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-brand-primary-500" : "bg-neutral-300")}
      >
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label}
    </label>
  );
}

/* ---------------- Card ------------------------------------- */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-lg border border-border-primary bg-white p-5 shadow-sm", className)} {...p} />;
}
export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("mb-3 flex items-center justify-between", className)} {...p} />;
}

/* ---------------- Badge / Tag ------------------------------ */
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: "primary" | "success" | "warning" | "error" | "neutral" };
export function Badge({ variant = "neutral", className, ...p }: BadgeProps) {
  const variants = {
    primary: "bg-brand-primary-50 text-brand-primary-600",
    success: "bg-success-300/30 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    error: "bg-error-100 text-error-600",
    neutral: "bg-neutral-100 text-neutral-700",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...p} />;
}
export const Tag = Badge;

/* ---------------- Alert ------------------------------------ */
type AlertProps = { variant?: "info" | "success" | "warning" | "error" | "neutral"; title?: string; children?: React.ReactNode };
export function Alert({ variant = "info", title, children }: AlertProps) {
  const styles = {
    info: "bg-info-100/50 border-info-600 text-neutral-800",
    success: "bg-success-100 border-success-600 text-neutral-800",
    warning: "bg-warning-100 border-warning-600 text-neutral-800",
    error: "bg-error-100 border-error-500 text-neutral-800",
    neutral: "bg-neutral-100 border-border-secondary text-neutral-800",
  };
  return (
    <div className={cx("rounded-md border-l-4 p-4", styles[variant])}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

/* ---------------- Divider ---------------------------------- */
export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-0 border-t border-border-primary my-4", className)} />;
}

/* ---------------- Skeleton --------------------------------- */
type SkeletonProps = { width?: number | string; height?: number | string; circle?: boolean; className?: string };
export function Skeleton({ width, height = 16, circle, className }: SkeletonProps) {
  return (
    <div
      className={cx("animate-pulse bg-neutral-200", circle ? "rounded-full" : "rounded-md", className)}
      style={{ width: width ?? "100%", height, ...(circle && !width ? { width: height } : {}) }}
    />
  );
}
export function SkeletonGroup({ count = 3, gap = 8, className }: { count?: number; gap?: number; className?: string }) {
  return (
    <div className={cx("flex flex-col", className)} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={`${100 - i * 8}%`} />
      ))}
    </div>
  );
}

/* ---------------- EmptyState ------------------------------- */
export function EmptyState({ title = "Tidak ada data", description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary py-12 text-center">
      <div className="text-neutral-700 font-semibold">{title}</div>
      {description && <div className="text-sm text-neutral-600 max-w-sm">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------------- Table (simple) --------------------------- */
export function Table({ columns, data }: { columns: { key: string; header: string; render?: (row: any) => React.ReactNode }[]; data: any[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-primary">
      <table className="w-full text-left text-sm">
        <thead className="bg-background-secondary text-neutral-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-semibold">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-primary bg-white">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-brand-primary-50/40">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-neutral-800">{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
