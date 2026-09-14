import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { Select } from "../../components/FormControls";
import { STEP_LABELS, type AiSubmissionDraft, type UserScope, type WizardStep } from "./aiWizardData";
import { ModalCancelButton } from "./SubmissionModalShared";

type UploadFileState = { selected: string | null; uploaded: string | null };
type DataPhase = "excel" | "excel-result" | "ocr-upload" | "ocr-result";
type PermitChoice = "existing" | "manual" | "skipped" | null;
type ConversationEntry = { role: "assistant" | "user"; text: string };
type AssistantState = {
  userScope: UserScope;
  identificationAnswers: Record<string, string>;
  identifiedSubmissionType: string | null;
  excel: { skipped: boolean; file: UploadFileState; parsed: boolean };
  ocr: { files: Record<string, UploadFileState>; hsCodes: Record<string, string> };
  permits: { choice: PermitChoice; selected: string[] | string | null; manual: Record<string, string> };
  attachments: Record<string, UploadFileState>;
};

const USER_SCOPE: UserScope = {
  allowedFlow: "EXPORT",
  allowedDocuments: ["BC 2.3", "BC 2.7"],
  companyName: "PT Contoh Nusantara",
  npwp: "01.234.567.8-999.000",
  nib: "1234567890123",
};
const EMPTY_FILE: UploadFileState = { selected: null, uploaded: null };
const GOODS = [
  { seri: "1", name: "Laptop Computer", hs: "8471.30.10", qty: "10", unit: "PCE", permit: true },
  { seri: "2", name: "AC/DC Power Adapter", hs: "8504.40.90", qty: "10", unit: "PCE", permit: false },
];
const SOURCE_DOCUMENTS = [
  { id: "invoice", label: "Invoice", required: true },
  { id: "packing-list", label: "Packing List", required: true },
  { id: "bill-of-lading", label: "Bill of Lading", required: true },
];
const ATTACHMENT_DOCUMENTS = [
  ...SOURCE_DOCUMENTS.map((item) => ({ ...item, required: true })),
  { id: "support", label: "Dokumen pendukung lain", required: false },
];
const PERMIT_GROUPS = [
  {
    hs: "8471.30.10",
    item: "Laptop Computer",
    permits: [
      { id: "pi", name: "Perizinan Elektronik", detail: "PI-ELK-2026-00881 · Aktif · Berlaku sampai 31 Desember 2026 · Kementerian Perdagangan" },
      { id: "masterlist", name: "Masterlist Fasilitas", detail: "ML-00123 · Aktif · Berlaku sampai 30 Juni 2027 · BKPM" },
      { id: "sni", name: "Persetujuan SNI Elektronik", detail: "SNI-2026-1138 · Aktif · Berlaku sampai 15 Mei 2027 · BSN" },
    ],
  },
  {
    hs: "8504.40.90",
    item: "AC/DC Power Adapter",
    permits: [{ id: "lspro", name: "Sertifikat Produk", detail: "SPPT-2026-4409 · Aktif · Berlaku sampai 8 Agustus 2027 · LSPro" }],
  },
];

