import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatedDrawer } from "../components/AnimatedDrawer";
import { Button } from "../components/Button";
import { CollapsibleSectionCard } from "../components/CollapsibleSectionCard";
import { Input, Select, Textarea } from "../components/FormControls";
import { Card, CardBody, CardFooter, Modal } from "../components/Surface";
import { SUBMISSION_PREPARATION_STORAGE_KEY, type SubmissionPreparation } from "./dashboard/formSnapshotData";

type HsSource = "MASTER_LIST" | "PIB_HISTORY" | "BTKI" | "MANUAL" | null;
type Good = { no: string; description: string; hsCode: string; quantity: number; unit: string; currency: string; cif: number; permitStatus: string; hsSource?: HsSource; hsConfirmed?: boolean };
type SupportingDocument = { id: number; type: string; number: string; date: string; fileName: string };
type HsTab = "master" | "history" | "btki";

const GOODS: Good[] = [
  { no: "001", description: "Bibit Mawar Merah", hsCode: "0602.40.00", quantity: 100, unit: "BPT", currency: "USD", cif: 1200, permitStatus: "Wajib KT" },
  { no: "002", description: "Bibit Mawar Putih", hsCode: "0602.40.00", quantity: 150, unit: "BPT", currency: "USD", cif: 1800, permitStatus: "Wajib KT" },
  { no: "101", description: "Router Gateway A1", hsCode: "8517.62.21", quantity: 50, unit: "C62", currency: "USD", cif: 5000, permitStatus: "SDPPI" },
  { no: "181", description: "Pupuk Organik Cair", hsCode: "3105.90.00", quantity: 500, unit: "KGM", currency: "USD", cif: 2500, permitStatus: "Bebas Lartas" },
  { no: "240", description: "Media Tanam Gambut", hsCode: "2703.00.00", quantity: 300, unit: "KGM", currency: "USD", cif: 1100, permitStatus: "Bebas Lartas" },
];

const OCR_GOODS: Good[] = [
  { no: "1", description: "Wireless Router Dual Band 5GHz", hsCode: "8471.30.10", quantity: 10, unit: "C62", currency: "USD", cif: 3500, permitStatus: "Perlu review", hsSource: null, hsConfirmed: false },
  { no: "2", description: "Network Switch 24 Port", hsCode: "8471.30.90", quantity: 4, unit: "C62", currency: "USD", cif: 2200, permitStatus: "Perlu review", hsSource: null, hsConfirmed: false },
  { no: "3", description: "Wireless Access Point", hsCode: "", quantity: 8, unit: "C62", currency: "USD", cif: 1800, permitStatus: "HS belum ditetapkan", hsSource: null, hsConfirmed: false },
  { no: "4", description: "Fiber Optic Transceiver", hsCode: "", quantity: 12, unit: "C62", currency: "USD", cif: 1250, permitStatus: "HS belum ditetapkan", hsSource: null, hsConfirmed: false },
  { no: "5", description: "Metal Mounting Bracket", hsCode: "7326.90.99", quantity: 2, unit: "C62", currency: "USD", cif: 350, permitStatus: "Bebas Lartas", hsSource: null, hsConfirmed: false },
];

const EXTRACTION_DRAFT_STORAGE_KEY = "insw-extraction-detail-draft";

const PERMIT_GROUPS = [
  { hsCode: "0602.40.00", title: "Tanaman Hidup Mawar", range: "Seri 001 s.d. Seri 100", total: 100, regulation: "Karantina Tumbuhan (PP 14/2002)", code: "940", types: "KT-2 / KT-9 / SP-5 / KT-13", status: "VALID" as const },
  { hsCode: "8517.62.21", title: "Perangkat Transmisi / Router", range: "Seri 101 s.d. Seri 180", total: 80, regulation: "Sertifikasi Alat Telekomunikasi (Kominfo)", code: "310", types: "SDPPI", status: "MISSING" as const },
];

