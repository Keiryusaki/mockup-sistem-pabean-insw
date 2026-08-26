import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Select, Switch } from "./FormControls";
import { SectionStatusIconBadge, type SectionStatus } from "./SectionStatusIconBadge";
import { ArrowLeftIcon, ArrowRightIcon, CheckReadIcon, PlainIcon, RoundedMagniferIcon } from "./Icons";

export type FormStepStatus = "success" | "warning" | "error";

export type FormStepperItem = {
  id: string;
  label: string;
  description: string;
  icon: (props: { className?: string }) => ReactNode;
  status: FormStepStatus;
};

export function SmartDraftBanner() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-primary-500 via-[#03306f] to-[#0756a7] p-5 text-white shadow-sm sm:p-6">
      <span className="inline-flex rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">
        Smart Draft dari Smart Submission Assistant
      </span>
      <p className="mt-3 max-w-5xl text-[13px] leading-6 text-white/90">
        Data awal dapat diisi otomatis dari percakapan, hasil pemindaian OCR, dan dokumen yang dianalisis. Pengguna tetap dapat memeriksa dan mengoreksi data sebelum submit.
      </p>
    </section>
  );
}

type DemoFormSelectorProps = {
  domain: "IMPORT" | "EXPORT";
  onDomainChange: (domain: "IMPORT" | "EXPORT") => void;
  documentId: string;
  onDocumentChange: (documentId: string) => void;
  documentOptions: Array<{ label: string; value: string }>;
  requiresQuarantine: boolean;
  onRequiresQuarantineChange: (checked: boolean) => void;
  quarantineDisabled?: boolean;
  technicalBadges: string[];
};

export function DemoFormSelector({
  domain,
  onDomainChange,
  documentId,
  onDocumentChange,
  documentOptions,
  requiresQuarantine,
  onRequiresQuarantineChange,
  quarantineDisabled,
  technicalBadges,
}: DemoFormSelectorProps) {
  return (
    <section className="rounded-2xl border border-dashed border-brand-primary-200 bg-brand-primary-50/35 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">Kontrol Demo Mockup</div>
            <Badge variant="warning">Khusus Demo</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-neutral-600">
            Gunakan area ini untuk berpindah domain, memilih jenis form, dan mencoba skenario data. Kontrol ini tidak tersedia pada aplikasi end user.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {technicalBadges.map((label) => <Badge key={label} variant="secondary">{label}</Badge>)}
          </div>
        </div>
        <div className="grid w-full shrink-0 gap-3 sm:grid-cols-3 xl:w-[760px]">
          <Select
            label="Jenis Kegiatan"
            value={domain}
            onValueChange={(value) => onDomainChange(value as "IMPORT" | "EXPORT")}
            options={[{ label: "Impor", value: "IMPORT" }, { label: "Ekspor", value: "EXPORT" }]}
          />
          <Select label="Pilih Form" value={documentId} onValueChange={onDocumentChange} options={documentOptions} placeholder="Pilih jenis form" />
          <Switch label="Skenario Karantina" checked={requiresQuarantine} onChange={onRequiresQuarantineChange} disabled={quarantineDisabled} className="mt-[22px] py-1.5" />
        </div>
      </div>
    </section>
  );
}

export function FormDocumentHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="border-b border-border-primary pb-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">{eyebrow}</div>
      <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-neutral-800">{title}</h1>
      <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{description}</p>
    </div>
  );
}

const statusMeta: Record<FormStepStatus, SectionStatus> = {
  success: { label: "Lengkap", tone: "success", detail: "Semua field mandatory pada step ini sudah terisi." },
  warning: { label: "Belum Diisi", tone: "warning", detail: "Step ini belum mulai diisi." },
  error: { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory pada step ini yang belum diisi." },
};

export function FormStepper({ items, activeId, onChange }: { items: FormStepperItem[]; activeId: string; onChange: (id: string) => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-border-primary bg-white px-4 py-4 shadow-sm">
      <div className="overflow-x-auto pb-1 pt-2">
        <div className="relative flex min-w-[920px] items-start pt-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = item.id === activeId;
            const status = statusMeta[item.status];
            const complete = item.status === "success";
            return (
              <div key={item.id} className="relative flex flex-1 items-start">
                {index < items.length - 1 ? <div className={`absolute left-[calc(50%+24px)] top-[18px] h-px w-[calc(100%-48px)] ${complete ? "bg-brand-primary-500/70" : "bg-border-primary"}`} /> : null}
                <button type="button" onClick={() => onChange(item.id)} className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-2 text-center transition-transform hover:-translate-y-0.5">
                  <span className={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-semibold shadow-sm transition-colors ${active ? "border-brand-primary-500 bg-brand-primary-500 text-white" : complete ? "border-brand-primary-500 bg-brand-primary-50 text-brand-primary-600" : "border-border-primary bg-background-primary text-neutral-500"}`}>
                    <Icon className="h-4 w-4" />
                    <span className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-white"><SectionStatusIconBadge status={status} size="xs" /></span>
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[12px] font-semibold ${active || complete ? "text-brand-primary-700" : "text-neutral-700"}`}>{item.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-neutral-500">{item.description}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FormConfiguratorLauncher({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="primary" size="sm" onClick={onClick}>Konfigurasi Form</Button>
  );
}

type FormStepFooterActionsProps = {
  stepLabel: string;
  onPrevious?: () => void;
  onCheck: () => void;
  onSaveDraft: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
  saveDraftLabel?: string;
  primaryLabel?: string;
  submit?: boolean;
};

export function FormStepFooterActions({
  stepLabel,
  onPrevious,
  onCheck,
  onSaveDraft,
  onNext,
  showPrevious = true,
  showNext = true,
  saveDraftLabel,
  primaryLabel = "Selanjutnya",
  submit = false,
}: FormStepFooterActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-primary pt-4">
      {showPrevious ? (
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!onPrevious} startIcon={<ArrowLeftIcon className="h-3.5 w-3.5" />}>Sebelumnya</Button>
      ) : <span />}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCheck} startIcon={<RoundedMagniferIcon className="h-3.5 w-3.5" />}>Cek Kelengkapan</Button>
        <Button variant="outline" size="sm" onClick={onSaveDraft} startIcon={<CheckReadIcon className="h-3.5 w-3.5" />}>{saveDraftLabel ?? `Simpan Draft ${stepLabel}`}</Button>
        {showNext ? <Button variant="primary" size="sm" onClick={onNext} disabled={!onNext} startIcon={submit ? <PlainIcon className="h-3.5 w-3.5" /> : undefined} endIcon={submit ? undefined : <ArrowRightIcon className="h-3.5 w-3.5" />}>{primaryLabel}</Button> : null}
      </div>
    </div>
  );
}