function makeFiles(items: Array<{ id: string }>) {
  return Object.fromEntries(items.map((item) => [item.id, { ...EMPTY_FILE }])) as Record<string, UploadFileState>;
}
function initialState(): AssistantState {
  return {
    userScope: USER_SCOPE,
    identificationAnswers: {},
    identifiedSubmissionType: null,
    excel: { skipped: false, file: { ...EMPTY_FILE }, parsed: false },
    ocr: { files: makeFiles(SOURCE_DOCUMENTS), hsCodes: {} },
    permits: { choice: null, selected: [], manual: {} },
    attachments: makeFiles(ATTACHMENT_DOCUMENTS),
  };
}
function BotIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M12 3.5A1.5 1.5 0 0 1 13.5 5v1H16a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4h2.5V5A1.5 1.5 0 0 1 12 3.5Zm-1 3.5V6h2v1h-2Zm-2 3.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm6 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM9 15c0-1.1 1.34-2 3-2s3 .9 3 2H9Z" /></svg>;
}
function AssistantMessage({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600 shadow-sm"><BotIcon /></div><div className="max-w-[760px] rounded-2xl rounded-tl-md border border-border-primary bg-white px-4 py-3 text-[12px] leading-6 text-neutral-800 shadow-sm">{children}</div></div>;
}
function SectionCard({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return <section className="rounded-[24px] border border-border-primary bg-white p-4 shadow-sm sm:p-5"><div className="text-[11px] uppercase tracking-[0.18em] text-brand-primary-600">{eyebrow}</div><h4 className="mt-2 text-[20px] font-semibold text-neutral-800">{title}</h4>{description && <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-600">{description}</p>}<div className="mt-4">{children}</div></section>;
}
function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "info" }) {
  const tones = { neutral: "bg-neutral-100 text-neutral-600", success: "bg-success-50 text-success-700", warning: "bg-amber-50 text-amber-800", info: "bg-brand-primary-50 text-brand-primary-700" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}
function FileRow({ label, required, value, accept, onPick, onUpload }: { label: string; required: boolean; value: UploadFileState; accept?: string; onPick: (name: string | null) => void; onUpload: () => void }) {
  return <div className="rounded-2xl border border-border-primary bg-background-primary/25 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-neutral-800">{label}<StatusBadge tone={required ? "warning" : "neutral"}>{required ? "Wajib" : "Pendukung"}</StatusBadge></div><div className="mt-1 text-[11px] text-neutral-500">{value.uploaded ?? value.selected ?? "Belum ada file dipilih"}</div></div><div className="flex flex-wrap items-center gap-2"><label className="cursor-pointer rounded-lg border border-brand-primary-300 bg-white px-3 py-2 text-[12px] font-semibold text-brand-primary-700 hover:bg-brand-primary-50">Pilih File<input className="sr-only" type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0]?.name ?? null)} /></label><Button variant="primary" size="sm" disabled={!value.selected || Boolean(value.uploaded)} onClick={onUpload}>Upload</Button>{value.uploaded && <StatusBadge tone="success">Berhasil</StatusBadge>}</div></div></div>;
}
function ChoiceButton({ selected, title, description, onClick }: { selected?: boolean; title: string; description?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary-300 ${selected ? "border-brand-primary-500 bg-brand-primary-50" : "border-border-primary bg-white"}`}><div className="text-[14px] font-semibold text-neutral-800">{title}</div>{description && <p className="mt-2 text-[12px] leading-5 text-neutral-600">{description}</p>}</button>;
}

function ConversationHistory({ entries, expanded, onToggle }: { entries: ConversationEntry[]; expanded: boolean; onToggle: () => void }) {
  const visible = expanded ? entries : entries.slice(-2);
  return <section className="rounded-2xl border border-brand-primary-100 bg-white/70 p-3 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3"><div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">Riwayat Percakapan</div>{entries.length > 2 && <button type="button" onClick={onToggle} className="text-[11px] font-semibold text-brand-primary-700">{expanded ? "Ringkas riwayat" : `Lihat ${entries.length} pesan sebelumnya`}</button>}</div><div className="space-y-2">{visible.map((entry, index) => <div key={`${entry.role}-${index}-${entry.text}`} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-xl px-3 py-2 text-[11px] leading-5 ${entry.role === "user" ? "bg-brand-primary-500 text-white" : "border border-border-primary bg-white text-neutral-700"}`}>{entry.text}</div></div>)}</div></section>;
}