const FALLBACK: SubmissionPreparation = {
  documentType: "BC20", documentLabel: "BC 2.0", requiredDocuments: ["invoice", "packing_list", "bill_of_lading"], inputMethod: "EXCEL",
  spreadsheet: { fileName: "data_barang_pt_abc.xlsx", totalItems: 240, totalHsCodes: 4, totalCif: 42500, currency: "USD" }, permitRequirements: [], hasAdditionalDocuments: true, extractionMode: "EXCEL", initializationComplete: true,
};

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "error" | "info" }) {
  const classes = { neutral: "bg-neutral-100 text-neutral-700", success: "bg-success-50 text-success-700", warning: "bg-warning-50 text-warning-700", error: "bg-error-50 text-error-700", info: "bg-brand-primary-50 text-brand-primary-700" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${classes[tone]}`}>{children}</span>;
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: ReactNode }) {
  return <div id={id} className="scroll-mt-[calc(var(--shell-sticky-top)+1.5rem)]"><CollapsibleSectionCard title={title} subtitle={subtitle} className="shadow-none">{children}</CollapsibleSectionCard></div>;
}

function FileField({ label, hint = "PDF, Maks 5MB", onChange }: { label: string; hint?: string; onChange?: (name: string) => void }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[12px] font-medium text-neutral-700">{label}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => onChange?.(event.target.files?.[0]?.name ?? "")} className="block h-11 w-full rounded-md border border-border-primary bg-white px-2 py-1.5 text-[12px] text-neutral-700 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary-500 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-white hover:file:bg-brand-primary-600 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100" /><span className="text-[10px] text-neutral-500">{hint}</span></label>;
}

function DataTable({ children }: { children: ReactNode }) { return <div className="overflow-x-auto rounded-xl border border-border-primary"><table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-[11px]">{children}</table></div>; }
function Th({ children }: { children: ReactNode }) { return <th className="border-b border-border-primary bg-neutral-50 px-3 py-3 font-semibold text-neutral-600">{children}</th>; }
function Td({ children, className = "" }: { children: ReactNode; className?: string }) { return <td className={`border-b border-border-primary px-3 py-3 text-neutral-700 ${className}`}>{children}</td>; }

function HsAssignmentModal({ open, item, onClose, onApply }: { open: boolean; item: Good | null; onClose: () => void; onApply: (hsCode: string, source: Exclude<HsSource, null>) => void }) {
  const [tab, setTab] = useState<HsTab>("master");
  const [selected, setSelected] = useState("8517.62.21");
  const [manual, setManual] = useState("");
  useEffect(() => { if (open) { setTab("master"); setSelected(item?.hsCode || "8517.62.21"); setManual(""); } }, [open, item]);
  const cards = tab === "master" ? [{ hs: "8517.62.21", lines: [["Uraian Master", "Unit Router Transmisi Digital Dual Band 5G"], ["Part Number", "RT-5G-DUAL-01"], ["Satuan Wajib", "U (Unit)"], ["Dokumen Izin", "Perlu Sertifikasi SDPPI (Kode: 310)"], ["Terakhir Update", "15/01/2026"]] }] : tab === "history" ? [
    { hs: "8517.62.21", lines: [["No. Aju PIB", "000020-001289-20251120-000109"], ["Tanggal Aju", "20/11/2025"], ["Status", "SPPB Jalur Hijau"], ["Uraian PIB", "Wireless Router Dual Band Indoor Unit"], ["Satuan Wajib", "U (Unit)"]] },
    { hs: "8517.62.99", lines: [["No. Aju PIB", "000020-001107-20250911-000084"], ["Tanggal Aju", "11/09/2025"], ["Status", "SPPB"], ["Uraian PIB", "Perangkat jaringan lainnya"], ["Satuan Wajib", "U (Unit)"]] },
  ] : [{ hs: "8517.62.21", lines: [["Akurasi Kemiripan", "96%"], ["Uraian BTKI", "Perangkat transmisi digital untuk data, termasuk unit router & switch"], ["Satuan Wajib", "U (Unit) / NMB"], ["Ketentuan Lartas", "Wajib Sertifikasi SDPPI Kominfo (Kode: 310)"], ["Tarif Masuk", "Bea Masuk: 0% · PPN: 11% · PPh: 2.5%"]] }];
  const headings = { master: "MASTER LIST PERUSAHAAN (INTERNAL DATA)", history: "RIWAYAT PIB TERDAHULU (HISTORICAL DATA)", btki: "REKOMENDASI BTKI LNSW (SISTEM TARIFF ENGINE)" };
  return <Modal open={open} onClose={onClose} title="PENETAPAN POS TARIF (HS CODE)" description={`Uraian Barang Dokumen: “${item?.description ?? "-"}”`} widthClassName="w-[min(96vw,1040px)]" panelClassName="max-h-[90vh]" bodyClassName="max-h-[calc(90vh-150px)] overflow-y-auto" footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose}>Batal</Button><Button disabled={!manual && !selected} onClick={() => onApply(manual || selected, manual ? "MANUAL" : tab === "master" ? "MASTER_LIST" : tab === "history" ? "PIB_HISTORY" : "BTKI")}>PILIH & TERAPKAN</Button></div>}>
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">{(["master", "history", "btki"] as HsTab[]).map((key) => <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-lg px-2 py-3 text-[10px] font-semibold sm:text-[11px] ${tab === key ? "bg-white text-brand-primary-700 shadow-sm" : "text-neutral-600"}`}>{key === "master" ? "MASTER LIST PERUSAHAAN" : key === "history" ? "RIWAYAT PIB" : "REKOMENDASI BTKI"}</button>)}</div>
    <h4 className="mt-5 text-[13px] font-semibold text-neutral-800">{headings[tab]}</h4><div className="mt-3 space-y-3">{cards.map((card) => <label key={card.hs} className={`block cursor-pointer rounded-2xl border p-4 ${selected === card.hs && !manual ? "border-brand-primary-500 bg-brand-primary-50/40" : "border-border-primary bg-white"}`}><div className="flex items-start gap-3"><input type="radio" checked={selected === card.hs && !manual} onChange={() => { setSelected(card.hs); setManual(""); }} className="mt-1" /><div className="min-w-0 flex-1"><div className="text-[10px] text-neutral-500">Pos Tarif (HS)</div><div className="mt-1 text-[17px] font-semibold text-brand-primary-700">{card.hs}</div><div className="mt-3 grid gap-3 sm:grid-cols-2">{card.lines.map(([label, value]) => <div key={label}><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 text-[11px] font-medium text-neutral-800">{value}</div></div>)}</div></div></div></label>)}</div>
    <div className="mt-5 rounded-2xl border border-border-primary bg-neutral-50 p-4"><div className="text-[11px] font-semibold text-neutral-800">OPSI MANUAL: Masukkan Pos Tarif di Luar Ketiga Sumber</div><Input className="mt-3" value={manual} onChange={(event) => { setManual(event.target.value.replace(/[^0-9.]/g, "")); setSelected(""); }} placeholder="Contoh: 8517.62.21" hint="Gunakan format Pos Tarif yang berlaku." /></div>
  </Modal>;
}

function GoodsDrawer({ item, open, onClose, onEditHs }: { item: Good | null; open: boolean; onClose: () => void; onEditHs: () => void }) {
  return <AnimatedDrawer open={open} onClose={onClose} ariaLabel="Detail Barang" panelClassName="max-w-[640px]" renderContent={() => <div className="flex h-full flex-col"><div className="flex items-start justify-between border-b border-border-primary p-5"><div><div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-primary-600">Kelola Detail</div><h2 className="mt-2 text-[20px] font-semibold text-neutral-800">Seri {item?.no} · {item?.description}</h2></div><button type="button" onClick={onClose} className="h-9 w-9 rounded-full border border-border-primary text-[18px]">×</button></div><div className="flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2">{[["Uraian Barang", item?.description], ["Quantity", item?.quantity], ["Satuan", item?.unit], ["Nilai CIF", `${item?.currency} ${item?.cif.toLocaleString("en-US")}`], ["HS Code", item?.hsCode || "Belum Ditetapkan"], ["Status Perizinan", item?.permitStatus]].map(([label, value]) => <div key={label} className="rounded-xl border border-border-primary p-3"><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{value}</div></div>)}</div></div><div className="flex justify-end gap-3 border-t border-border-primary p-4"><Button variant="outline" onClick={onClose}>Tutup</Button><Button onClick={onEditHs}>Ubah HS Code</Button></div></div>} />;
}

function SeriesDetailModal({ open, group, goods, onClose }: { open: boolean; group: (typeof PERMIT_GROUPS)[number] | null; goods: Good[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { if (open) { setQuery(""); setPage(1); } }, [open, group]);
  const groupedSeries = useMemo(() => goods.filter((item) => item.hsCode === group?.hsCode), [goods, group]);
  const filtered = groupedSeries.filter((item) => `${item.no} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <Modal open={open} onClose={onClose} title="Rincian Daftar Seri Barang" description="Daftar seri barang pada kelompok Pos Tarif yang sama." widthClassName="w-[min(96vw,1120px)]" panelClassName="max-h-[90vh]" bodyClassName="max-h-[calc(90vh-150px)] overflow-y-auto" footer={<div className="flex justify-end"><Button variant="outline" onClick={onClose}>Tutup</Button></div>}>
    <div className="grid gap-3 rounded-xl border border-border-primary bg-neutral-50 p-4 sm:grid-cols-3"><div><div className="text-[10px] text-neutral-500">Pos Tarif</div><div className="mt-1 text-[15px] font-semibold text-brand-primary-700">{group?.hsCode}</div></div><div><div className="text-[10px] text-neutral-500">Uraian</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{group?.title}</div></div><div><div className="text-[10px] text-neutral-500">Total</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{group?.total ?? 0} Seri</div></div></div>
    <Input className="mt-4" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari nomor seri atau uraian barang..." />
    <div className="mt-4"><DataTable><thead><tr>{["Seri", "Uraian Barang", "Pos Tarif (HS)", "Jumlah", "Satuan", "Valuta", "Nilai CIF", "Status Izin"].map((label) => <Th key={label}>{label}</Th>)}</tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.no}><Td>{item.no}</Td><Td>{item.description}</Td><Td>{item.hsCode}</Td><Td>{item.quantity}</Td><Td>{item.unit}</Td><Td>{item.currency}</Td><Td>{item.cif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Td><Td>{item.permitStatus}</Td></tr>) : <tr><td colSpan={8} className="px-4 py-8 text-center text-[11px] text-neutral-500">Tidak ada seri yang sesuai pencarian.</td></tr>}</tbody></DataTable></div>
    <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-neutral-600"><span>Halaman {page} dari {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹ Sebelumnya</Button><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Selanjutnya ›</Button></div></div>
  </Modal>;
}

export function ExtractionWorkspacePage() {
  const navigate = useNavigate();
  const preparation = useMemo(() => { try { const raw = sessionStorage.getItem(SUBMISSION_PREPARATION_STORAGE_KEY); return raw ? JSON.parse(raw) as SubmissionPreparation : FALLBACK; } catch { return FALLBACK; } }, []);
  const isExcel = preparation.inputMethod === "EXCEL" || preparation.extractionMode === "EXCEL";
  const documentLabel = preparation.documentLabel ?? preparation.documentType.replace("BC", "BC ");
  const requiredCount = Array.isArray(preparation.requiredDocuments) ? preparation.requiredDocuments.length : Object.values(preparation.requiredDocuments).filter(Boolean).length;
  const [goods, setGoods] = useState<Good[]>(isExcel ? GOODS : OCR_GOODS);
  const [activeSection, setActiveSection] = useState("summary");
  const [hsItem, setHsItem] = useState<Good | null>(null);
  const [detailItem, setDetailItem] = useState<Good | null>(null);
  const [seriesGroup, setSeriesGroup] = useState<(typeof PERMIT_GROUPS)[number] | null>(null);
  const [openPermits, setOpenPermits] = useState<Record<string, boolean>>({ "8517.62.21": true });
  const [supportExpanded, setSupportExpanded] = useState(preparation.hasAdditionalDocuments);
  const [supportDocs, setSupportDocs] = useState<SupportingDocument[]>(preparation.hasAdditionalDocuments ? [{ id: 1, type: "", number: "", date: "", fileName: "" }] : []);
  const [notes, setNotes] = useState("");
  const [warning, setWarning] = useState(false);
  const [ocrUploadMode, setOcrUploadMode] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const sections = useMemo(() => [
    { id: "summary", label: "Ringkasan Pengajuan" }, { id: "source", label: "Sumber Data" },
    ...(!isExcel ? [{ id: "ocr", label: "Hasil Ekstraksi OCR" }] : []),
    { id: "goods", label: "Rincian Barang & Pos Tarif" }, { id: "permits", label: "Perizinan" }, { id: "supporting", label: "Dokumen Fasilitas / Tambahan" },
  ], [isExcel]);

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const pageBottom = window.scrollY + window.innerHeight;
        const documentBottom = document.documentElement.scrollHeight;
        if (pageBottom >= documentBottom - 48) {
          setActiveSection(sections[sections.length - 1]?.id ?? "summary");
          return;
        }
        const stickyTop = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shell-sticky-top")) || 92;
        const activationLine = stickyTop + 56;
        let nextActive = sections[0]?.id ?? "summary";
        sections.forEach(({ id }) => {
          const node = document.getElementById(`section-${id}`);
          if (node && node.getBoundingClientRect().top <= activationLine) nextActive = id;
        });
        setActiveSection(nextActive);
      });
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  const jump = (id: string) => { const target = document.getElementById(`section-${id}`); if (!target) return; const sticky = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shell-sticky-top")) || 92; window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - sticky - 24, behavior: "smooth" }); };
  const applyHs = (hsCode: string, source: Exclude<HsSource, null>) => { if (!hsItem) return; setGoods((current) => current.map((item) => item.no === hsItem.no ? { ...item, hsCode, hsSource: source, hsConfirmed: true, permitStatus: "Perlu review" } : item)); setHsItem(null); };
  const addSupporting = () => { setSupportExpanded(true); setSupportDocs((current) => [...current, { id: Date.now(), type: "", number: "", date: "", fileName: "" }]); };
  const updateSupporting = (id: number, patch: Partial<SupportingDocument>) => setSupportDocs((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  const missingHs = goods.filter((item) => !item.hsCode).length;
  const confirmedHs = isExcel ? goods.length : goods.filter((item) => item.hsCode && item.hsConfirmed).length;
  const allHsCodesAssigned = isExcel || goods.every((item) => Boolean(item.hsCode && item.hsConfirmed));
  const saveExtractionDraft = (showSuccess = false) => {
    const saved = new Date().toISOString();
    sessionStorage.setItem(EXTRACTION_DRAFT_STORAGE_KEY, JSON.stringify({ status: "SAVED", documentType: preparation.documentType, goods, hsAssignments: goods.map(({ no, hsCode, hsSource, hsConfirmed }) => ({ series: no, hsCode, hsSource, hsConfirmed })), permitGroups: PERMIT_GROUPS, supportingDocuments: supportDocs, savedAt: saved }));
    setSavedAt(saved);
    setWarning(false);
    if (showSuccess) setSuccessOpen(true);
  };
  const handleFinalAction = () => { if (missingHs > 0 || PERMIT_GROUPS.some((group) => group.status === "MISSING")) { setWarning(true); return; } saveExtractionDraft(true); };

  return <div className="mx-auto w-full max-w-[1480px] pb-4 pt-2 sm:pt-3">
    <Card className="overflow-visible rounded-[24px] shadow-sm">
      <div className="m-4 mb-0 rounded-2xl border border-brand-primary-200 bg-gradient-to-r from-brand-primary-700 to-brand-primary-500 p-5 text-white sm:m-5 sm:mb-0 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Formulir Lanjutan</div><h1 className="mt-2 text-[24px] font-semibold">Formulir Ekstraksi & Rincian</h1><p className="mt-2 max-w-3xl text-[12px] leading-6 text-white/80">Workspace untuk meninjau sumber data, hasil ekstraksi, rincian barang, Pos Tarif, dan dokumen pendukung sebelum diteruskan ke Formulir Utama Pabean.</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold">{documentLabel}</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold">{isExcel ? "Spreadsheet Excel" : "Ekstraksi Invoice"}</span><span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-primary-700">Draf</span></div></div></div>
      <div className="mx-5 flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-[11px] text-neutral-600"><span><b className="text-success-700">Status: Berkas Terverifikasi</b></span><span>Sumber: <b>{isExcel ? preparation.spreadsheet?.fileName ?? "data_barang_pt_abc.xlsx" : "inv_10829.pdf"}</b></span><span><b>{isExcel ? preparation.spreadsheet?.totalItems ?? 240 : goods.length}</b> Seri Barang</span><span><b>{isExcel ? preparation.spreadsheet?.totalHsCodes ?? 4 : confirmedHs}</b> Pos Tarif ditetapkan</span></div>

      <CardBody className="border-t border-border-primary p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]"><aside className="h-fit rounded-2xl border border-border-primary bg-white p-3 shadow-sm lg:sticky lg:top-[calc(var(--shell-sticky-top)+0.75rem)]"><div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Table of Content</div><p className="px-2 pb-3 text-[10px] leading-5 text-neutral-500">Lompat ke bagian formulir yang ingin ditinjau.</p><nav className="space-y-1">{sections.map((section, index) => <button key={section.id} type="button" onClick={() => jump(section.id)} className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2.5 text-left text-[11px] transition ${activeSection === section.id ? "border-brand-primary-400 bg-brand-primary-50 font-semibold text-brand-primary-700" : "border-transparent text-neutral-700 hover:bg-brand-primary-50"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold ${activeSection === section.id ? "bg-brand-primary-500 text-white" : "bg-neutral-100"}`}>{index + 1}</span>{section.label}</button>)}</nav></aside>

        <div className="min-w-0 space-y-3" onClickCapture={(event) => { const target = event.target as HTMLElement; if (target.textContent?.trim() !== "Lihat Rincian Seri") return; const groupContainer = target.closest(".overflow-hidden.rounded-2xl"); const group = PERMIT_GROUPS.find((item) => groupContainer?.textContent?.includes(item.hsCode)); if (group) setSeriesGroup(group); }}>
        <Section id="section-summary" title="Ringkasan Pengajuan" subtitle="Data persiapan yang diteruskan dari Smart Submission Assistant."><div className="grid gap-3 sm:grid-cols-4">{[["Dokumen", documentLabel], ["Dokumen wajib", `${requiredCount} file`], ["Sumber data", isExcel ? "Spreadsheet Excel" : "Ekstraksi Otomatis Invoice"], ["Dokumen tambahan", preparation.hasAdditionalDocuments ? "Akan dilampirkan" : "Opsional"]].map(([label, value]) => <div key={label} className="rounded-xl border border-border-primary bg-background-primary/30 p-3"><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{value}</div></div>)}</div></Section>

        <Section id="section-source" title="Sumber Data" subtitle={isExcel ? "Ringkasan spreadsheet yang telah divalidasi oleh Assistant." : "Dokumen sumber yang diproses pada jalur OCR."}>{isExcel ? <div className="grid gap-3 sm:grid-cols-4">{[["File", preparation.spreadsheet?.fileName ?? "data_barang_pt_abc.xlsx"], ["Total Seri Barang", preparation.spreadsheet?.totalItems ?? 240], ["Total Pos Tarif", preparation.spreadsheet?.totalHsCodes ?? 4], ["Total CIF", `${preparation.spreadsheet?.currency ?? "USD"} ${(preparation.spreadsheet?.totalCif ?? 42500).toLocaleString("en-US", { minimumFractionDigits: 2 })}`]].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-50 p-3"><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 truncate text-[12px] font-semibold text-neutral-800">{value}</div></div>)}</div> : <div className="grid gap-3 sm:grid-cols-4">{[["Invoice", "inv_10829.pdf"], ["Status", ocrUploadMode ? "Menunggu proses" : "OCR selesai"], ["Barang terdeteksi", goods.length], ["HS Code telah dikonfirmasi", `${confirmedHs} dari ${goods.length}`]].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-50 p-3"><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{value}</div></div>)}</div>}</Section>

        {!isExcel ? <Section id="section-ocr" title="Preview Parsing OCR & Penetapan HS Code" subtitle="Ringkasan hasil AI dan sumber data"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] leading-5 text-neutral-600">AI akan membaca file yang diunggah, lalu menyiapkan data untuk auto fill sebelum masuk ke form.</p><Status tone="info">Jenis dokumen: {documentLabel}</Status></div><div className="mb-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-3"><div className="flex items-center justify-between gap-3 text-[11px]"><b className="text-brand-primary-800">Penetapan Pos Tarif</b><span className="font-semibold text-brand-primary-700">{confirmedHs} / {goods.length} Terisi</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-primary-500 transition-all" style={{ width: `${(confirmedHs / goods.length) * 100}%` }} /></div>{!allHsCodesAssigned ? <p className="mt-2 text-[10px] text-warning-700">{goods.length - confirmedHs} barang masih memerlukan penetapan dan konfirmasi HS Code.</p> : <p className="mt-2 text-[10px] text-success-700">Seluruh HS Code telah ditetapkan dan dikonfirmasi.</p>}</div>{ocrUploadMode ? <div className="rounded-2xl border-2 border-dashed border-border-primary p-8 text-center"><div className="text-[13px] font-semibold text-neutral-800">Dokumen sumber tetap tersimpan</div><p className="mt-2 text-[11px] text-neutral-500">Pilih ulang sumber OCR bila diperlukan tanpa menghapus hasil sebelumnya.</p><Button className="mt-4" onClick={() => setOcrUploadMode(false)}>Gunakan Dokumen Tersimpan</Button></div> : <><DataTable><thead><tr>{["Seri", "Uraian", "HS Code", "Quantity", "Detail"].map((item) => <Th key={item}>{item}</Th>)}</tr></thead><tbody>{goods.map((item) => <tr key={item.no}><Td>{item.no}</Td><Td>{item.description}</Td><Td><div className="flex flex-col gap-1">{item.hsCode || <Status tone="warning">Belum Ditetapkan</Status>}{item.hsConfirmed ? <Status tone="success">Dikonfirmasi</Status> : item.hsCode ? <span className="text-[9px] text-warning-700">Belum dikonfirmasi</span> : null}</div></Td><Td>{item.quantity}</Td><Td><Button variant="outline" size="sm" onClick={() => setHsItem(item)}>{item.hsCode ? "Ubah HS Code" : "CARI SUGGESTION HS (BTKI)"}</Button></Td></tr>)}</tbody></DataTable><div className="mt-4 flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => setOcrUploadMode(true)}>Kembali ke Upload</Button><div className="flex gap-3"><Button variant="ghost" onClick={() => history.back()}>Batal</Button><Button disabled={!allHsCodesAssigned} onClick={() => jump("goods")}>Lanjut ke Form</Button></div></div></>}</Section> : null}

        <Section id="section-goods" title="Tabel Rincian Item Barang & Pos Tarif" subtitle="Periksa data barang dan penetapan Pos Tarif sebelum melanjutkan."><DataTable><thead><tr>{["No", "Uraian Barang", "Pos Tarif (HS)", "Jml", "Sat", "Valuta", "Nilai CIF", "Status Izin", "Action"].map((item) => <Th key={item}>{item}</Th>)}</tr></thead><tbody>{goods.map((item) => <tr key={item.no}><Td>{item.no}</Td><Td>{item.description}</Td><Td>{item.hsCode || <Status tone="warning">Belum Ditetapkan</Status>}</Td><Td>{item.quantity}</Td><Td>{item.unit}</Td><Td>{item.currency}</Td><Td>{item.cif.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Td><Td><Status tone={item.permitStatus === "Bebas Lartas" ? "success" : item.hsCode ? "warning" : "error"}>{item.permitStatus}</Status></Td><Td><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setDetailItem(item)}>Detail</Button><Button variant="outline" size="sm" onClick={() => setHsItem(item)}>Ubah HS Code</Button></div></Td></tr>)}</tbody></DataTable><div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm">+ Tambah Seri Manual</Button><Button variant="outline" size="sm">Unduh Data Tabel (.CSV)</Button></div><div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600"><span>Halaman 1 dari 24</span><Button variant="ghost" size="sm" disabled>‹ Sebelumnya</Button>{[1, 2, 3].map((page) => <button key={page} className={`h-8 w-8 rounded-md text-[11px] font-semibold ${page === 1 ? "bg-brand-primary-500 text-white" : "border border-border-primary bg-white"}`}>{page}</button>)}<span>…</span><button className="h-8 w-8 rounded-md border border-border-primary bg-white text-[11px] font-semibold">24</button><Button variant="ghost" size="sm">Selanjutnya ›</Button></div></div></Section>

        <Section id="section-permits" title="PENGELOLAAN & VALIDASI DOKUMEN PERIZINAN (LARTAS INSW)" subtitle="Sistem mengelompokkan seri barang berdasarkan Pos Tarif (HS Code) dan mencocokkannya ke database INSW."><div className="space-y-3">{PERMIT_GROUPS.map((group, index) => { const expanded = Boolean(openPermits[group.hsCode]); const valid = group.status === "VALID"; return <div key={group.hsCode} className="overflow-hidden rounded-2xl border border-border-primary"><button type="button" onClick={() => setOpenPermits((current) => ({ ...current, [group.hsCode]: !expanded }))} className="flex w-full items-center justify-between gap-4 bg-white p-4 text-left"><div className="flex flex-wrap items-center gap-x-5 gap-y-2"><div><div className="text-[10px] font-semibold text-brand-primary-700">{group.hsCode}</div><div className="mt-1 text-[13px] font-semibold text-neutral-800">{group.title}</div></div><div className="text-[11px] text-neutral-600">{group.range}<br /><b>{group.total} Seri</b></div><Status tone={valid ? "success" : "warning"}>{valid ? "✓ Terpenuhi" : "⚠ Belum Terpenuhi"}</Status></div><span className="text-[18px] text-neutral-500">{expanded ? "−" : "+"}</span></button>{expanded ? <div className="border-t border-border-primary bg-neutral-50/60 p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">KELOMPOK {index + 1}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-3"><div className="text-[10px] text-neutral-500">Ketentuan Regulasi</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{group.regulation}</div></div><div className="rounded-xl bg-white p-3"><div className="text-[10px] text-neutral-500">Kode Dokumen</div><div className="mt-1 text-[12px] font-semibold text-neutral-800">{group.code} ({group.types})</div></div></div>{valid ? <div className="mt-4 rounded-xl border border-success-200 bg-success-50/50 p-4"><h4 className="text-[12px] font-semibold text-success-700">Hasil Validasi Sistem INSW</h4><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["No", "0192/KT9/2026"], ["Tipe", "KT-9 (Pelepasan Karantina)"], ["Masa Berlaku", "s.d. 30/11/2026"], ["Status", "Aktif"], ["Status Kuota", "Sisa: 15.000 BPT · Kebutuhan: 8.500"], ["Status Validasi", "COCOK & VALID"], ["Cakupan", "Seri 001 - 100"]].map(([label, value]) => <div key={label}><div className="text-[10px] text-neutral-500">{label}</div><div className="mt-1 text-[11px] font-semibold text-neutral-800">{value}</div></div>)}</div></div> : <div className="mt-4"><div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-[11px] leading-5 text-warning-700">Tidak ditemukan Sertifikat Standar / Izin SDPPI untuk Pos Tarif ini pada profil entitas INSW Anda.<br /><b>TIDAK COCOK / BELUM TERSEDIA</b></div><div className="mt-4 rounded-xl border border-border-primary bg-white p-4"><h4 className="text-[12px] font-semibold text-neutral-800">Unggah Berkas Perizinan Manual (Opsional)</h4><div className="mt-3 grid gap-3 sm:grid-cols-3"><Input label="Nomor Izin" placeholder="Masukkan Nomor Sertifikat SDPPI" /><Input label="Tgl Terbit" type="date" /><FileField label="File Bukti" /></div><div className="mt-3 flex justify-end"><Button size="sm">Simpan Berkas</Button></div></div></div>}<button type="button" className="mt-3 text-[11px] font-semibold text-brand-primary-700">Lihat Rincian Seri</button></div> : null}</div>; })}</div>
          <h3 className="mt-6 text-[12px] font-semibold text-neutral-800">MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN</h3><p className="mt-1 text-[10px] text-neutral-500">Ringkasan pemetaan perizinan ke seri barang berdasarkan Pos Tarif.</p><div className="mt-3"><DataTable><thead><tr>{["Pos Tarif", "Cakupan Seri Barang", "Satuan Wajib (BTKI)", "Dokumen Izin Terkait", "Status Pemenuhan", "Risiko Pabean"].map((item) => <Th key={item}>{item}</Th>)}</tr></thead><tbody>{[["0602.40.00", "Seri 001 s.d. 100", "BPT (Batang/Plants)", "KT-9 (0192/KT9/2026)", "Terpenuhi", "Jalur Hijau"], ["8517.62.21", "Seri 101 s.d. 180", "U (Unit) / NMB", "Belum Terlampir", "Belum Terpenuhi", "Jalur Merah"], ["3105.90.00", "Seri 181 s.d. 220", "KGM (Kilogram)", "- (Bebas Lartas)", "Bebas Regulasi", "Normal"]].map((row) => <tr key={row[0]}>{row.map((cell) => <Td key={cell}>{cell}</Td>)}</tr>)}</tbody></DataTable></div></Section>

        <Section id="section-supporting" title="DOKUMEN FASILITAS / DOKUMEN PENDUKUNG LAINNYA" subtitle="Tambahkan COO, Laporan Surveyor, Polis, atau dokumen pendukung lainnya.">{!supportExpanded ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-primary p-4"><p className="text-[11px] text-neutral-600">Anda sebelumnya memilih tidak memiliki dokumen tambahan. Section ini tetap tersedia jika dibutuhkan.</p><Button variant="outline" size="sm" onClick={addSupporting}>+ Tambah Dokumen Pendukung</Button></div> : <><div className="space-y-3">{supportDocs.map((row, index) => <div key={row.id} className="grid gap-3 rounded-xl border border-border-primary p-3 md:grid-cols-[48px_1.1fr_1fr_0.8fr_1fr_auto]"><div className="pt-7 text-center text-[12px] font-semibold text-neutral-600">{String(index + 1).padStart(2, "0")}</div><Select label="Jenis Dokumen" value={row.type} onValueChange={(value) => updateSupporting(row.id, { type: value })} placeholder="Pilih Jenis Dokumen..." options={[{ label: "020 - SKA / COO", value: "020 - SKA / COO" }, { label: "Laporan Surveyor", value: "Laporan Surveyor" }, { label: "Polis", value: "Polis" }, { label: "Dokumen lainnya", value: "Dokumen lainnya" }]} /><Input label="Nomor Dokumen" value={row.number} onChange={(event) => updateSupporting(row.id, { number: event.target.value })} placeholder="Nomor dokumen" /><Input label="Tanggal" type="date" value={row.date} onChange={(event) => updateSupporting(row.id, { date: event.target.value })} /><FileField label="Berkas Lampiran" onChange={(fileName) => updateSupporting(row.id, { fileName })} /><button type="button" aria-label="Hapus dokumen" onClick={() => setSupportDocs((current) => current.filter((item) => item.id !== row.id))} className="mt-6 h-9 w-9 rounded-lg border border-error-200 text-error-600 hover:bg-error-50">×</button></div>)}</div><Button className="mt-4" variant="outline" size="sm" onClick={addSupporting}>+ Tambah Dokumen Pendukung</Button></>}</Section>

        <CollapsibleSectionCard title="Catatan Pengguna" subtitle="Catatan opsional sebelum diteruskan ke Formulir Utama Pabean." defaultOpen={false} className="shadow-none"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tambahkan catatan..." rows={3} /></CollapsibleSectionCard>
        {warning ? <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-[11px] leading-5 text-warning-700"><b>Masih terdapat data yang perlu ditinjau.</b><br />{missingHs} item belum memiliki Pos Tarif.<br />1 kelompok perizinan belum terpenuhi.<div className="mt-3 flex gap-2"><Button variant="outline" size="sm" onClick={() => setWarning(false)}>Periksa Kembali</Button><Button size="sm" onClick={() => saveExtractionDraft(true)}>Tetap Lanjut</Button></div></div> : null}
        </div></div></CardBody>
      <CardFooter className="sticky bottom-0 z-30 flex-wrap justify-between rounded-b-[24px] bg-white/95 px-5 py-4 backdrop-blur"><div className="text-[11px] text-neutral-600"><b className="text-neutral-800">Draf pengajuan {documentLabel}</b><br />{savedAt ? `Draf tersimpan ${new Date(savedAt).toLocaleTimeString("id-ID")}.` : "Perubahan terakhir tersimpan secara lokal."}</div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => saveExtractionDraft(false)}>Simpan Draf</Button><Button onClick={handleFinalAction}>LANJUT KE FORMULIR UTAMA {documentLabel} &gt;</Button></div></CardFooter>
    </Card>

    <HsAssignmentModal open={Boolean(hsItem)} item={hsItem} onClose={() => setHsItem(null)} onApply={applyHs} />
    <GoodsDrawer item={detailItem} open={Boolean(detailItem)} onClose={() => setDetailItem(null)} onEditHs={() => { setHsItem(detailItem); setDetailItem(null); }} />
    <SeriesDetailModal open={Boolean(seriesGroup)} group={seriesGroup} goods={goods} onClose={() => setSeriesGroup(null)} />
    <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Draf Rincian & Perizinan Disimpan" description="Seluruh data workspace telah disimpan sebelum diteruskan ke Formulir Utama." footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setSuccessOpen(false)}>Tutup</Button><Button onClick={() => navigate({ to: "/form" })}>Lanjut ke Formulir Utama {documentLabel}</Button></div>}><div className="rounded-xl border border-success-200 bg-success-50 p-4 text-[12px] leading-6 text-success-700"><b>Draf Rincian & Perizinan berhasil disimpan.</b><br />Data rincian barang, mapping HS, perizinan, serta dokumen fasilitas/tambahan akan diteruskan ke Formulir Utama {documentLabel}.</div></Modal>
  </div>;
}