export function AiStepModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (draft: AiSubmissionDraft) => void }) {
  const [stage, setStage] = useState<WizardStep>("identifikasi");
  const [state, setState] = useState<AssistantState>(initialState);
  const [identificationQuestion, setIdentificationQuestion] = useState(0);
  const [dataPhase, setDataPhase] = useState<DataPhase>("excel");
  const [permitChecking, setPermitChecking] = useState(false);
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [analyzingDocuments, setAnalyzingDocuments] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([
    { role: "assistant", text: "Halo! Akses SSO Anda sudah dikenali untuk pengajuan ekspor." },
    { role: "assistant", text: "Apa tujuan pengiriman barang?" },
  ]);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [openPermitGroups, setOpenPermitGroups] = useState<Record<string, boolean>>({ "8471.30.10": true, "8504.40.90": true });
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleSteps = STEP_LABELS.filter((item) => !state.excel.skipped || item.key !== "lampiran").slice(0, state.excel.skipped ? 4 : 5);
  const activeStageKey = stage === "perizinan-v2" ? "perizinan" : stage;
  const activeStepIndex = Math.max(0, visibleSteps.findIndex((item) => item.key === activeStageKey));
  const selectedPermitIds = Array.isArray(state.permits.selected) ? state.permits.selected : state.permits.selected ? [state.permits.selected] : [];
  const source = state.excel.skipped ? "OCR" : "Excel";
  const selectedHs = state.excel.skipped ? Object.values(state.ocr.hsCodes) : GOODS.map((item) => item.hs);
  const uploadedAttachments = Object.values(state.attachments).flatMap((file) => file.uploaded ? [file.uploaded] : []);
  const uploadedSourceDocs = Object.values(state.ocr.files).flatMap((file) => file.uploaded ? [file.uploaded] : []);
  const reviewDocuments = Array.from(new Set([...uploadedSourceDocs, ...uploadedAttachments]));

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    if (open) return;
    setStage("identifikasi");
    setState(initialState());
    setIdentificationQuestion(0);
    setDataPhase("excel");
    setPermitChecking(false);
    setShowAttachmentUpload(false);
    setAnalyzingDocuments(false);
    setConversation([
      { role: "assistant", text: "Halo! Akses SSO Anda sudah dikenali untuk pengajuan ekspor." },
      { role: "assistant", text: "Apa tujuan pengiriman barang?" },
    ]);
    setHistoryExpanded(true);
  }, [open]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [stage, dataPhase, identificationQuestion, permitChecking, showAttachmentUpload]);

  const updateFile = (area: "ocr" | "attachments", id: string, patch: Partial<UploadFileState>) => {
    setState((current) => area === "ocr"
      ? { ...current, ocr: { ...current.ocr, files: { ...current.ocr.files, [id]: { ...current.ocr.files[id], ...patch } } } }
      : { ...current, attachments: { ...current.attachments, [id]: { ...current.attachments[id], ...patch } } });
  };
  const answerIdentification = (key: string, value: string) => {
    setState((current) => ({ ...current, identificationAnswers: { ...current.identificationAnswers, [key]: value } }));
    setConversation((current) => [...current, { role: "user", text: value }, { role: "assistant", text: "Siapa pihak yang mengajukan ekspor?" }]);
    setIdentificationQuestion((current) => current + 1);
  };
  const finishIdentification = (value: string) => {
    setState((current) => ({ ...current, identificationAnswers: { ...current.identificationAnswers, pelaku: value }, identifiedSubmissionType: "BC 2.7 - Pemberitahuan Ekspor Barang (PEB)" }));
    setConversation((current) => [...current, { role: "user", text: value }, { role: "assistant", text: "Pengajuan teridentifikasi sebagai BC 2.7 - Pemberitahuan Ekspor Barang (PEB)." }]);
    setIdentificationQuestion(2);
  };
  const enterPermits = () => {
    setStage("perizinan-v2");
    setConversation((current) => [...current, { role: "assistant", text: "HS Code tersedia. Saya akan mencocokkan kebutuhan izin dengan data INSW Anda." }]);
    setPermitChecking(true);
    window.setTimeout(() => setPermitChecking(false), 700);
  };
  const canAnalyzeOcr = uploadedSourceDocs.length > 0;
  const canContinueOcr = GOODS.every((item) => {
    const hs = state.ocr.hsCodes[item.seri];
    return Boolean(hs);
  });
  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.BASE_URL}template-upload-barang.xlsx`;
    link.download = "template-upload-barang.xlsx";
    link.click();
  };
  const missingRequiredAttachments = ATTACHMENT_DOCUMENTS.filter((item) => item.required && !state.attachments[item.id].uploaded);
  const canAnalyzeAttachments = uploadedAttachments.length > 0;
  const missingRequiredOcr = SOURCE_DOCUMENTS.filter((item) => item.required && !state.ocr.files[item.id].uploaded);
  const continueToReview = () => {
    setAnalyzingDocuments(true);
    window.setTimeout(() => { setAnalyzingDocuments(false); setStage("review"); }, 700);
  };
  const continueAfterPermits = (choice: Exclude<PermitChoice, null>) => {
    setState((current) => ({ ...current, permits: { ...current.permits, choice } }));
    setConversation((current) => [...current, { role: "user", text: choice === "existing" ? `${selectedPermitIds.length} perizinan terpilih` : choice === "manual" ? "Input perizinan manual" : "Lewati perizinan" }, { role: "assistant", text: state.excel.skipped ? "Dokumen OCR akan digunakan sekaligus sebagai lampiran. Silakan review hasil data." : "Apakah Anda ingin mengunggah dokumen lampiran wajib maupun pendukung?" }]);
    setStage(state.excel.skipped ? "review" : "lampiran");
  };
  const returnToHsValidation = () => {
    setPermitChecking(false);
    setDataPhase(state.excel.skipped ? "ocr-result" : "excel-result");
    setStage("data-barang");
    setConversation((current) => [...current, { role: "user", text: "Kembali ke Validasi HS Code" }, { role: "assistant", text: state.excel.skipped ? "Silakan periksa kembali pilihan HS Code hasil OCR." : "Silakan periksa kembali hasil validasi HS Code dari Excel." }]);
  };
  const submitDraft = () => {
    const documents = Array.from(new Set([...uploadedSourceDocs, ...uploadedAttachments]));
    onSubmit({ jenisPengajuan: state.identifiedSubmissionType ?? "BC 2.7 - Pemberitahuan Ekspor Barang (PEB)", namaPerusahaan: state.userScope.companyName, npwp: state.userScope.npwp, nib: state.userScope.nib, keterangan: `Data disiapkan melalui Smart Submission Assistant. Sumber utama: ${source}. HS Code: ${selectedHs.join(", ")}.`, dokumen: documents });
    onClose();
  };
  const resetIdentification = () => { setState(initialState()); setIdentificationQuestion(0); setDataPhase("excel"); setConversation([{ role: "assistant", text: "Halo! Akses SSO Anda sudah dikenali untuk pengajuan ekspor." }, { role: "assistant", text: "Apa tujuan pengiriman barang?" }]); };
  if (!open) return null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"><div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.28)] sm:max-h-[calc(100vh-3rem)]">
    <header className="border-b border-border-primary bg-white px-5 py-5 sm:px-8"><h3 className="text-[24px] font-semibold text-neutral-800">Smart Submission Assistant</h3><p className="mt-1 text-[12px] text-neutral-600 sm:text-[13px]">Asisten terpandu untuk menyiapkan data pengajuan berdasarkan akses dan dokumen Anda.</p><div className={`mt-6 grid gap-1 sm:gap-3 ${state.excel.skipped ? "grid-cols-4" : "grid-cols-5"}`}>{visibleSteps.map((step, index) => { const active = index === activeStepIndex; const done = index < activeStepIndex; return <div key={step.key} className="relative flex min-w-0 flex-col items-center">{index < visibleSteps.length - 1 && <div className="absolute left-1/2 top-4 h-px w-full bg-border-primary" />}<div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold sm:h-10 sm:w-10 ${active || done ? "border-brand-primary-500 bg-brand-primary-500 text-white" : "border-border-primary bg-white text-neutral-500"}`}>{done ? "✓" : step.icon}</div><div className={`mt-2 truncate text-center text-[9px] font-medium sm:text-[11px] ${active || done ? "text-brand-primary-700" : "text-neutral-500"}`}>{step.label}</div></div>; })}</div></header>
    <main ref={scrollRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-brand-primary-50 to-brand-primary-100/60 px-4 py-5 sm:px-8"><div className="space-y-4">
      <ConversationHistory entries={conversation} expanded={historyExpanded} onToggle={() => setHistoryExpanded((current) => !current)} />
      {stage === "data-barang" && dataPhase === "ocr-upload" && canAnalyzeOcr && missingRequiredOcr.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">Beberapa dokumen wajib belum diunggah. Anda tetap dapat melanjutkan dan melengkapinya pada Form Pengajuan.</div>}
      {stage === "lampiran" && showAttachmentUpload && canAnalyzeAttachments && missingRequiredAttachments.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">Beberapa dokumen wajib belum diunggah. Anda tetap dapat melanjutkan dan melengkapinya pada Form Pengajuan.</div>}
      {stage === "review" && reviewDocuments.length > 0 && <SectionCard eyebrow="Dokumen Digunakan" title={state.excel.skipped ? "Dokumen OCR sekaligus menjadi lampiran" : "Dokumen lampiran hasil analisis"} description={state.excel.skipped ? "File berikut dipakai sebagai sumber identifikasi barang dan tidak perlu diunggah ulang." : "Excel tetap menjadi sumber utama; dokumen digunakan untuk validasi dan pelengkap."}><div className="flex flex-wrap gap-2">{reviewDocuments.map((file) => <StatusBadge key={file} tone="success">{file}</StatusBadge>)}</div></SectionCard>}
      {stage === "perizinan-v2" && <>
        <AssistantMessage>Saya memeriksa HS Code, regulasi terkait, dan perizinan yang telah terdaftar pada akun INSW Anda.</AssistantMessage>
        {permitChecking ? <SectionCard eyebrow="Identifikasi Perizinan" title="Mencocokkan perizinan user…"><div className="space-y-2 text-[12px] text-neutral-700"><div>✓ Memeriksa HS Code</div><div>✓ Mengidentifikasi regulasi</div><div className="animate-pulse">● Mencocokkan perizinan user</div></div></SectionCard> : <SectionCard eyebrow="Hasil Perizinan" title="Perizinan dikelompokkan berdasarkan HS Code" description={`${selectedPermitIds.length} dari ${PERMIT_GROUPS.reduce((total, group) => total + group.permits.length, 0)} perizinan dipilih`}>
          <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">{PERMIT_GROUPS.map((group) => {
            const selectedInGroup = group.permits.filter((permit) => selectedPermitIds.includes(permit.id)).length;
            const opened = openPermitGroups[group.hs] ?? false;
            return <div key={group.hs} className="overflow-hidden rounded-2xl border border-border-primary"><button type="button" onClick={() => setOpenPermitGroups((current) => ({ ...current, [group.hs]: !opened }))} className="flex w-full items-center justify-between gap-3 bg-background-primary/35 px-4 py-3 text-left"><div><div className="text-[13px] font-semibold text-neutral-800">HS {group.hs} — {group.item}</div><div className="mt-1 text-[11px] text-neutral-500">{group.permits.length} perizinan ditemukan · {selectedInGroup} dipilih</div></div><span className="text-brand-primary-700">{opened ? "▴" : "▾"}</span></button>{opened && <div className="space-y-2 p-3">{group.permits.map((permit) => { const checked = selectedPermitIds.includes(permit.id); return <label key={permit.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked ? "border-brand-primary-400 bg-brand-primary-50" : "border-border-primary bg-white"}`}><input type="checkbox" checked={checked} onChange={() => setState((current) => { const selected = Array.isArray(current.permits.selected) ? current.permits.selected : []; return { ...current, permits: { ...current.permits, selected: checked ? selected.filter((id) => id !== permit.id) : [...selected, permit.id], choice: null } }; })} className="mt-1 h-4 w-4 accent-blue-700" /><span><span className="block text-[13px] font-semibold text-neutral-800">{permit.name}</span><span className="mt-1 block text-[11px] leading-5 text-neutral-600">{permit.detail}</span></span></label>; })}</div>}</div>;
          })}</div>
          {state.permits.choice === "manual" && <ManualPermit state={state.permits.manual} onChange={(key, value) => setState((current) => ({ ...current, permits: { ...current.permits, manual: { ...current.permits.manual, [key]: value } } }))} />}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" onClick={returnToHsValidation}>Kembali ke Validasi HS Code</Button><StatusBadge tone="info">{selectedPermitIds.length} perizinan dipilih</StatusBadge></div><div className="flex flex-wrap gap-3"><Button variant="outline" size="sm" onClick={() => continueAfterPermits("skipped")}>Lewati</Button><Button variant="outline" size="sm" onClick={() => setState((current) => ({ ...current, permits: { ...current.permits, choice: "manual" } }))}>Input Manual</Button>{state.permits.choice === "manual" ? <Button variant="primary" size="sm" onClick={() => continueAfterPermits("manual")}>Simpan dan Lanjut</Button> : <Button variant="primary" size="sm" disabled={!selectedPermitIds.length} onClick={() => continueAfterPermits("existing")}>Gunakan Perizinan Terpilih</Button>}</div></div>
        </SectionCard>}
      </>}
      {stage === "identifikasi" && <>
        <AssistantMessage>Halo! Akses SSO Anda sudah dikenali. Saya hanya akan menampilkan pilihan pengajuan yang sesuai dengan scope akun.</AssistantMessage>
        <div className="rounded-2xl border border-brand-primary-100 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Scope dari SSO</div><div className="mt-1 text-[14px] font-semibold text-neutral-800">Pengeluaran / Ekspor</div></div><div className="flex gap-2">{state.userScope.allowedDocuments.map((item) => <StatusBadge key={item} tone="info">{item}</StatusBadge>)}</div></div></div>
        {identificationQuestion === 0 && <SectionCard eyebrow="Pertanyaan Identifikasi" title="Apa tujuan pengiriman barang?" description="Pilihan pemasukan tidak ditampilkan karena tidak termasuk scope akun Anda."><div className="grid gap-3 md:grid-cols-3">{["Penjualan", "Sample / Pameran", "Perbaikan / Pengembalian"].map((item) => <ChoiceButton key={item} title={item} onClick={() => answerIdentification("tujuan", item)} />)}</div></SectionCard>}
        {identificationQuestion === 1 && <SectionCard eyebrow="Pertanyaan Identifikasi" title="Siapa pihak yang mengajukan ekspor?"><div className="grid gap-3 md:grid-cols-3">{["Eksportir sendiri", "PPJK mewakili eksportir", "Instansi pemerintah"].map((item) => <ChoiceButton key={item} title={item} onClick={() => finishIdentification(item)} />)}</div></SectionCard>}
        {identificationQuestion >= 2 && state.identifiedSubmissionType && <SectionCard eyebrow="Hasil Identifikasi" title={state.identifiedSubmissionType} description="Jenis pengajuan disimpulkan dari scope SSO dan jawaban yang Anda berikan."><div className="grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4 text-[12px] leading-6 text-neutral-700"><b>Ringkasan jawaban</b><br />Tujuan: {state.identificationAnswers.tujuan}<br />Pengaju: {state.identificationAnswers.pelaku}</div><div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4 text-[12px] leading-6 text-neutral-700"><b>Dokumen yang mungkin diperlukan</b><br />Invoice, Packing List, Bill of Lading, dan dokumen perizinan terkait.</div></div><div className="mt-4 flex justify-end gap-3"><Button variant="outline" size="sm" onClick={resetIdentification}>Ubah Jawaban</Button><Button variant="primary" size="sm" onClick={() => setStage("data-barang")}>Lanjut ke Data Barang</Button></div></SectionCard>}
      </>}

      {stage === "data-barang" && dataPhase === "excel" && <><AssistantMessage>Unggah Excel sebagai sumber utama data barang. Jika tidak tersedia, Anda dapat menggunakan dokumen untuk identifikasi barang.</AssistantMessage><SectionCard eyebrow="Data Barang" title="Upload Excel Data Barang" description="Gunakan template Excel data barang untuk mempercepat pengisian dan pemetaan data."><FileRow label="Template data barang" required value={state.excel.file} accept=".xls,.xlsx" onPick={(name) => setState((current) => ({ ...current, excel: { ...current.excel, file: { selected: name, uploaded: null } } }))} onUpload={() => setState((current) => ({ ...current, excel: { ...current.excel, file: { ...current.excel.file, uploaded: current.excel.file.selected } } }))} /><div className="mt-4 flex flex-wrap justify-between gap-3"><Button variant="outline" size="sm" onClick={downloadTemplate}>Download Template</Button><div className="flex gap-3"><Button variant="outline" size="sm" onClick={() => { setState((current) => ({ ...current, excel: { ...current.excel, skipped: true } })); setDataPhase("ocr-upload"); }}>Lewati Upload Excel</Button><Button variant="primary" size="sm" disabled={!state.excel.file.uploaded} onClick={() => { setState((current) => ({ ...current, excel: { ...current.excel, parsed: true } })); setDataPhase("excel-result"); }}>Analisis Data Barang</Button></div></div></SectionCard></>}
      {stage === "data-barang" && dataPhase === "excel-result" && <><AssistantMessage>File selesai dibaca, struktur tervalidasi, dan field data barang sudah dipetakan.</AssistantMessage><SectionCard eyebrow="Analisis Data Barang" title="Hasil Analisis Data Barang" description="2 barang dan 12 field berhasil terbaca dari Excel. Satu HS Code terindikasi memiliki perizinan terkait."><div className="mb-4 flex flex-wrap gap-2">{["Membaca file", "Validasi struktur", "Parsing data", "Mapping field"].map((item) => <StatusBadge key={item} tone="success">{item} ✓</StatusBadge>)}</div><GoodsTable source="Excel" review={false} hsCodes={{}} onHsChange={() => undefined} /></SectionCard><SectionCard eyebrow="Validasi HS Code" title="HS Code dan indikasi perizinan"><div className="space-y-2">{GOODS.map((item) => <div key={item.seri} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-primary p-4 text-[12px]"><div><b>Seri {item.seri} · {item.name}</b><div className="mt-1 text-neutral-600">HS {item.hs}</div></div><StatusBadge tone={item.permit ? "warning" : "success"}>{item.permit ? "Perizinan terdeteksi" : "Tidak ada indikasi izin"}</StatusBadge></div>)}</div><div className="mt-4 flex justify-end"><Button variant="primary" size="sm" onClick={enterPermits}>Lanjut Identifikasi Perizinan</Button></div></SectionCard></>}
      {stage === "data-barang" && dataPhase === "ocr-upload" && <><AssistantMessage>Excel dilewati. Unggah dokumen agar OCR dapat mengidentifikasi barang dan menyiapkan kandidat HS Code.</AssistantMessage><SectionCard eyebrow="Identifikasi Barang" title="Upload Dokumen untuk Identifikasi Barang" description="Format yang didukung pada mockup: PDF, JPG, dan PNG."><div className="space-y-3">{SOURCE_DOCUMENTS.map((item) => <FileRow key={item.id} label={item.label} required={item.required} value={state.ocr.files[item.id]} accept=".pdf,.jpg,.jpeg,.png" onPick={(name) => updateFile("ocr", item.id, { selected: name, uploaded: null })} onUpload={() => updateFile("ocr", item.id, { uploaded: state.ocr.files[item.id].selected })} />)}</div><div className="mt-4 flex justify-end"><Button variant="primary" size="sm" disabled={!canAnalyzeOcr} onClick={() => setDataPhase("ocr-result")}>Analisis Dokumen</Button></div></SectionCard></>}
      {stage === "data-barang" && dataPhase === "ocr-result" && <><AssistantMessage>Dokumen selesai dibaca. Pilih atau konfirmasi HS Code untuk setiap barang sebelum melanjutkan.</AssistantMessage><SectionCard eyebrow="Barang Terdeteksi" title="Rekomendasi HS Code" description="Rekomendasi AI membantu pencarian dan bukan keputusan klasifikasi final."><GoodsTable source={uploadedSourceDocs[0] ?? "Invoice.pdf"} review hsCodes={state.ocr.hsCodes} onHsChange={(seri, hs) => setState((current) => ({ ...current, ocr: { ...current.ocr, hsCodes: { ...current.ocr.hsCodes, [seri]: hs } } }))} /><div className="mt-4 flex justify-end"><Button variant="primary" size="sm" disabled={!canContinueOcr} onClick={enterPermits}>Lanjut Identifikasi Perizinan</Button></div></SectionCard></>}

      {stage === "perizinan" && <><AssistantMessage>Saya memeriksa HS Code, regulasi terkait, dan perizinan yang telah terdaftar pada akun INSW Anda.</AssistantMessage>{permitChecking ? <SectionCard eyebrow="Identifikasi Perizinan" title="Mencocokkan perizinan user…"><div className="space-y-2 text-[12px] text-neutral-700"><div>✓ Memeriksa HS Code</div><div>✓ Mengidentifikasi regulasi</div><div className="animate-pulse">● Mencocokkan perizinan user</div></div></SectionCard> : <SectionCard eyebrow="Hasil Perizinan" title="2 perizinan ditemukan" description="HS 8471.30.10 · Laptop Computer"><div className="grid gap-3 md:grid-cols-2">{[{ id: "pi", name: "Perizinan Elektronik", detail: "PI-ELK-2026-00881 · Aktif · Berlaku sampai 31 Desember 2026 · Kementerian Perdagangan" }, { id: "masterlist", name: "Masterlist Fasilitas", detail: "ML-00123 · Aktif · Berlaku sampai 30 Juni 2027 · BKPM" }].map((permit) => <ChoiceButton key={permit.id} selected={state.permits.selected === permit.id} title={permit.name} description={permit.detail} onClick={() => setState((current) => ({ ...current, permits: { ...current.permits, selected: permit.id } }))} />)}</div>{state.permits.choice === "manual" && <ManualPermit state={state.permits.manual} onChange={(key, value) => setState((current) => ({ ...current, permits: { ...current.permits, manual: { ...current.permits.manual, [key]: value } } }))} />}<div className="mt-4 flex flex-wrap justify-end gap-3"><Button variant="outline" size="sm" onClick={() => setState((current) => ({ ...current, permits: { ...current.permits, choice: "skipped", selected: null } }))}>Lewati</Button><Button variant="outline" size="sm" onClick={() => setState((current) => ({ ...current, permits: { ...current.permits, choice: "manual", selected: null } }))}>Input Manual</Button><Button variant="primary" size="sm" disabled={!state.permits.selected && state.permits.choice !== "manual" && state.permits.choice !== "skipped"} onClick={() => { setState((current) => ({ ...current, permits: { ...current.permits, choice: current.permits.choice ?? "existing" } })); setStage("lampiran"); }}>Lanjut ke Dokumen Lampiran</Button></div>{state.permits.choice === "skipped" && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">Perizinan terindikasi relevan. Pastikan kelengkapannya ditinjau kembali sebelum submit.</div>}</SectionCard>}</>}

      {stage === "lampiran" && <><AssistantMessage>Apakah Anda ingin mengunggah dokumen lampiran wajib maupun pendukung?</AssistantMessage>{!showAttachmentUpload ? <SectionCard eyebrow="Dokumen Lampiran" title="Lengkapi dokumen pengajuan" description="Dokumen akan dianalisis dan dipetakan tanpa menimpa data Excel secara otomatis."><div className="flex justify-end gap-3"><Button variant="outline" size="sm" onClick={() => setStage("review")}>Lewati</Button><Button variant="primary" size="sm" onClick={() => setShowAttachmentUpload(true)}>Upload Dokumen</Button></div></SectionCard> : <SectionCard eyebrow="Dokumen Lampiran" title="Dokumen Wajib dan Pendukung"><div className="space-y-3">{ATTACHMENT_DOCUMENTS.map((item) => <FileRow key={item.id} label={item.label} required={item.required} value={state.attachments[item.id]} accept=".pdf,.jpg,.jpeg,.png" onPick={(name) => updateFile("attachments", item.id, { selected: name, uploaded: null })} onUpload={() => updateFile("attachments", item.id, { uploaded: state.attachments[item.id].selected })} />)}</div>{analyzingDocuments && <div className="mt-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-3 text-[12px] text-brand-primary-700">OCR dokumen → Parsing data → Mapping field → {source === "Excel" ? "Cross-check dengan Excel" : "Normalisasi hasil OCR"}</div>}<div className="mt-4 flex justify-end"><Button variant="primary" size="sm" disabled={!canAnalyzeAttachments || analyzingDocuments} onClick={continueToReview}>Lanjut ke Analisis Dokumen</Button></div></SectionCard>}</>}

      {stage === "review" && <><AssistantMessage>Semua sumber sudah dinormalisasi. Tinjau hasil mapping sebelum data diteruskan untuk mengisi Form Pengajuan.</AssistantMessage><SectionCard eyebrow="Review Data" title="Ringkasan Hasil"><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{[["Barang", 2], ["HS Code", 2], ["Perizinan", state.permits.choice === "existing" ? selectedPermitIds.length : state.permits.choice === "manual" ? 1 : 0], ["Dokumen", uploadedAttachments.length + uploadedSourceDocs.length], ["Field dipetakan", 18], ["Perlu ditinjau", state.excel.skipped ? 2 : 1]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border-primary p-3"><div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div><div className="mt-2 text-[22px] font-semibold text-neutral-800">{value}</div></div>)}</div></SectionCard><SectionCard eyebrow="Hasil Mapping" title="Normalized data siap diteruskan"><FinalTable source={source} permit={state.permits.choice === "existing" ? `${selectedPermitIds.length} izin terpilih` : state.permits.choice === "manual" ? "Input manual" : "Belum dipilih"} documents={uploadedAttachments.length + uploadedSourceDocs.length} hsCodes={state.ocr.hsCodes} /><div className="mt-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-3 text-[12px] leading-5 text-brand-primary-800">Data berikut akan diisi otomatis berdasarkan hasil Smart Submission Assistant. Pengguna tetap dapat melakukan koreksi sebelum submit.</div><div className="mt-4 flex flex-wrap justify-end gap-3"><Button variant="outline" size="sm" onClick={() => setStage("data-barang")}>Kembali Periksa Data</Button><Button variant="primary" size="sm" onClick={submitDraft}>Lanjut ke Form Pengajuan</Button></div></SectionCard></>}
    </div></main>
    <footer className="border-t border-border-primary bg-[#f8fbff] px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-3"><span className="text-[12px] text-neutral-600">Data Anda aman dan hanya digunakan untuk keperluan pengajuan.</span><ModalCancelButton onClick={onClose} /></div></footer>
  </div></div>;
}

function GoodsTable({ source, review, hsCodes, onHsChange }: { source: string; review: boolean; hsCodes: Record<string, string>; onHsChange: (seri: string, hs: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-primary">
      <table className="min-w-full text-left text-[12px]">
        <thead className="bg-background-primary/50 text-neutral-600">
          <tr>{["Seri", "Uraian Barang", "HS Code", "Qty", "Satuan", "Sumber Data", "Status Mapping"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
        </thead>
        <tbody>
          {GOODS.map((item) => {
            const hs = hsCodes[item.seri] ?? "";
            const alternativeHs = item.seri === "1" ? "8471.30.90" : "8504.40.19";
            return (
              <tr key={item.seri} className="border-t border-border-primary">
                <td className="px-4 py-3 font-semibold">{item.seri}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="min-w-[240px] px-4 py-3">
                  {review ? (
                    <div>
                      <StatusBadge tone="info">Rekomendasi AI</StatusBadge>
                      <Select
                        className="mt-2"
                        value={hs}
                        placeholder="Pilih HS Code"
                        options={[{ label: item.hs, value: item.hs }, { label: alternativeHs, value: alternativeHs }]}
                        onValueChange={(value) => onHsChange(item.seri, value)}
                      />
                    </div>
                  ) : item.hs}
                </td>
                <td className="px-4 py-3">{item.qty}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">{source}</td>
                <td className="px-4 py-3"><StatusBadge tone={review && !hs ? "warning" : "success"}>{review && !hs ? "Perlu dicek" : "Sesuai"}</StatusBadge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function ManualPermit({ state, onChange }: { state: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/40 p-4">
      <div className="text-[13px] font-semibold text-neutral-800">Input Manual Perizinan</div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Select
          label="Jenis Perizinan"
          value={state.type ?? ""}
          placeholder="Pilih jenis perizinan"
          options={[
            { label: "Perizinan Elektronik", value: "perizinan_elektronik" },
            { label: "Masterlist Fasilitas", value: "masterlist_fasilitas" },
            { label: "Sertifikat Produk", value: "sertifikat_produk" },
            { label: "Perizinan Lainnya", value: "lainnya" },
          ]}
          onValueChange={(value) => onChange("type", value)}
        />
        <label className="text-[11px] font-medium text-neutral-600">Nomor<input value={state.number ?? ""} onChange={(event) => onChange("number", event.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100" /></label>
        <label className="text-[11px] font-medium text-neutral-600">Tanggal<input type="date" value={state.date ?? ""} onChange={(event) => onChange("date", event.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100" /></label>
      </div>
    </div>
  );
}
function FinalTable({ source, permit, documents, hsCodes }: { source: string; permit: string; documents: number; hsCodes: Record<string, string> }) {
  return <div className="overflow-x-auto rounded-2xl border border-border-primary"><table className="min-w-full text-left text-[12px]"><thead className="bg-background-primary/50"><tr>{["Seri", "Uraian Barang", "HS Code", "Sumber Utama", "Perizinan", "Dokumen", "Status"].map((item) => <th key={item} className="px-4 py-3 font-semibold text-neutral-600">{item}</th>)}</tr></thead><tbody>{GOODS.map((item, index) => <tr key={item.seri} className="border-t border-border-primary"><td className="px-4 py-3">{item.seri}</td><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">{hsCodes[item.seri] || item.hs}</td><td className="px-4 py-3">{source}</td><td className="px-4 py-3">{index === 0 ? permit : "Tidak terindikasi"}</td><td className="px-4 py-3">{documents} file</td><td className="px-4 py-3"><StatusBadge tone={permit === "Belum dipilih" && index === 0 ? "warning" : "success"}>{permit === "Belum dipilih" && index === 0 ? "Perlu Ditinjau" : "Siap"}</StatusBadge></td></tr>)}</tbody></table></div>;
}
