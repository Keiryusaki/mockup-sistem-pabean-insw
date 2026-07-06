import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { Button } from "../components/Button";
import { CopyIcon, EyeIcon, PenNewSquareIcon, ProgressIcon, TrashBinTrashIcon } from "../components/Icons";
import { Input, Select } from "../components/FormControls";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

type ProposalStatus = "Draft" | "Proses" | "Disetujui" | "Ditolak";

type ProposalRow = {
  pengajuan: string;
  dokumen: string;
  kirim: string;
  perusahaan: string;
  status: ProposalStatus;
  canEditAfterReject?: boolean;
};

export const proposalRows: ProposalRow[] = [
  {
    pengajuan: "2012342ED12320260606000001",
    dokumen: "BC 2.0 - PIB Impor",
    kirim: "06-06-2026",
    perusahaan: "0027681030529000000000 - PERWIRA MULIA SEMESTA",
    status: "Disetujui",
  },
  {
    pengajuan: "2010142ED12320260606000001",
    dokumen: "BC 2.3 - PIB Ekspor",
    kirim: "06-06-2026",
    perusahaan: "1234567890123456000000 - test",
    status: "Proses",
  },
  {
    pengajuan: "201202BE4BC020260606000001",
    dokumen: "BC 2.7 - PEB",
    kirim: "06-06-2026",
    perusahaan: "0809692049081000000000 - TEST",
    status: "Draft",
  },
  {
    pengajuan: "2011642ED12320260605000005",
    dokumen: "BC 2.0 - PIB Impor",
    kirim: "05-06-2026",
    perusahaan: "1234567890123456000000 - Test",
    status: "Ditolak",
    canEditAfterReject: false,
  },
  {
    pengajuan: "2011642ED12320260605000004",
    dokumen: "BC 2.16 - Lartas",
    kirim: "05-06-2026",
    perusahaan: "1234567890123456000000 - DASINDO",
    status: "Disetujui",
  },
  {
    pengajuan: "2011642ED12320260605000003",
    dokumen: "BC 2.3 - PIB Ekspor",
    kirim: "04-06-2026",
    perusahaan: "1234567890123456000000 - SAMPLE TECH",
    status: "Ditolak",
    canEditAfterReject: true,
  },
];

const menuItems = [
  { to: "/", label: "Dashboard" },
  { to: "/data", label: "Data Pengajuan" },
  { to: "/form", label: "Form Pengajuan" },
  { to: "/loading", label: "Loading State" },
];

const stats = [
  {
    label: "Draft",
    value: "1",
    cardTone: "border-brand-primary-100 bg-brand-primary-50/80",
    hoverTone: "hover:border-brand-primary-200 hover:bg-brand-primary-100",
    textTone: "text-brand-primary-800",
    badgeTone: "bg-brand-primary-500 text-white",
    filter: "Draft",
  },
  {
    label: "Proses",
    value: "1",
    cardTone: "border-info-100 bg-info-50/80",
    hoverTone: "hover:border-info-200 hover:bg-info-100",
    textTone: "text-info-800",
    badgeTone: "bg-info-600 text-white",
    filter: "Proses",
  },
  {
    label: "Disetujui",
    value: "2",
    cardTone: "border-success-100 bg-success-50/80",
    hoverTone: "hover:border-success-200 hover:bg-success-100",
    textTone: "text-success-800",
    badgeTone: "bg-success-600 text-white",
    filter: "Disetujui",
  },
  {
    label: "Ditolak",
    value: "2",
    cardTone: "border-error-100 bg-error-50/80",
    hoverTone: "hover:border-error-200 hover:bg-error-100",
    textTone: "text-error-800",
    badgeTone: "bg-error-600 text-white",
    filter: "Ditolak",
  },
];

const proposalStatusMeta: Record<
  "Semua" | ProposalStatus,
  { label: string; tone: string; activeTone: string; borderTone: string }
> = {
  Semua: {
    label: "Semua",
    tone: "bg-neutral-50 text-neutral-700",
    activeTone: "bg-neutral-800 text-white",
    borderTone: "border-neutral-200",
  },
  Draft: {
    label: "Draft",
    tone: "bg-brand-primary-50 text-brand-primary-700",
    activeTone: "bg-brand-primary-500 text-white",
    borderTone: "border-brand-primary-100",
  },
  Proses: {
    label: "Proses",
    tone: "bg-info-50 text-info-700",
    activeTone: "bg-info-600 text-white",
    borderTone: "border-info-100",
  },
  Disetujui: {
    label: "Disetujui",
    tone: "bg-success-50 text-success-700",
    activeTone: "bg-success-600 text-white",
    borderTone: "border-success-100",
  },
  Ditolak: {
    label: "Ditolak",
    tone: "bg-error-50 text-error-700",
    activeTone: "bg-error-600 text-white",
    borderTone: "border-error-100",
  },
};

const suratExamples = [
  {
    title: "Surat Pengajuan Barang Impor",
    file: "surat_pengajuan_impor_v01.docx",
    type: "DOCX",
    note: "Template dasar untuk pengajuan impor.",
  },
  {
    title: "Surat Pengajuan Ekspor",
    file: "surat_pengajuan_ekspor_v02.docx",
    type: "DOCX",
    note: "Contoh format pengajuan ekspor yang sudah disesuaikan.",
  },
  {
    title: "Lampiran Data Kontainer",
    file: "lampiran_kontainer.xlsx",
    type: "XLSX",
    note: "Contoh file lampiran untuk detail kontainer.",
  },
  {
    title: "Surat Keterangan Tambahan",
    file: "surat_keterangan_tambahan.pdf",
    type: "PDF",
    note: "Referensi surat pendukung untuk kebutuhan verifikasi.",
  },
];

type WizardStep = "identifikasi" | "dokumen" | "parsing";
type NeedChoice = "pemasukan" | "pengeluaran" | "lainnya";
type DetailChoice = "impor_barang" | "pemasukan_kek" | "lainnya_pemasukan" | "ekspor_barang" | "pengeluaran_kek" | "lainnya_pengeluaran" | "barang_masuk" | "barang_keluar" | "kawasan_ekonomi_khusus";

type AiDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  ringkasanKebutuhan: string;
  rekomendasiSistem: string;
  dokumenPendukung: string[];
};

type AiSubmissionDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  keterangan: string;
  dokumen: string[];
};

type SubmissionSource = "assistant" | "manual" | "copy" | "upload";
type FormSource = SubmissionSource;
type StartChoice = "assistant" | "manual" | "copy" | "upload";

type ManualDocumentOption = {
  id: string;
  title: string;
  description: string;
};

type CopyProposalRow = {
  nomor: string;
  dokumen: string;
  tanggal: string;
  status: string;
  perusahaan: string;
};

type UploadedPreviewRow = {
  field: string;
  value: string;
  note: string;
};

type ParseSourcePreview = {
  id: string;
  label: string;
  fileName: string;
  kind: "pdf" | "image" | "spreadsheet";
};

type ParseMappingRow = {
  seri: string;
  uraian: string;
  hsCode: string;
  quantity: string;
  source: ParseSourcePreview;
};

type FormStateSnapshot = {
  pengajuan: Record<string, string>;
  entitas: Record<string, string>[];
  dokumen: Record<string, string>[];
  kemasan: Record<string, string>[];
  kontainer: Record<string, string>[];
  barang: Record<string, string>[];
  spesifikasi: Record<string, string>[];
  barangDokumen: Record<string, string>[];
  barangVd: Record<string, string>[];
  barangTarif: Record<string, string>[];
  karantina: Record<string, string>[];
};

type UploadFlowContext = {
  source: Exclude<FormSource, "assistant">;
  documentType?: string;
  copyRow?: CopyProposalRow | null;
};

type AiWizardSnapshot = {
  stage: WizardStep;
  selectedActivity: ActivityChoice | null;
  branchActivity: Exclude<ActivityChoice, "tidak_yakin"> | null;
  questionIndex: number;
  answers: Record<string, string | string[]>;
  messages: ConversationMessage[];
  analysisReady: boolean;
  uploadedFiles: string[];
  docSelection: string[];
  pdfStatus: "loading" | "ready" | "missing";
  pdfRevision: number;
};

const AI_DRAFT_STORAGE_KEY = "insw-ai-submission-draft";
const AI_WIZARD_STORAGE_KEY = "insw-smart-submission-assistant-draft";
const FORM_SOURCE_STORAGE_KEY = "insw-form-source";
const BC20_FORM_STORAGE_KEY = "insw-bc20-form-draft";
const FORM_NOTICE_STORAGE_KEY = "insw-form-notice";
const BASE_URL = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
const SAMPLE_DRAFT_PDF = `${BASE_URL}/sample-smart-draft.pdf`;
const PDF_WORKER_URL = pdfWorkerUrl;

const MANUAL_DOCUMENT_OPTIONS: ManualDocumentOption[] = [
  { id: "bc20", title: "BC 2.0 - PIB Impor", description: "Dokumen impor untuk barang masuk ke wilayah Indonesia." },
  { id: "bc23", title: "BC 2.3 - PIB Ekspor", description: "Dokumen ekspor untuk pengeluaran barang dari wilayah Indonesia." },
  { id: "bc27", title: "BC 2.7 - PEB", description: "Dokumen PEB untuk pengeluaran barang ekspor." },
  { id: "bc216", title: "BC 2.16", description: "Skema pengajuan khusus sesuai kebutuhan proses." },
  { id: "bc30", title: "BC 3.0", description: "Dokumen untuk proses yang memerlukan alur BC 3.0." },
  { id: "lainnya", title: "Lainnya", description: "Pilih jika jenis dokumen belum tercantum." },
];

const COPY_HISTORY_ROWS: CopyProposalRow[] = [
  {
    nomor: "10001",
    dokumen: "BC 2.0 - PIB Impor",
    tanggal: "20/06/2026",
    status: "Disetujui",
    perusahaan: "PT Maju Jaya",
  },
  {
    nomor: "10002",
    dokumen: "BC 2.3 - PIB Ekspor",
    tanggal: "18/06/2026",
    status: "Disetujui",
    perusahaan: "PT Sinar Samudera",
  },
  {
    nomor: "10003",
    dokumen: "BC 2.7 - PEB",
    tanggal: "17/06/2026",
    status: "Proses",
    perusahaan: "PT Laut Biru",
  },
  {
    nomor: "10004",
    dokumen: "BC 2.0 - PIB Impor",
    tanggal: "15/06/2026",
    status: "Draft",
    perusahaan: "PT Nusantara Lintas",
  },
  {
    nomor: "10005",
    dokumen: "BC 2.16 - Lartas",
    tanggal: "14/06/2026",
    status: "Disetujui",
    perusahaan: "PT Global Sentosa",
  },
];

const UPLOAD_MOCK_PREVIEW: UploadedPreviewRow[] = [
  { field: "Nomor Pengajuan", value: "BC2006260001", note: "Terbaca dari template" },
  { field: "Kantor Pabean", value: "040100 - KPU Bea Cukai Tanjung Priok", note: "Mapping berhasil" },
  { field: "Jenis PIB", value: "Pengajuan Barang Masuk / Impor", note: "Terbaca dari sheet 1" },
  { field: "Nama Perusahaan", value: "PT Contoh Nusantara", note: "Terbaca dari sheet 2" },
];

const STEP_LABELS: Array<{ key: WizardStep; label: string; icon: string }> = [
  { key: "identifikasi", label: "Identifikasi", icon: "1" },
  { key: "dokumen", label: "Upload Data Barang", icon: "2" },
  { key: "parsing", label: "Data Parsing", icon: "3" },
];

const INITIAL_PROMPT = "Halo! Saya Smart Submission Assistant INSW. Untuk memulai, apa yang ingin Anda lakukan?";

const NEED_OPTIONS: Array<{ key: NeedChoice; title: string; description: string }> = [
  {
    key: "pemasukan",
    title: "Pemasukan",
    description: "Pengajuan terkait pemasukan barang, dana, atau lainnya ke dalam wilayah Indonesia.",
  },
  {
    key: "pengeluaran",
    title: "Pengeluaran",
    description: "Pengajuan terkait pengeluaran barang, dana, atau lainnya dari wilayah Indonesia.",
  },
  {
    key: "lainnya",
    title: "Lainnya / Tidak Yakin",
    description: "Saya tidak yakin atau ingin dibantu menentukan jenis pengajuan.",
  },
];

const RESPONSE_OPTIONS: Record<NeedChoice, Array<{ key: DetailChoice; title: string }>> = {
  pemasukan: [
    { key: "impor_barang", title: "Impor Barang" },
    { key: "pemasukan_kek", title: "Pemasukan KEK" },
    { key: "lainnya_pemasukan", title: "Lainnya" },
  ],
  pengeluaran: [
    { key: "ekspor_barang", title: "Ekspor Barang" },
    { key: "pengeluaran_kek", title: "Pengeluaran KEK" },
    { key: "lainnya_pengeluaran", title: "Lainnya" },
  ],
  lainnya: [
    { key: "barang_masuk", title: "Barang Masuk" },
    { key: "barang_keluar", title: "Barang Keluar" },
    { key: "kawasan_ekonomi_khusus", title: "Kawasan Ekonomi Khusus" },
  ],
};

type ActivityChoice = "barang_masuk" | "barang_keluar" | "kek" | "tidak_yakin";
type QuestionId = "triage" | "tujuan" | "pelaku" | "lokasi_kek" | "izin_khusus" | "dokumen";
type FlowOption = { key: string; label: string; description?: string };
type FlowQuestion = {
  id: QuestionId;
  prompt: string;
  options: FlowOption[];
  multi?: boolean;
};
type ConversationMessage = { role: "assistant" | "user"; text: string };
type WizardAnalysis = {
  rekomendasi: string;
  jenisPengajuan: string;
  dokumenWajib: string[];
  ringkasan: string;
};

const ACTIVITY_OPTIONS: Array<{ key: ActivityChoice; title: string; description: string }> = [
  {
    key: "barang_masuk",
    title: "Barang Masuk Indonesia",
    description: "Aktivitas terkait pemasukan barang ke wilayah Indonesia.",
  },
  {
    key: "barang_keluar",
    title: "Barang Keluar Indonesia",
    description: "Aktivitas terkait pengeluaran barang dari wilayah Indonesia.",
  },
  {
    key: "kek",
    title: "Kawasan Ekonomi Khusus (KEK)",
    description: "Aktivitas yang berada di kawasan ekonomi khusus.",
  },
  {
    key: "tidak_yakin",
    title: "Saya Tidak Yakin",
    description: "Saya belum yakin dan butuh bantuan identifikasi jenis pengajuan.",
  },
];

const TRIAGE_QUESTION: FlowQuestion = {
  id: "triage",
  prompt: "Baik, saya bantu identifikasi. Apakah aktivitas Anda lebih berkaitan dengan barang masuk, barang keluar, atau kawasan khusus?",
  options: [
    { key: "barang_masuk", label: "Barang Masuk" },
    { key: "barang_keluar", label: "Barang Keluar" },
    { key: "kek", label: "Kawasan Ekonomi Khusus" },
  ],
};

const FLOW_QUESTIONS: Record<Exclude<ActivityChoice, "tidak_yakin">, FlowQuestion[]> = {
  barang_keluar: [
    {
      id: "tujuan",
      prompt: "Apa tujuan pengiriman?",
      options: [
        { key: "penjualan", label: "Penjualan" },
        { key: "sample", label: "Sample" },
        { key: "perbaikan", label: "Perbaikan" },
        { key: "pameran", label: "Pameran" },
        { key: "hibah", label: "Hibah" },
        { key: "lainnya", label: "Lainnya" },
      ],
    },
    {
      id: "pelaku",
      prompt: "Siapa pengajunya?",
      options: [
        { key: "perusahaan", label: "Perusahaan" },
        { key: "perorangan", label: "Perorangan" },
        { key: "instansi", label: "Instansi Pemerintah" },
      ],
    },
    {
      id: "lokasi_kek",
      prompt: "Apakah perusahaan berada di KEK?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
      ],
    },
    {
      id: "izin_khusus",
      prompt: "Apakah barang memerlukan izin khusus?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
        { key: "tidak_tahu", label: "Tidak Tahu" },
      ],
    },
  ],
  barang_masuk: [
    {
      id: "tujuan",
      prompt: "Apa tujuan pemasukan?",
      options: [
        { key: "impor", label: "Impor" },
        { key: "produksi", label: "Produksi" },
        { key: "distribusi", label: "Distribusi" },
        { key: "pameran", label: "Pameran" },
        { key: "hibah", label: "Hibah" },
        { key: "lainnya", label: "Lainnya" },
      ],
    },
    {
      id: "pelaku",
      prompt: "Siapa pengajunya?",
      options: [
        { key: "perusahaan", label: "Perusahaan" },
        { key: "perorangan", label: "Perorangan" },
        { key: "instansi", label: "Instansi Pemerintah" },
      ],
    },
    {
      id: "lokasi_kek",
      prompt: "Apakah perusahaan berada di KEK?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
      ],
    },
    {
      id: "izin_khusus",
      prompt: "Apakah barang memerlukan izin khusus?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
        { key: "tidak_tahu", label: "Tidak Tahu" },
      ],
    },
  ],
  kek: [
    {
      id: "tujuan",
      prompt: "Aktivitas di KEK ini lebih ke arah apa?",
      options: [
        { key: "pemasukan", label: "Pemasukan Barang" },
        { key: "pengeluaran", label: "Pengeluaran Barang" },
        { key: "produksi", label: "Proses Produksi" },
        { key: "lainnya", label: "Lainnya" },
      ],
    },
    {
      id: "pelaku",
      prompt: "Siapa pengajunya?",
      options: [
        { key: "perusahaan", label: "Perusahaan" },
        { key: "perorangan", label: "Perorangan" },
        { key: "instansi", label: "Instansi Pemerintah" },
      ],
    },
    {
      id: "lokasi_kek",
      prompt: "Apakah usaha Anda berada di kawasan KEK?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
      ],
    },
    {
      id: "izin_khusus",
      prompt: "Apakah barang memerlukan izin khusus?",
      options: [
        { key: "ya", label: "Ya" },
        { key: "tidak", label: "Tidak" },
        { key: "tidak_tahu", label: "Tidak Tahu" },
      ],
    },
  ],
};

const REQUIRED_DOCUMENTS: Record<Exclude<ActivityChoice, "tidak_yakin">, string[]> = {
  barang_masuk: [
    "Invoice",
    "Packing List",
    "Catalogue / Brosur Produk",
    "Specification Sheet",
    "Certificate / Test Report",
    "Foto Barang",
    "Dokumen Pendukung Lain",
  ],
  barang_keluar: [
    "Invoice",
    "Packing List",
    "Catalogue / Brosur Produk",
    "Specification Sheet",
    "Certificate / Test Report",
    "Foto Barang",
    "Dokumen Pendukung Lain",
  ],
  kek: [
    "Invoice",
    "Packing List",
    "Catalogue / Brosur Produk",
    "Specification Sheet",
    "Certificate / Test Report",
    "Foto Barang",
    "Dokumen Pendukung Lain",
  ],
};

function getActivityLabel(choice: ActivityChoice | null) {
  if (choice === "barang_masuk") return "Barang Masuk Indonesia";
  if (choice === "barang_keluar") return "Barang Keluar Indonesia";
  if (choice === "kek") return "Kawasan Ekonomi Khusus (KEK)";
  return "Saya Tidak Yakin";
}

function getBranchChoice(choice?: string | null) {
  if (choice === "barang_masuk" || choice === "barang_keluar" || choice === "kek") return choice;
  return null;
}

function getBranchTitle(activity: Exclude<ActivityChoice, "tidak_yakin">) {
  if (activity === "barang_masuk") return "Pengajuan Barang Masuk / Impor";
  if (activity === "barang_keluar") return "Pengajuan Barang Keluar / Ekspor";
  return "Pengajuan KEK";
}

function getQuestionFlow(activity: Exclude<ActivityChoice, "tidak_yakin">) {
  return FLOW_QUESTIONS[activity];
}

function getAnswerLabel(question: FlowQuestion, value: string | string[]) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => question.options.find((option) => option.key === entry)?.label ?? entry)
      .join(", ");
  }
  return question.options.find((option) => option.key === value)?.label ?? value;
}

function getAnalysisResult(activity: Exclude<ActivityChoice, "tidak_yakin">, answers: Record<string, string | string[]>) {
  const q = getQuestionFlow(activity);
  const tujuan = answers.tujuan ? getAnswerLabel(q[0], answers.tujuan) : "-";
  const pelaku = answers.pelaku ? getAnswerLabel(q[1], answers.pelaku) : "-";
  const lokasi = answers.lokasi_kek ? getAnswerLabel(q[2], answers.lokasi_kek) : "-";
  const izin = answers.izin_khusus ? getAnswerLabel(q[3], answers.izin_khusus) : "-";
  const requiredDocuments = REQUIRED_DOCUMENTS[activity];

  return {
    jenisPengajuan: getBranchTitle(activity),
    rekomendasi: `Berdasarkan informasi yang Anda berikan, sistem merekomendasikan pengajuan ${getBranchTitle(activity)}.`,
    dokumenWajib: requiredDocuments,
    ringkasan: `Tujuan: ${tujuan}; Pelaku: ${pelaku}; Lokasi KEK: ${lokasi}; Izin khusus: ${izin}.`,
  };
}

function buildAiDraftFromAnalysis(
  activity: Exclude<ActivityChoice, "tidak_yakin">,
  answers: Record<string, string | string[]>,
  files: string[],
): AiDraft {
  const analysis = getAnalysisResult(activity, answers);
  return {
    jenisPengajuan: analysis.jenisPengajuan,
    namaPerusahaan: "PT Contoh Nusantara",
    npwp: "01.234.567.8-999.000",
    nib: "1234567890123",
    ringkasanKebutuhan: analysis.ringkasan,
    rekomendasiSistem: analysis.rekomendasi,
    dokumenPendukung: files,
  };
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 7H5v11h14V9ZM7 11h4v3H7v-3Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7.5 10.5.9 2.8 2.8.9-2.8.9-.9 2.8-.9-2.8-2.8-.9 2.8-.9.9-2.8ZM4.5 13l1.1 3.5L9 17.6l-3.4 1.1L4.5 22l-1.1-3.3L0 17.6l3.4-1.1L4.5 13Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2a2 2 0 0 0-2 2v1H7a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-3V4a2 2 0 0 0-2-2Zm-1 4h2V4h-2v2Zm-3 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-8 6h8v2H7v-2Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 3 7 8h3v5h4V8h3l-5-5ZM5 18v2h14v-2H5Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M6 2h8l4 4v16H6V2Zm8 1.8V7h3.2L14 3.8ZM8 11h8v2H8v-2Zm0 4h8v2H8v-2Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 3v10.2l3.6-3.6 1.4 1.4L12 17l-5-5 1.4-1.4 3.6 3.6V3h2Zm-7 16h14v2H5v-2Z" />
    </svg>
  );
}

function PlusSmallIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M17.6 6.4A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L14 10h7V3l-3.4 3.4Z" />
    </svg>
  );
}

function getNeedLabel(choice?: NeedChoice | null) {
  if (choice === "pemasukan") return "Pemasukan";
  if (choice === "pengeluaran") return "Pengeluaran";
  return "Lainnya / Tidak Yakin";
}

function getDetailLabel(choice?: DetailChoice | null) {
  const map: Record<DetailChoice, string> = {
    impor_barang: "Impor Barang",
    pemasukan_kek: "Pemasukan KEK",
    lainnya_pemasukan: "Lainnya",
    ekspor_barang: "Ekspor Barang",
    pengeluaran_kek: "Pengeluaran KEK",
    lainnya_pengeluaran: "Lainnya",
    barang_masuk: "Barang Masuk",
    barang_keluar: "Barang Keluar",
    kawasan_ekonomi_khusus: "Kawasan Ekonomi Khusus",
  };
  return choice ? map[choice] : "";
}

function getRecommendedJenis(primary?: NeedChoice | null, detail?: DetailChoice | null) {
  if (primary === "pemasukan") {
    if (detail === "impor_barang") return "Impor Barang";
    if (detail === "pemasukan_kek") return "Pemasukan KEK";
    return "Pemasukan Lainnya";
  }

  if (primary === "pengeluaran") {
    if (detail === "ekspor_barang") return "Ekspor Barang";
    if (detail === "pengeluaran_kek") return "Pengeluaran KEK";
    return "Pengeluaran Lainnya";
  }

  if (detail === "barang_masuk") return "Impor Barang";
  if (detail === "barang_keluar") return "Ekspor Barang";
  if (detail === "kawasan_ekonomi_khusus") return "KEK";

  return "Pengajuan Umum";
}

function getDetailPrompt(primary?: NeedChoice | null) {
  if (primary === "pemasukan") {
    return "Apakah pemasukan ini terkait barang impor, pemasukan ke KEK, atau lainnya?";
  }
  if (primary === "pengeluaran") {
    return "Apakah pengeluaran ini terkait ekspor barang, pengeluaran dari KEK, atau lainnya?";
  }
  return "Baik, saya bantu identifikasi. Apakah aktivitas Anda lebih berkaitan dengan barang masuk, barang keluar, atau kawasan khusus?";
}

function getDetailOptions(primary?: NeedChoice | null) {
  if (primary === "pemasukan") return RESPONSE_OPTIONS.pemasukan;
  if (primary === "pengeluaran") return RESPONSE_OPTIONS.pengeluaran;
  return RESPONSE_OPTIONS.lainnya;
}

function getAssistantMessage(stage: WizardStep, primary?: NeedChoice | null) {
  if (stage === "identifikasi") return getDetailPrompt(primary);
  if (stage === "dokumen") return "Terima kasih. Silakan unggah dokumen pendukung jika tersedia untuk membantu saya menyusun draft.";
  if (stage === "parsing") return "Ini hasil parsing awal yang saya susun berdasarkan jawaban Anda. Silakan tinjau sebelum lanjut ke form.";
  return INITIAL_PROMPT;
}

function buildAiDraft(primary?: NeedChoice | null, detail?: DetailChoice | null, files: string[] = []): AiDraft {
  const jenisPengajuan = getRecommendedJenis(primary, detail);
  const needSummary = `${getNeedLabel(primary)}${detail ? ` - ${getDetailLabel(detail)}` : ""}`;
  return {
    jenisPengajuan,
    namaPerusahaan: "PT Contoh Nusantara",
    npwp: "01.234.567.8-999.000",
    nib: "1234567890123",
    ringkasanKebutuhan: needSummary,
    rekomendasiSistem: `Berdasarkan informasi yang diberikan, sistem merekomendasikan pengajuan ${jenisPengajuan}.`,
    dokumenPendukung: files,
  };
}

function toSubmissionDraft(draft: AiDraft): AiSubmissionDraft {
  return {
    jenisPengajuan: draft.jenisPengajuan,
    namaPerusahaan: draft.namaPerusahaan,
    npwp: draft.npwp,
    nib: draft.nib,
    keterangan: draft.ringkasanKebutuhan,
    dokumen: draft.dokumenPendukung,
  };
}

function storeFormSnapshot(source: FormSource, draft: AiSubmissionDraft, formState?: FormStateSnapshot, notice?: string) {
  sessionStorage.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  sessionStorage.setItem(FORM_SOURCE_STORAGE_KEY, source);

  if (formState) {
    sessionStorage.setItem(BC20_FORM_STORAGE_KEY, JSON.stringify({ draft, formState }));
  } else {
    sessionStorage.removeItem(BC20_FORM_STORAGE_KEY);
  }

  if (notice) {
    sessionStorage.setItem(FORM_NOTICE_STORAGE_KEY, notice);
  } else {
    sessionStorage.removeItem(FORM_NOTICE_STORAGE_KEY);
  }
}

function buildBaseFormSnapshot(jenisPengajuan: string, companyName: string, npwp: string, nib: string, documents: string[]): FormStateSnapshot {
  const firstDocument = documents[0] || "surat_pengajuan_impor_v01.docx";
  const secondDocument = documents[1] || "packing_list_mock.pdf";

  return {
    pengajuan: {
      nomorPengajuan: "BC2006260001",
      kantorPabean: "040100 - KPU Bea Cukai Tanjung Priok",
      jenisPib: jenisPengajuan,
      jenisImpor: "Umum",
      caraBayar: "Biasa",
      valuta: "USD",
      ndpbm: "16342.00",
      jenisTransaksi: "Biasa",
      harga: "1250000",
      freight: "250000",
      asuransi: "0",
      diskon: "0",
      beratKotor: "1000",
      caraPengangkutan: "Laut",
      namaSaranaAngkut: "MV Contoh Nusantara",
      nomorVoyage: "VY-0626",
      bendera: "Indonesia",
      perkiraanTanggalTiba: "2026-07-08",
      pelabuhanMuat: "SGSIN",
      pelabuhanTransit: "MYTPP",
      pelabuhanTujuan: "IDTPP",
      tempatTimbun: "JICT",
    },
    entitas: [
      {
        "Jenis Entitas": "Importer",
        "Jenis Identitas": "NPWP",
        NITKU: "3171010000001",
        Nama: companyName,
        Alamat: "Jl. Contoh Raya No. 123, Jakarta",
        NIB: nib,
        "Jenis API": "API-U",
        Status: "Aktif",
        "Kode Negara": "ID",
        "Kode Afiliasi": "00",
      },
    ],
    dokumen: [
      {
        Seri: "1",
        "Kode Dokumen": "INV",
        "Nomor Dokumen": firstDocument,
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      },
      {
        Seri: "2",
        "Kode Dokumen": "PL",
        "Nomor Dokumen": secondDocument,
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      },
    ],
    kemasan: [{ Seri: "1", "Jenis Kemasan": "Pallet", Merek: "INSW" }],
    kontainer: [{ Seri: "1", "Nomor Kontainer": "MSKU1234567", Ukuran: "40", "Jenis Muatan": "FCL", Tipe: "Dry" }],
    barang: [
      {
        Seri: "1",
        "HS Code": "8471.30.10",
        "Kode Barang": "BRG-001",
        Uraian: "Barang contoh untuk mockup BC 2.0",
        Merek: "INSW",
        Tipe: "Unit",
        Ukuran: "Std",
        "Spesifikasi Lain": "Mock field",
        "Kondisi Barang": "Baru",
        "Negara Asal": "CN",
        "Berat Bersih": "950",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "10",
        "Kode Kemasan": "PAL",
        "Jumlah Kemasan": "2",
        "Harga Invoice": "1250000",
      },
    ],
    spesifikasi: [{ Seri: "1", "Nama Spesifikasi": "Warna", Nilai: "Hitam", Satuan: "-" }],
    barangDokumen: [{ "Seri Barang": "1", "Seri Dokumen": "1" }],
    barangVd: [{ Seri: "1", "Kode VD": "VD001", "Uraian VD": "Volume data mock", "Nilai VD": "1" }],
    barangTarif: [
      {
        "Seri Barang": "1",
        "Jenis Pungutan": "BM",
        "Jenis Tarif": "Ad Valorem",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "10",
        "Nilai Tarif": "5",
        "Kode Fasilitas Tarif": "-",
        "Nilai Tarif Fasilitas": "0",
      },
    ],
    karantina: [{ Seri: "1", "Jenis Karantina": "Hewan", "Hasil Pemeriksaan": "Lulus", Keterangan: "-" }],
  };
}

function buildUploadNotice(excelFiles: string[], ocrFiles: string[]) {
  const hasExcel = excelFiles.length > 0;
  const hasOcr = ocrFiles.length > 0;

  if (hasExcel && hasOcr) {
    return "Data Excel digunakan sebagai sumber utama. Dokumen OCR digunakan sebagai validasi dan pelengkap data.";
  }

  if (hasOcr) {
    return "Data hasil OCR perlu ditinjau kembali.";
  }

  if (hasExcel) {
    return "Data Excel digunakan sebagai sumber utama untuk pengisian barang.";
  }

  return "Upload dilewati. Data akan dilanjutkan ke validasi manual.";
}

type UploadStage = "upload" | "validasi";
type UploadStatus = "empty" | "picked" | "uploaded" | "failed";

type UploadSlot = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  selectedFile: string | null;
  uploadedFile: string | null;
  status: UploadStatus;
  removable?: boolean;
  error?: string | null;
};

const OCR_UPLOAD_DEFAULTS = [
  {
    id: "inv",
    label: "Invoice (INV)",
    description: "Dokumen dasar berisi referensi transaksi, nilai barang, dan detail komersial.",
    required: true,
  },
  {
    id: "pl",
    label: "Packing List (PL)",
    description: "Rincian kemasan, jumlah barang, dan susunan isi per paket/kontainer.",
    required: true,
  },
  {
    id: "catalogue",
    label: "Catalogue / Brosur Produk",
    description: "Menunjukkan bentuk, tipe, atau katalog produk yang diimpor atau diekspor.",
    required: false,
  },
  {
    id: "spec",
    label: "Specification Sheet",
    description: "Detail spesifikasi teknis, ukuran, material, atau karakteristik barang.",
    required: false,
  },
  {
    id: "cert",
    label: "Certificate / Test Report",
    description: "Sertifikat mutu, hasil uji, atau dokumen pembuktian teknis barang.",
    required: false,
  },
  {
    id: "photo",
    label: "Foto Barang",
    description: "Foto visual barang untuk membantu identifikasi dan validasi.",
    required: false,
  },
  {
    id: "support",
    label: "Dokumen Pendukung Lain",
    description: "Lampiran tambahan lain yang masih berhubungan dengan barang.",
    required: false,
  },
] as const;

const createUploadSlot = (id: string, label: string, description: string, required: boolean, removable = false): UploadSlot => ({
  id,
  label,
  description,
  required,
  removable,
  selectedFile: null,
  uploadedFile: null,
  status: "empty",
  error: null,
});

const createDefaultOcrSlots = () =>
  OCR_UPLOAD_DEFAULTS.map((item) => createUploadSlot(item.id, item.label, item.description, item.required));

function IconButton({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`insw-icon-btn insw-icon-btn--primary-solid insw-icon-btn--md ${className}`}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10.5 4a6.5 6.5 0 1 0 4.09 11.56l4.42 4.43 1.41-1.41-4.43-4.42A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

function ModalCancelButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} startIcon={<CloseIcon />} className={className}>
      Batal
    </Button>
  );
}

function StartSubmissionModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (choice: StartChoice) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Mulai Pengajuan</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
            Pilih apakah Anda ingin dibantu oleh Smart Submission Assistant atau membuat pengajuan secara manual.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 lg:grid-cols-2">
          {[
            {
              key: "assistant" as const,
              title: "Gunakan Smart Submission Assistant",
              description:
                "Assistant akan membantu mengidentifikasi kebutuhan Anda, menentukan jenis pengajuan yang sesuai, meminta dokumen pendukung, dan membuat Smart Draft secara otomatis.",
              button: "Gunakan Assistant",
            },
            {
              key: "manual" as const,
              title: "Buat Tanpa Assistant",
              description: "Saya sudah mengetahui cara atau jenis pengajuan yang ingin dibuat.",
              button: "Buat Manual",
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className="group flex h-full flex-col rounded-2xl border border-border-primary bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-brand-primary-300 hover:shadow-md"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 transition-colors group-hover:bg-brand-primary-500 group-hover:text-white">
                {item.key === "assistant" ? <BotIcon /> : <FileIcon />}
              </div>
              <div className="mt-4 text-[16px] font-semibold text-neutral-800">{item.title}</div>
              <p className="mt-2 text-[12px] leading-5 text-neutral-600">{item.description}</p>
              <div className="mt-auto pt-5">
                <span className="inline-flex h-10 items-center rounded-md border border-brand-primary-500 px-4 text-[12px] font-semibold text-brand-primary-700 transition-colors group-hover:bg-brand-primary-50">
                  {item.button}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3 text-[12px] text-neutral-600">
            <span>Langkah berikutnya akan menyesuaikan metode yang Anda pilih.</span>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualMethodModal({
  open,
  onClose,
  onBack,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelect: (choice: Exclude<StartChoice, "assistant">) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Buat Pengajuan Tanpa Assistant</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
            Pilih metode pembuatan pengajuan yang Anda inginkan.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 lg:grid-cols-3">
          {[
            {
              key: "manual" as const,
              title: "Buat Pengajuan Baru",
              description: "Pilih jenis dokumen yang akan diajukan dan isi data pengajuan dari awal.",
              button: "Buat Baru",
              icon: "📄",
            },
            {
              key: "copy" as const,
              title: "Copy Data Pengajuan",
              description: "Gunakan data dari pengajuan sebelumnya sebagai dasar pengajuan baru.",
              button: "Copy Data",
              icon: "📋",
            },
            {
              key: "upload" as const,
              title: "Upload Template Excel",
              description: "Import data dari file Excel sesuai template untuk membuat pengajuan.",
              button: "Upload File",
              icon: "📤",
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className="group flex h-full flex-col rounded-2xl border border-border-primary bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-brand-primary-300 hover:shadow-md"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 transition-colors group-hover:bg-brand-primary-500 group-hover:text-white">
                {item.key === "manual" ? <FileIcon /> : item.key === "copy" ? <CopyIcon /> : <UploadIcon />}
              </div>
              <div className="mt-4 text-[16px] font-semibold text-neutral-800">{item.title}</div>
              <p className="mt-2 text-[12px] leading-5 text-neutral-600">{item.description}</p>
              <div className="mt-auto pt-5">
                <span className="inline-flex h-10 items-center rounded-md border border-brand-primary-500 px-4 text-[12px] font-semibold text-brand-primary-700 transition-colors group-hover:bg-brand-primary-50">
                  {item.button}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3 text-[12px] text-neutral-600">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualDocumentModal({
  open,
  onClose,
  onBack,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelect: (documentType: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = MANUAL_DOCUMENT_OPTIONS.filter((item) =>
    `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Buat Pengajuan Baru</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
            Pilih jenis dokumen yang ingin dibuat sebelum masuk ke form.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-8">
          <div className="relative mb-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari jenis dokumen..."
              prefixIcon={<SearchIcon />}
            />
          </div>

          <div className="grid gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.title)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border-primary bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-sm"
              >
                <div>
                  <div className="text-[13px] font-semibold text-neutral-800">{item.title}</div>
                  <div className="mt-1 text-[12px] text-neutral-600">{item.description}</div>
                </div>
                <span className="rounded-md bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-600">
                  Pilih
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyDataModal({
  open,
  onClose,
  onBack,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onUse: (row: CopyProposalRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");

  if (!open) return null;

  const filtered = COPY_HISTORY_ROWS.filter((row) => {
    const haystack = `${row.nomor} ${row.dokumen} ${row.tanggal} ${row.status} ${row.perusahaan}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "Semua" || row.status === status);
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex w-full max-w-[1120px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Copy Data Pengajuan</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
            Cari pengajuan sebelumnya dan gunakan sebagai dasar draft baru.
          </p>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:px-8 lg:grid-cols-[1.4fr_220px]">
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari nomor pengajuan, dokumen, atau nama..."
              prefixIcon={<SearchIcon />}
            />
          </div>

          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { label: "Semua", value: "Semua" },
              { label: "Disetujui", value: "Disetujui" },
              { label: "Proses", value: "Proses" },
              { label: "Draft", value: "Draft" },
            ]}
          />
        </div>

        <div className="px-5 pb-5 sm:px-8">
          <div className="overflow-x-auto rounded-2xl border border-border-primary">
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="bg-brand-primary-500 text-white">
                <tr>
                  <th className="px-3 py-2 font-semibold">Nomor Pengajuan</th>
                  <th className="px-3 py-2 font-semibold">Jenis Dokumen</th>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Perusahaan</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.nomor} className="border-t border-border-primary hover:bg-brand-primary-50/20">
                    <td className="px-3 py-2">{row.nomor}</td>
                    <td className="px-3 py-2">{row.dokumen}</td>
                    <td className="px-3 py-2">{row.tanggal}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.perusahaan}</td>
                    <td className="px-3 py-2">
                      <Button
                        onClick={() => onUse(row)}
                        size="sm"
                      >
                        Gunakan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadBarangModal({
  open,
  onClose,
  onBack,
  context,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  context: UploadFlowContext | null;
  onComplete: (payload: { excelFiles: string[]; ocrFiles: string[] }) => void;
}) {
  const [stage, setStage] = useState<UploadStage>("upload");
  const [excelSlot, setExcelSlot] = useState<UploadSlot>(() =>
    createUploadSlot("excel", "Upload Template Excel", "File Excel digunakan sebagai sumber data utama untuk pengisian barang.", true),
  );
  const [ocrSlots, setOcrSlots] = useState<UploadSlot[]>(() => createDefaultOcrSlots());
  const [customCounter, setCustomCounter] = useState(1);
  const [parseRevision, setParseRevision] = useState(0);
  const [selectedParseRow, setSelectedParseRow] = useState<ParseMappingRow | null>(null);
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage("upload");
    setExcelSlot(createUploadSlot("excel", "Upload Template Excel", "File Excel digunakan sebagai sumber data utama untuk pengisian barang.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setParseRevision(0);
    setSelectedParseRow(null);
    setDismissConfirmOpen(false);
  }, [open]);

  const uploadedExcelFiles = excelSlot.uploadedFile ? [excelSlot.uploadedFile] : [];
  const uploadedOcrSlots = ocrSlots.filter((slot) => slot.uploadedFile);
  const uploadedOcrFiles = uploadedOcrSlots.map((slot) => `${slot.label} - ${slot.uploadedFile}`);
  const hasExcel = uploadedExcelFiles.length > 0;
  const hasOcr = uploadedOcrFiles.length > 0;
  const isTemplateFlow = context?.source === "upload";
  const hasPendingUploads = excelSlot.status === "picked" || excelSlot.status === "failed" || ocrSlots.some((slot) => slot.status === "picked" || slot.status === "failed");
  const barangCount = hasExcel ? Math.max(1, uploadedExcelFiles.length * 2) : hasOcr ? Math.max(1, uploadedOcrFiles.length) : context?.source === "copy" ? 1 : 0;
  const supportCount = uploadedOcrFiles.length;
  const mappedFields = hasExcel ? 18 : hasOcr ? 12 : 0;
  const notice = buildUploadNotice(uploadedExcelFiles, uploadedOcrFiles);
  const parseSources = useMemo<ParseSourcePreview[]>(() => {
    const ocrSources = uploadedOcrSlots
      .filter((slot) => slot.uploadedFile)
      .map((slot, index) => {
        const fileName = slot.uploadedFile ?? slot.selectedFile ?? `ocr-${index + 1}`;
        return {
          id: slot.id,
          label: slot.label,
          fileName,
          kind: fileName.toLowerCase().endsWith(".pdf") ? ("pdf" as const) : ("image" as const),
        };
      });

    if (ocrSources.length) return ocrSources;

    if (hasExcel) {
      const fileName = excelSlot.uploadedFile ?? excelSlot.selectedFile ?? "template-upload-barang.xlsx";
      return [
        {
          id: "excel-source",
          label: "Template Excel",
          fileName,
          kind: "spreadsheet",
        },
      ];
    }

    return [
      { id: "ocr-a", label: "OCR A", fileName: "ocr-sumber-a.pdf", kind: "pdf" },
      { id: "ocr-b", label: "OCR B", fileName: "ocr-sumber-b.png", kind: "image" },
    ];
  }, [excelSlot.selectedFile, excelSlot.uploadedFile, hasExcel, uploadedOcrSlots]);

  const parseRows = useMemo<ParseMappingRow[]>(() => {
    const sourceA = parseSources[0];
    const sourceB = parseSources[1] ?? sourceA;
    const rows: Array<Omit<ParseMappingRow, "source"> & { sourceIndex: number }> = [
      { seri: "1", uraian: "Barang contoh A", hsCode: "8471.30.10", quantity: "10", sourceIndex: 0 },
      { seri: "2", uraian: "Barang contoh B", hsCode: "8471.30.90", quantity: "4", sourceIndex: 0 },
      { seri: "3", uraian: "Barang contoh C", hsCode: "8504.40.90", quantity: "8", sourceIndex: 0 },
      { seri: "4", uraian: "Barang contoh D", hsCode: "3923.10.90", quantity: "12", sourceIndex: 1 },
      { seri: "5", uraian: "Barang contoh E", hsCode: "7326.90.99", quantity: "2", sourceIndex: 1 },
    ];

    return rows.map((row) => ({
      seri: row.seri,
      uraian: row.uraian,
      hsCode: row.hsCode,
      quantity: row.quantity,
      source: row.sourceIndex === 0 ? sourceA : sourceB,
    }));
  }, [parseSources]);

  const parseConfidence = useMemo(() => {
    const fileCount = uploadedExcelFiles.length + uploadedOcrFiles.length;

    if (!fileCount) return 0;

    return Math.min(99, 84 + fileCount * 3 + parseRevision * 2);
  }, [parseRevision, uploadedExcelFiles.length, uploadedOcrFiles.length]);

  const parseConfidenceLabel =
    parseConfidence >= 95 ? "Aman" : parseConfidence >= 60 ? "Perlu dicek" : parseConfidence > 0 ? "Wajib review" : "Menunggu upload";
  const parseConfidenceTone =
    parseConfidence >= 95
      ? "border-success-200 bg-success-50 text-success-700"
      : parseConfidence >= 60
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-error-200 bg-error-50 text-error-700";
  const parseSummaryTone =
    parseConfidence >= 95
      ? "border-success-200 bg-success-50/70 text-success-800"
      : parseConfidence >= 60
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-error-200 bg-error-50/70 text-error-800";
  const parseConfidenceHint =
    parseConfidence >= 95
      ? "Confidence sudah aman untuk lanjut ke form."
      : parseConfidence >= 60
        ? "Hasil parsing cukup baik, tapi tetap disarankan cek beberapa bagian."
        : "Hasil parsing belum stabil. Sebaiknya parse ulang sebelum lanjut.";

  const handleDismissRequest = () => {
    if (stage === "validasi") {
      setDismissConfirmOpen(true);
      return;
    }

    onClose();
  };

  const handleConfirmExit = () => {
    setDismissConfirmOpen(false);
    onClose();
  };

  if (!open) return null;

  const handleExcelPick = (file: File | null) => {
    setExcelSlot((current) =>
      file
        ? { ...current, selectedFile: file.name, status: "picked", error: null }
        : { ...current, selectedFile: null, uploadedFile: null, status: "empty", error: null },
    );
  };

  const handleExcelUpload = () => {
    setExcelSlot((current) => {
      if (!current.selectedFile) return { ...current, status: "failed", error: "Pilih file Excel dulu." };
      return { ...current, uploadedFile: current.selectedFile, status: "uploaded", error: null };
    });
  };

  const handleOcrPick = (slotId: string, file: File | null) => {
    setOcrSlots((current) =>
      current.map((slot) =>
        slot.id !== slotId
          ? slot
          : file
            ? { ...slot, selectedFile: file.name, status: "picked", error: null }
            : { ...slot, selectedFile: null, uploadedFile: null, status: "empty", error: null },
      ),
    );
  };

  const handleOcrUpload = (slotId: string) => {
    setOcrSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        if (!slot.selectedFile) return { ...slot, status: "failed", error: "Pilih file OCR dulu." };
        return { ...slot, uploadedFile: slot.selectedFile, status: "uploaded", error: null };
      }),
    );
  };

  const handleOcrRemove = (slotId: string) => {
    setOcrSlots((current) => current.filter((slot) => slot.id !== slotId || !slot.removable));
  };

  const addOcrSlot = () => {
    setCustomCounter((current) => current + 1);
    setOcrSlots((current) => [
      ...current,
      createUploadSlot(`custom-${Date.now()}`, `Dokumen tambahan ${customCounter + 1}`, "Tambahkan dokumen OCR lain yang perlu diunggah.", false, true),
    ]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, kind: "excel" | "ocr", slotId?: string) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (kind === "excel") {
      handleExcelPick(file);
      return;
    }
    if (slotId) handleOcrPick(slotId, file);
  };

  const goToParsing = () => setStage("validasi");
  const handleReparse = () => {
    setParseRevision((current) => current + 1);
    setSelectedParseRow(null);
  };
  const finishUploadFlow = () => {
    onComplete({ excelFiles: uploadedExcelFiles, ocrFiles: uploadedOcrFiles });
  };
  const handleBackAction = () => {
    if (stage === "validasi") {
      setStage("upload");
      return;
    }
    onBack();
  };

  const statusTone = (state: UploadStatus) =>
    ({
      empty: "bg-neutral-100 text-neutral-600",
      picked: "bg-warning-50 text-warning-600",
      uploaded: "bg-success-50 text-success-600",
      failed: "bg-error-50 text-error-600",
    })[state];

  const statusLabel = (state: UploadStatus) =>
    ({
      empty: "Belum dipilih",
      picked: "Siap upload",
      uploaded: "Terverifikasi",
      failed: "Gagal",
    })[state];

  const uploadSection = (
    <div className="grid gap-4">
      {isTemplateFlow ? (
        <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
          <div className="border-b border-border-primary pb-3">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Download Template Excel</div>
            <div className="mt-1 text-[13px] font-semibold text-neutral-800">Template awal untuk pengisian barang</div>
          </div>
          <div className="mt-4 flex justify-start">
            <Button asChild variant="outline" size="sm">
              <a href="/template-upload-barang.xlsx" download>
                Download Template Excel
              </a>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-3">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">
              {isTemplateFlow ? "Upload Template Excel" : "Upload Data Barang"}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-neutral-800">
              {isTemplateFlow ? "Pilih file lalu upload eksplisit" : "Pilih file Excel untuk data barang"}
            </div>
          </div>
          <span className={["rounded-full px-3 py-1 text-[12px] font-semibold", statusTone(excelSlot.status)].join(" ")}>
            {statusLabel(excelSlot.status)}
          </span>
        </div>

        <div
          className="mt-4 rounded-2xl border-2 border-dashed border-border-primary bg-background-primary/30 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, "excel")}
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">
              <UploadIcon />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-neutral-800">{isTemplateFlow ? "Template Excel" : "Upload Data Barang"}</div>
              <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                {isTemplateFlow
                  ? "File Excel digunakan sebagai sumber data utama untuk pengisian barang."
                  : "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Selected file</div>
              <div className="mt-1 text-[12px] font-medium text-neutral-800">{excelSlot.selectedFile ?? "Belum ada file"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <label htmlFor="excel-upload-input">Pilih File</label>
              </Button>
              <Button variant="primary" size="sm" onClick={handleExcelUpload} disabled={!excelSlot.selectedFile}>
                Upload
              </Button>
            </div>
          </div>

          <input id="excel-upload-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => handleExcelPick(event.target.files?.[0] ?? null)} />
          {excelSlot.error && <div className="mt-3 text-[12px] font-medium text-error-600">{excelSlot.error}</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
        <div className="border-b border-border-primary pb-3">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Upload OCR</div>
          <div className="mt-1 text-[13px] font-semibold text-neutral-800">Upload dokumen dasar satu per satu</div>
        </div>

        <div className="mt-4 grid gap-3">
          {ocrSlots.map((slot) => {
            const inputId = `ocr-upload-${slot.id}`;
            return (
              <div key={slot.id} className="rounded-2xl border border-border-primary bg-background-primary/20 p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "ocr", slot.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">
                      <FileIcon />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[14px] font-semibold text-neutral-800">{slot.label}</div>
                        {slot.required ? <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-600">Wajib</span> : <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">Opsional</span>}
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-neutral-600">{slot.description}</p>
                    </div>
                  </div>

                  <span className={["rounded-full px-3 py-1 text-[12px] font-semibold", statusTone(slot.status)].join(" ")}>
                    {statusLabel(slot.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Selected file</div>
                    <div className="mt-1 text-[12px] font-medium text-neutral-800">{slot.selectedFile ?? "Belum ada file"}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor={inputId}>Pilih File</label>
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleOcrUpload(slot.id)} disabled={!slot.selectedFile}>
                      Upload
                    </Button>
                    {slot.removable ? (
                      <Button variant="ghost" size="sm" onClick={() => handleOcrRemove(slot.id)}>
                        Hapus
                      </Button>
                    ) : null}
                  </div>
                </div>

                <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => handleOcrPick(slot.id, event.target.files?.[0] ?? null)} />
                {slot.error && <div className="mt-3 text-[12px] font-medium text-error-600">{slot.error}</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={addOcrSlot} startIcon={<PlusIcon />}>
            Tambah Dokumen
          </Button>
        </div>
      </section>
    </div>
  );

  const parsingSection = (
    <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
      <div className="border-b border-border-primary pb-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Data Parsing</div>
        <div className="mt-1 text-[13px] font-semibold text-neutral-800">Ringkasan hasil AI dan sumber data</div>
        <p className="mt-1 text-[12px] leading-5 text-neutral-600">
          AI akan membaca file yang diunggah, lalu menyiapkan data untuk auto fill sebelum masuk ke form.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
        <div className={["rounded-2xl border p-4 shadow-sm", parseConfidenceTone].join(" ")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em]">Confidence global</div>
              <div className="mt-1 text-[28px] font-semibold leading-none">{parseConfidence}%</div>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-neutral-800 shadow-sm">{parseConfidenceLabel}</span>
          </div>
          <p className="mt-3 max-w-2xl text-[12px] leading-5">{parseConfidenceHint}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReparse} startIcon={<RefreshIcon />}>
              Parse Ulang
            </Button>
            <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-semibold text-neutral-700">
              Global, bukan per field
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Jumlah barang terbaca", value: `${barangCount}` },
            { label: "Jumlah dokumen pendukung", value: `${supportCount}` },
            { label: "Field yang berhasil dipetakan", value: `${mappedFields}` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border-primary bg-background-primary/35 p-4 shadow-sm">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{item.label}</div>
              <div className="mt-2 text-[24px] font-semibold leading-none text-neutral-800">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={["mt-4 rounded-2xl border px-4 py-3 text-[12px] leading-5", parseSummaryTone].join(" ")}>
        {notice}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-primary-100 bg-brand-primary-50/35">
        <div className="flex items-center justify-between gap-3 border-b border-brand-primary-100 px-4 py-3">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">Preview Mapping</div>
            <div className="mt-1 text-[13px] font-semibold text-neutral-800">Tabel data barang hasil parse</div>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand-primary-700 shadow-sm">
            {parseRows.length} barang
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-primary text-left text-[12px]">
            <thead className="bg-white/70 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Seri</th>
                <th className="px-4 py-3 font-semibold">Uraian Barang</th>
                <th className="px-4 py-3 font-semibold">HS Code</th>
                <th className="px-4 py-3 font-semibold">Sumber OCR</th>
                <th className="px-4 py-3 font-semibold text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary bg-white">
              {parseRows.map((row) => (
                <tr key={row.seri} className="transition-colors hover:bg-brand-primary-50/60">
                  <td className="px-4 py-3 font-semibold text-neutral-800">{row.seri}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{row.uraian}</div>
                    <div className="mt-1 text-[11px] text-neutral-500">Qty {row.quantity}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{row.hsCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{row.source.label}</div>
                    <div className="mt-1 text-[11px] text-neutral-500">{row.source.fileName}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedParseRow(row)}>
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const title =
    stage === "upload"
      ? context?.source === "copy"
        ? "Lengkapi Data Pengajuan Lama"
        : isTemplateFlow
          ? "Upload Template Excel"
          : "Upload Data Barang"
      : "Data Parsing";
  const subtitle =
    stage === "upload"
      ? context?.source === "copy"
        ? "Pilih file Excel dan/atau dokumen OCR untuk membantu melengkapi data dari pengajuan sebelumnya."
        : "Pilih file Excel sebagai sumber data utama dan dokumen OCR sebagai pendukung validasi data barang."
      : "Tinjau hasil parsing sebelum lanjut ke form.";
  const primaryDisabled = stage === "upload" && hasPendingUploads;
  const eyebrowLabel = stage === "upload" ? (isTemplateFlow ? "UPLOAD TEMPLATE EXCEL" : "UPLOAD DATA BARANG") : "DATA PARSING";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{eyebrowLabel}</div>
          <h3 className="mt-1 text-[24px] font-semibold text-neutral-800">{title}</h3>
          <p className="mt-1 max-w-3xl text-[12px] text-neutral-600 sm:text-[13px]">{subtitle}</p>
          {context?.documentType && (
            <div className="mt-3 inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
              Jenis dokumen: {context.documentType}
            </div>
          )}
          {context?.copyRow && (
            <div className="mt-3 inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
              Salin dari: {context.copyRow.nomor} - {context.copyRow.dokumen}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          {stage === "upload" ? uploadSection : parsingSection}
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={handleBackAction}>
              {stage === "upload" ? "Kembali" : "Kembali ke Upload"}
            </Button>

            <div className="flex items-center gap-3">
              {stage === "upload" ? (
                <>
                  <Button variant="outline" size="sm" onClick={finishUploadFlow}>
                    Lewati Upload
                  </Button>
                  <Button variant="primary" size="sm" onClick={goToParsing} disabled={primaryDisabled}>
                    Lanjut ke Data Parsing
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={finishUploadFlow}>
                  Lanjut ke Form
                </Button>
              )}
              <button
                type="button"
                onClick={handleDismissRequest}
                className="insw-btn insw-btn--outline insw-btn--sm"
              >
                <span className="inline-flex shrink-0 items-center justify-center">
                  <CloseIcon />
                </span>
                <span className="min-w-0">Batal</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {dismissConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
              <div className="w-full max-w-[520px] rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.35)]">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-500/10 text-error-600">
                    <CloseIcon />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-neutral-800">Konfirmasi keluar?</h3>
                    <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                      Data parsing sudah tersedia. Apakah Anda yakin ingin keluar dari proses ini?
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" size="sm" onClick={() => setDismissConfirmOpen(false)}>
                    Tidak
                  </Button>
                  <Button variant="error" size="sm" onClick={handleConfirmExit}>
                    Ya
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

    {selectedParseRow && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6" onClick={(event) => event.target === event.currentTarget && setSelectedParseRow(null)}>
          <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Tutup preview detail"
              onClick={() => setSelectedParseRow(null)}
            >
              <CloseIcon />
            </button>

            <div className="border-b border-border-primary px-5 py-5 pr-16 sm:px-8">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Detail Mapping</div>
              <h3 className="mt-1 text-[24px] font-semibold text-neutral-800">Seri {selectedParseRow.seri}</h3>
              <p className="mt-1 max-w-3xl text-[12px] text-neutral-600 sm:text-[13px]">
                Lihat data barang yang dipetakan AI beserta sumber OCR yang dipakai untuk baris ini.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Data Barang</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">Hasil parse untuk seri {selectedParseRow.seri}</div>
                  </div>

                  <div className="mt-4 grid gap-2 text-[12px]">
                    {[
                      { label: "Seri", value: selectedParseRow.seri },
                      { label: "Uraian Barang", value: selectedParseRow.uraian },
                      { label: "HS Code", value: selectedParseRow.hsCode },
                      { label: "Qty", value: selectedParseRow.quantity },
                      { label: "Sumber", value: selectedParseRow.source.label },
                      { label: "File", value: selectedParseRow.source.fileName },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-border-primary px-3 py-2">
                        <span className="text-neutral-600">{item.label}</span>
                        <span className="text-right font-semibold text-neutral-800">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50/70 p-3 text-[12px] leading-5 text-brand-primary-800">
                    Confidence parsing global: <span className="font-semibold">{parseConfidence}%</span> {parseConfidenceLabel}
                  </div>
                </section>

                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Preview Sumber OCR</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedParseRow.source.label}</div>
                  </div>

                  <div className="mt-4 h-[520px] overflow-hidden rounded-2xl border border-border-primary bg-background-primary/30">
                    {selectedParseRow.source.kind === "pdf" ? (
                      <Worker workerUrl={PDF_WORKER_URL}>
                        <Viewer fileUrl={`${SAMPLE_DRAFT_PDF}?v=${parseRevision}`} />
                      </Worker>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 shadow-sm">
                          <FileIcon />
                        </div>
                        <div className="mt-4 text-[14px] font-semibold text-neutral-800">{selectedParseRow.source.fileName}</div>
                        <p className="mt-2 max-w-sm text-[12px] leading-5 text-neutral-600">
                          Preview visual sumber ada pada dokumen OCR yang dipakai AI untuk memetakan baris ini.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-border-primary px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-neutral-600">Tutup detail untuk kembali ke tabel mapping.</div>
                <Button variant="outline" size="sm" onClick={() => setSelectedParseRow(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600 shadow-sm">
        <BotIcon />
      </div>
      <div className="max-w-[680px] rounded-2xl rounded-tl-md border border-border-primary bg-white px-4 py-3 text-[12px] leading-6 text-neutral-800 shadow-sm">
        {INITIAL_PROMPT}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[680px] rounded-2xl rounded-tr-md bg-brand-primary-500 px-4 py-3 text-[12px] leading-6 text-white shadow-sm">
        {text}
      </div>
    </div>
  );
}

const ANALYSIS_CHECKLIST = [
  "Mengidentifikasi aktivitas",
  "Mengidentifikasi jenis pelaku usaha",
  "Mencocokkan regulasi",
  "Menentukan dokumen yang diperlukan",
  "Menyiapkan proses parsing",
];

function AiStepModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: AiSubmissionDraft) => void;
}) {
  const [stage, setStage] = useState<WizardStep>("identifikasi");
  const [selectedActivity, setSelectedActivity] = useState<ActivityChoice | null>(null);
  const [branchActivity, setBranchActivity] = useState<Exclude<ActivityChoice, "tidak_yakin"> | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [messages, setMessages] = useState<ConversationMessage[]>([{ role: "assistant", text: INITIAL_PROMPT }]);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [docSelection, setDocSelection] = useState<string[]>([]);
  const [excelSlot, setExcelSlot] = useState<UploadSlot>(() =>
    createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true),
  );
  const [ocrSlots, setOcrSlots] = useState<UploadSlot[]>(() => createDefaultOcrSlots());
  const [customCounter, setCustomCounter] = useState(1);
  const [selectedParseRow, setSelectedParseRow] = useState<ParseMappingRow | null>(null);
  const [parseRevision, setParseRevision] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [pdfRevision, setPdfRevision] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const layoutPlugin = defaultLayoutPlugin({
    renderToolbar: () => <></>,
  });
  const toolbarPlugin = layoutPlugin.toolbarPluginInstance;
  const renderPdfToolbar = toolbarPlugin.renderDefaultToolbar((slot) => ({
    ...slot,
    EnterFullScreen: () => <></>,
    EnterFullScreenMenuItem: () => <></>,
  }));
  const draftPdfUrl = `${SAMPLE_DRAFT_PDF}?v=${pdfRevision}`;
  const uploadedExcelFiles = excelSlot.uploadedFile ? [excelSlot.uploadedFile] : [];
  const uploadedOcrFiles = ocrSlots.filter((slot) => slot.uploadedFile).map((slot) => slot.uploadedFile as string);
  const uploadedFiles = [...uploadedExcelFiles, ...uploadedOcrFiles];
  const pdfPreviewPane = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-primary bg-white">
      {pdfStatus === "ready" ? (
        <>
          <div className="border-b border-border-primary bg-background-primary/70 px-2 py-2">
            <toolbarPlugin.Toolbar>{renderPdfToolbar}</toolbarPlugin.Toolbar>
          </div>
          <div className="min-h-0 flex-1">
            <Worker workerUrl={PDF_WORKER_URL}>
              <Viewer fileUrl={draftPdfUrl} plugins={[layoutPlugin]} />
            </Worker>
          </div>
        </>
      ) : pdfStatus === "loading" ? (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="text-[14px] font-semibold text-neutral-800">Memuat preview PDF</div>
            <div className="mt-2 text-[12px] leading-5 text-neutral-600">Menyiapkan draft surat untuk ditinjau.</div>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="text-[14px] font-semibold text-neutral-800">Draft PDF belum tersedia</div>
            <div className="mt-2 text-[12px] leading-5 text-neutral-600">
              Preview akan muncul jika file sample ada di folder public.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const activeQuestion = useMemo(() => {
    if (selectedActivity === "tidak_yakin" && !branchActivity) {
      return TRIAGE_QUESTION;
    }

    if (!branchActivity) return null;

    return getQuestionFlow(branchActivity)[questionIndex] ?? null;
  }, [branchActivity, questionIndex, selectedActivity]);

  const analysis = branchActivity ? getAnalysisResult(branchActivity, answers) : null;
  const requiredDocuments = analysis?.dokumenWajib ?? OCR_UPLOAD_DEFAULTS.map((item) => item.label);
  const requiredDocumentsKey = requiredDocuments.join("|");
  const smartDraft = useMemo(
    () => (branchActivity ? buildAiDraftFromAnalysis(branchActivity, answers, uploadedFiles) : null),
    [answers, branchActivity, uploadedFiles],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setStage("identifikasi");
      setSelectedActivity(null);
      setBranchActivity(null);
      setQuestionIndex(0);
      setAnswers({});
      setMessages([{ role: "assistant", text: INITIAL_PROMPT }]);
      setAnalysisReady(false);
      setDocSelection([]);
      setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
      setOcrSlots(createDefaultOcrSlots());
      setCustomCounter(1);
      setPdfStatus("loading");
      setPdfRevision(0);
      setPreviewOpen(false);
      setDismissConfirmOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "dokumen") return;

    setOcrSlots((current) => {
      const requiredSlots = requiredDocuments.map((document, index) => {
        const existing = current[index];
        if (existing) {
          return {
            ...existing,
            label: document,
            description: "Dokumen dasar untuk membantu identifikasi dan validasi data barang.",
            required: true,
            removable: false,
          };
        }

        return createUploadSlot(`ocr-${index}-${Date.now()}`, document, "Dokumen dasar untuk membantu identifikasi dan validasi data barang.", true);
      });

      const customSlots = current.filter((slot, index) => index >= requiredDocuments.length && slot.removable);
      return [...requiredSlots, ...customSlots];
    });
  }, [open, requiredDocumentsKey, stage]);

  useEffect(() => {
    if (!open) return;

    const stored = sessionStorage.getItem(AI_WIZARD_STORAGE_KEY);
    if (!stored) return;

    try {
      const snapshot = JSON.parse(stored) as AiWizardSnapshot;
      setStage(snapshot.stage ?? "identifikasi");
      setSelectedActivity(snapshot.selectedActivity ?? null);
      setBranchActivity(snapshot.branchActivity ?? null);
      setQuestionIndex(snapshot.questionIndex ?? 0);
      setAnswers(snapshot.answers ?? {});
      setMessages(snapshot.messages?.length ? snapshot.messages : [{ role: "assistant", text: INITIAL_PROMPT }]);
      setAnalysisReady(Boolean(snapshot.analysisReady));
      setDocSelection(snapshot.docSelection ?? []);
      setPdfStatus(snapshot.pdfStatus ?? "loading");
      setPdfRevision(snapshot.pdfRevision ?? 0);
    } catch {
      sessionStorage.removeItem(AI_WIZARD_STORAGE_KEY);
    }
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "parsing") return;

    let active = true;
    setPdfStatus("loading");

    fetch(SAMPLE_DRAFT_PDF, { method: "HEAD" })
      .then((response) => {
        if (!active) return;
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        setPdfStatus(response.ok && contentType.includes("pdf") ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setPdfStatus("missing");
      });

    return () => {
      active = false;
    };
  }, [open, pdfRevision, stage]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [analysisReady, messages, stage, uploadedFiles]);

  useLayoutEffect(() => {
    if (!previewOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  const parseSources = useMemo<ParseSourcePreview[]>(() => {
    if (uploadedFiles.length > 0) {
      return uploadedFiles.map((fileName, index) => ({
        id: `source-${index + 1}`,
        label: index === 0 ? "Data Barang" : `OCR ${index}`,
        fileName,
        kind: fileName.toLowerCase().endsWith(".pdf") ? ("pdf" as const) : ("image" as const),
      }));
    }

    return [
      { id: "ocr-a", label: "OCR A", fileName: "ocr-sumber-a.pdf", kind: "pdf" },
      { id: "ocr-b", label: "OCR B", fileName: "ocr-sumber-b.png", kind: "image" },
    ];
  }, [uploadedFiles]);

  const parseRows = useMemo<ParseMappingRow[]>(() => {
    const sourceA = parseSources[0];
    const sourceB = parseSources[1] ?? sourceA;
    const rows: Array<Omit<ParseMappingRow, "source"> & { sourceIndex: number }> = [
      { seri: "1", uraian: "Barang contoh A", hsCode: "8471.30.10", quantity: "10", sourceIndex: 0 },
      { seri: "2", uraian: "Barang contoh B", hsCode: "8471.30.90", quantity: "4", sourceIndex: 0 },
      { seri: "3", uraian: "Barang contoh C", hsCode: "8504.40.90", quantity: "8", sourceIndex: 0 },
      { seri: "4", uraian: "Barang contoh D", hsCode: "3923.10.90", quantity: "12", sourceIndex: 1 },
      { seri: "5", uraian: "Barang contoh E", hsCode: "7326.90.99", quantity: "2", sourceIndex: 1 },
    ];

    return rows.map((row) => ({
      seri: row.seri,
      uraian: row.uraian,
      hsCode: row.hsCode,
      quantity: row.quantity,
      source: row.sourceIndex === 0 ? sourceA : sourceB,
    }));
  }, [parseSources]);

  const parseConfidence = useMemo(() => {
    if (!uploadedFiles.length) return 0;
    return Math.min(99, 84 + uploadedFiles.length * 3 + parseRevision * 2);
  }, [parseRevision, uploadedFiles.length]);

  const parseConfidenceLabel =
    parseConfidence >= 95 ? "Aman" : parseConfidence >= 60 ? "Perlu dicek" : parseConfidence > 0 ? "Wajib review" : "Menunggu upload";
  const parseConfidenceTone =
    parseConfidence >= 95
      ? "border-success-200 bg-success-50 text-success-700"
      : parseConfidence >= 60
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-error-200 bg-error-50 text-error-700";
  const parseSummaryTone =
    parseConfidence >= 95
      ? "border-success-200 bg-success-50/70 text-success-800"
      : parseConfidence >= 60
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-error-200 bg-error-50/70 text-error-800";
  const parseConfidenceHint =
    parseConfidence >= 95
      ? "Confidence sudah aman untuk lanjut ke form."
      : parseConfidence >= 60
        ? "Hasil parsing cukup baik, tapi tetap disarankan cek beberapa bagian."
        : "Hasil parsing belum stabil. Sebaiknya parse ulang sebelum lanjut.";
  const barangCount = uploadedFiles.length ? Math.max(1, uploadedFiles.length * 2) : 0;
  const supportCount = uploadedFiles.length > 1 ? uploadedFiles.length - 1 : 0;
  const mappedFields = uploadedFiles.length ? 12 : 0;
  const notice = buildUploadNotice(uploadedFiles.slice(0, 1), uploadedFiles.slice(1));
  const hasPendingUploads =
    excelSlot.status === "picked" ||
    excelSlot.status === "failed" ||
    ocrSlots.some((slot) => slot.status === "picked" || slot.status === "failed");
  const handleReparse = () => {
    setParseRevision((current) => current + 1);
    setSelectedParseRow(null);
  };

  if (!open) return null;

  const stepIndex = STEP_LABELS.findIndex((step) => step.key === stage);

  const resetConversation = () => {
    setStage("identifikasi");
    setSelectedActivity(null);
    setBranchActivity(null);
    setQuestionIndex(0);
    setAnswers({});
    setMessages([{ role: "assistant", text: INITIAL_PROMPT }]);
    setAnalysisReady(false);
    setDocSelection([]);
    setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setPdfStatus("loading");
    setPdfRevision(0);
    setPreviewOpen(false);
  };

  const persistWizardSnapshot = () => {
    const snapshot: AiWizardSnapshot = {
      stage,
      selectedActivity,
      branchActivity,
      questionIndex,
      answers,
      messages,
      analysisReady,
      uploadedFiles,
      docSelection,
      pdfStatus,
      pdfRevision,
    };

    sessionStorage.setItem(AI_WIZARD_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const handleDismissRequest = () => {
    if (stage === "parsing") {
      setDismissConfirmOpen(true);
      return;
    }

    onClose();
  };

  const handleConfirmExit = () => {
    setDismissConfirmOpen(false);
    onClose();
  };

  const pushMessage = (message: ConversationMessage) => {
    setMessages((current) => [...current, message]);
  };

  const beginActivity = (choice: ActivityChoice) => {
    const nextBranch = choice === "tidak_yakin" ? null : choice;
    const initialQuestion = choice === "tidak_yakin" ? TRIAGE_QUESTION : getQuestionFlow(choice)[0];

    setStage("identifikasi");
    setSelectedActivity(choice);
    setBranchActivity(nextBranch);
    setQuestionIndex(0);
    setAnswers({});
    setAnalysisReady(false);
    setDocSelection([]);
    setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setMessages((current) => [
      { role: "assistant", text: INITIAL_PROMPT },
      { role: "user", text: getActivityLabel(choice) },
      { role: "assistant", text: initialQuestion.prompt },
    ]);
  };

  const advanceBranchFlow = (nextBranch: Exclude<ActivityChoice, "tidak_yakin">, nextAnswers: Record<string, string | string[]>) => {
    const flow = getQuestionFlow(nextBranch);
    const nextQuestion = flow[questionIndex + 1];

    if (nextQuestion) {
      setQuestionIndex((current) => current + 1);
      setMessages((current) => [...current, { role: "assistant", text: nextQuestion.prompt }]);
      return;
    }

    setAnalysisReady(true);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: "Baik, saya sudah mengolah jawaban Anda. Berikut hasil identifikasi untuk ditinjau sebelum upload dokumen.",
      },
    ]);
  };

  const handleSingleSelect = (value: string) => {
    if (!activeQuestion) return;

    const nextAnswers = { ...answers, [activeQuestion.id]: value };
    setAnswers(nextAnswers);
    pushMessage({ role: "user", text: getAnswerLabel(activeQuestion, value) });

    if (activeQuestion.id === "triage") {
      const selectedBranch = getBranchChoice(value);
      if (!selectedBranch) return;
      setSelectedActivity(selectedBranch);
      setBranchActivity(selectedBranch);
      setQuestionIndex(0);
      setMessages((current) => [...current, { role: "assistant", text: getQuestionFlow(selectedBranch)[0].prompt }]);
      return;
    }

    if (!branchActivity) return;
    advanceBranchFlow(branchActivity, nextAnswers);
  };

  const handleMultiToggle = (value: string) => {
    setDocSelection((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const confirmMultiSelection = () => {
    if (!activeQuestion?.multi || !branchActivity) return;

    const nextAnswers = { ...answers, [activeQuestion.id]: docSelection};
    setAnswers(nextAnswers);
    pushMessage({
      role: "user",
      text: docSelection.length ? getAnswerLabel(activeQuestion, docSelection) : "Belum ada dokumen yang dipilih",
    });
    advanceBranchFlow(branchActivity, nextAnswers);
  };

  const handleExcelPick = (file: File | null) => {
    setExcelSlot((current) =>
      file
        ? { ...current, selectedFile: file.name, status: "picked", error: null }
        : { ...current, selectedFile: null, uploadedFile: null, status: "empty", error: null },
    );
  };

  const handleExcelUpload = () => {
    setExcelSlot((current) => {
      if (!current.selectedFile) return { ...current, status: "failed", error: "Pilih file Excel dulu." };
      return { ...current, uploadedFile: current.selectedFile, status: "uploaded", error: null };
    });
  };

  const handleOcrPick = (slotId: string, file: File | null) => {
    setOcrSlots((current) =>
      current.map((slot) =>
        slot.id !== slotId
          ? slot
          : file
            ? { ...slot, selectedFile: file.name, status: "picked", error: null }
            : { ...slot, selectedFile: null, uploadedFile: null, status: "empty", error: null },
      ),
    );
  };

  const handleOcrUpload = (slotId: string) => {
    setOcrSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        if (!slot.selectedFile) return { ...slot, status: "failed", error: "Pilih file OCR dulu." };
        return { ...slot, uploadedFile: slot.selectedFile, status: "uploaded", error: null };
      }),
    );
  };

  const addOcrSlot = () => {
    setCustomCounter((current) => current + 1);
    setOcrSlots((current) => [
      ...current,
      createUploadSlot(
        `custom-${Date.now()}`,
        `Dokumen tambahan ${customCounter + 1}`,
        "Tambahkan dokumen OCR lain yang perlu diunggah.",
        false,
        true,
      ),
    ]);
  };

  const handleExcelDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) handleExcelPick(file);
  };

  const handleOcrDrop = (event: DragEvent<HTMLDivElement>, slotId: string) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) handleOcrPick(slotId, file);
  };

  const handleContinueToParsing = () => {
    setStage("parsing");
  };

  const handleContinue = () => {
    if (!smartDraft) return;
    const submissionDraft = toSubmissionDraft(smartDraft);
    sessionStorage.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify(submissionDraft));
    sessionStorage.removeItem(AI_WIZARD_STORAGE_KEY);
    onSubmit(submissionDraft);
    onClose();
  };

  const renderMessage = (message: ConversationMessage, index: number) =>
    message.role === "assistant" ? (
      <div key={`${message.role}-${index}`} className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600 shadow-sm">
          <BotIcon />
        </div>
        <div className="max-w-[680px] rounded-2xl rounded-tl-md border border-border-primary bg-white px-4 py-3 text-[12px] leading-6 text-neutral-800 shadow-sm">
          {message.text}
        </div>
      </div>
    ) : (
      <div key={`${message.role}-${index}`} className="flex justify-end">
        <div className="max-w-[680px] rounded-2xl rounded-tr-md bg-brand-primary-500 px-4 py-3 text-[12px] leading-6 text-white shadow-sm">
          {message.text}
        </div>
      </div>
    );

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
    >
      <div className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-[940px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3 pr-12">
            <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-500">
              <SparkleIcon />
            </div>
            <div>
              <h3 className="text-[24px] font-semibold text-neutral-800">Smart Submission Assistant</h3>
              <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
                Asisten cerdas untuk membantu Anda menentukan jenis pengajuan yang tepat.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            {STEP_LABELS.map((step, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <div key={step.key} className="relative flex flex-col items-center">
                  {index < STEP_LABELS.length - 1 && (
                    <div className="absolute left-1/2 top-5 h-px w-[calc(100%+0.75rem)] bg-border-primary" />
                  )}
                  <div
                    className={[
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-[12px] font-semibold",
                      active || done
                        ? "border-brand-primary-500 bg-brand-primary-500 text-white"
                        : "border-border-primary bg-white text-neutral-500",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {done ? "✓" : step.icon}
                  </div>
                  <div
                    className={[
                      "mt-2 text-center text-[11px] font-medium sm:text-[12px]",
                      active || done ? "text-brand-primary-700" : "text-neutral-500",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <div className="flex flex-col gap-4">
            {messages.map(renderMessage)}

            {stage === "identifikasi" && !branchActivity && !analysisReady && !selectedActivity && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {ACTIVITY_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => beginActivity(option.key)}
                    className="group rounded-2xl border border-border-primary bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-500 transition-colors group-hover:bg-brand-primary-500 group-hover:text-white">
                      <PlusSmallIcon />
                    </div>
                    <div className="mt-4 text-[14px] font-semibold text-neutral-800">{option.title}</div>
                    <p className="mt-2 text-[12px] leading-5 text-neutral-600">{option.description}</p>
                  </button>
                ))}
              </div>
            )}

            {stage === "identifikasi" && !analysisReady && activeQuestion && (
              <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                  {selectedActivity === "tidak_yakin" && !branchActivity ? "Triage Identifikasi" : "Pertanyaan Identifikasi"}
                </div>
                <div className="mt-2 text-[14px] font-semibold text-neutral-800">{activeQuestion.prompt}</div>

                {!activeQuestion.multi ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {activeQuestion.options.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleSingleSelect(option.key)}
                        className="rounded-2xl border border-border-primary bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md"
                      >
                        <div className="text-[14px] font-semibold text-neutral-800">{option.label}</div>
                        {option.description && (
                          <div className="mt-2 text-[12px] leading-5 text-neutral-600">{option.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {activeQuestion.options.map((option) => {
                        const selected = docSelection.includes(option.key);
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleMultiToggle(option.key)}
                            className={[
                              "rounded-2xl border p-4 text-left shadow-sm transition-all",
                              selected
                                ? "border-brand-primary-500 bg-brand-primary-50"
                                : "border-border-primary bg-white hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[14px] font-semibold text-neutral-800">{option.label}</div>
                              <div
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                                  selected
                                    ? "border-brand-primary-500 bg-brand-primary-500 text-white"
                                    : "border-border-primary text-transparent",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                {"✓"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                      <Button variant="outline" size="sm" onClick={() => setDocSelection([])}>
                        Reset Pilihan
                      </Button>
                      <Button variant="primary" size="sm" onClick={confirmMultiSelection}>
                        Lanjut
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === "identifikasi" && analysisReady && analysis && (
              <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                      Analisis Identifikasi
                    </div>
                    <h4 className="mt-1 text-[18px] font-semibold text-neutral-800">{analysis.jenisPengajuan}</h4>
                    <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-700">
                      {analysis.rekomendasi}
                    </p>
                  </div>
                  <div className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-600">
                    Selesai
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-border-primary bg-background-primary/50 p-4">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                      Progress Analisis
                    </div>
                    <div className="mt-3 space-y-2">
                      {ANALYSIS_CHECKLIST.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[12px] text-neutral-800">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-300/25 text-success-600">
                            {"✓"}
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-primary bg-background-primary/50 p-4">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Ringkasan Identifikasi</div>
                    <div className="mt-2 text-[12px] leading-6 text-neutral-800">{analysis.ringkasan}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/50 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-brand-primary-600">
                    Dokumen yang perlu diunggah
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredDocuments.map((document) => (
                      <span
                        key={document}
                        className="rounded-full border border-brand-primary-100 bg-white px-3 py-1 text-[12px] font-medium text-brand-primary-700"
                      >
                        {document}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={resetConversation}>
                    Ubah Jawaban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContinue}
                  >
                    Lewati Upload Dokumen
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setStage("dokumen")}>
                    Lanjut ke Upload Dokumen
                  </Button>
                </div>
              </div>
            )}

            {stage === "dokumen" && analysis && (
              <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-3 shadow-sm sm:p-4">
                <div className="grid gap-4">
                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">
                      Upload Data Barang
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">Pilih file Excel untuk data barang</div>
                  </div>

                  <div
                    className="mt-4 rounded-2xl border-2 border-dashed border-border-primary bg-background-primary/30 p-4"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleExcelDrop}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">
                        <UploadIcon />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-neutral-800">Upload Data Barang</div>
                        <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                          File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Selected file</div>
                        <div className="mt-1 text-[12px] font-medium text-neutral-800">
                          {excelSlot.selectedFile ?? "Belum ada file"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <label htmlFor="ai-excel-upload-input">Pilih File</label>
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleExcelUpload} disabled={!excelSlot.selectedFile}>
                          Upload
                        </Button>
                      </div>
                    </div>

                    <input
                      id="ai-excel-upload-input"
                      ref={inputRef}
                      type="file"
                      accept=".xls,.xlsx"
                      className="hidden"
                      onChange={(event) => {
                        handleExcelPick(event.target.files?.[0] ?? null);
                      }}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">
                      Upload OCR
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">Upload dokumen dasar satu per satu</div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {ocrSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="rounded-2xl border border-border-primary bg-background-primary/20 p-4"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleOcrDrop(event, slot.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">
                              <FileIcon />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[14px] font-semibold text-neutral-800">{slot.label || requiredDocuments[index] || `Dokumen ${index + 1}`}</div>
                                <span
                                  className={[
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    slot.required ? "bg-error-50 text-error-600" : "bg-neutral-100 text-neutral-600",
                                  ].join(" ")}
                                >
                                  {slot.required ? "Wajib" : "Opsional"}
                                </span>
                              </div>
                              <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                                {slot.description}
                              </p>
                            </div>
                          </div>

                          <span className={["rounded-full px-3 py-1 text-[12px] font-semibold", slot.status === "uploaded" ? "bg-success-50 text-success-600" : "bg-neutral-100 text-neutral-600"].join(" ")}>
                            {slot.status === "uploaded" ? "Terverifikasi" : slot.status === "picked" ? "Siap upload" : slot.status === "failed" ? "Gagal" : "Belum dipilih"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Selected file</div>
                            <div className="mt-1 text-[12px] font-medium text-neutral-800">{slot.selectedFile ?? "Belum ada file"}</div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <label htmlFor={`ai-ocr-upload-${slot.id}`}>Pilih File</label>
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => handleOcrUpload(slot.id)} disabled={!slot.selectedFile}>
                              Upload
                            </Button>
                            <input
                              id={`ai-ocr-upload-${slot.id}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(event) => handleOcrPick(slot.id, event.target.files?.[0] ?? null)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" startIcon={<PlusIcon />} onClick={addOcrSlot}>
                      Tambah Dokumen
                    </Button>
                  </div>
                </section>

                <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border-primary bg-white px-4 py-3 shadow-sm">
                  <Button variant="outline" size="sm" onClick={handleContinue}>
                    Lewati
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleContinueToParsing} disabled={hasPendingUploads}>
                    Lanjut ke Data Parsing
                  </Button>
                </div>
              </div>
              </div>
            )}

            {stage === "parsing" && smartDraft && (
              <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-border-primary pb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Data Parsing</div>
                    <div className="mt-1 text-[16px] font-semibold text-neutral-800">Rancangan Pengajuan Otomatis</div>
                  </div>
                  <div className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-600">
                    Siap dipakai
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
                  <div className={["rounded-2xl border p-4 shadow-sm", parseConfidenceTone].join(" ")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em]">Confidence global</div>
                        <div className="mt-1 text-[28px] font-semibold leading-none">{parseConfidence}%</div>
                      </div>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-neutral-800 shadow-sm">
                        {parseConfidenceLabel}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-[12px] leading-5">{parseConfidenceHint}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleReparse} startIcon={<RefreshIcon />}>
                        Parse Ulang
                      </Button>
                      <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-semibold text-neutral-700">
                        Global, bukan per field
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {[
                      { label: "Jumlah barang terbaca", value: `${barangCount}` },
                      { label: "Jumlah dokumen pendukung", value: `${supportCount}` },
                      { label: "Field yang berhasil dipetakan", value: `${mappedFields}` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border-primary bg-background-primary/35 p-4 shadow-sm">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{item.label}</div>
                        <div className="mt-2 text-[24px] font-semibold leading-none text-neutral-800">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={["mt-4 rounded-2xl border px-4 py-3 text-[12px] leading-5", parseSummaryTone].join(" ")}>
                  {notice}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-brand-primary-100 bg-brand-primary-50/35">
                  <div className="flex items-center justify-between gap-3 border-b border-brand-primary-100 px-4 py-3">
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">
                        Preview Mapping
                      </div>
                      <div className="mt-1 text-[13px] font-semibold text-neutral-800">Tabel data barang hasil parse</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand-primary-700 shadow-sm">
                      {parseRows.length} barang
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-primary text-left text-[12px]">
                      <thead className="bg-white/70 text-neutral-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Seri</th>
                          <th className="px-4 py-3 font-semibold">Uraian Barang</th>
                          <th className="px-4 py-3 font-semibold">HS Code</th>
                          <th className="px-4 py-3 font-semibold">Sumber OCR</th>
                          <th className="px-4 py-3 font-semibold text-right">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary bg-white">
                        {parseRows.map((row) => (
                          <tr key={row.seri} className="transition-colors hover:bg-brand-primary-50/60">
                            <td className="px-4 py-3 font-semibold text-neutral-800">{row.seri}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-neutral-800">{row.uraian}</div>
                              <div className="mt-1 text-[11px] text-neutral-500">Qty {row.quantity}</div>
                            </td>
                            <td className="px-4 py-3 text-neutral-700">{row.hsCode}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-neutral-800">{row.source.label}</div>
                              <div className="mt-1 text-[11px] text-neutral-500">{row.source.fileName}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" onClick={() => setSelectedParseRow(row)}>
                                Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={resetConversation}>
                    Ubah Jawaban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReparse}
                  >
                    Generate Ulang Parsing
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleContinue}>
                    Ok, Lanjut ke Form
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border-primary bg-[#f8fbff] px-5 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-[12px] text-neutral-600">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v6h5v2h-7V7h2Z" />
                </svg>
              </span>
              <span>Data Anda aman dan hanya digunakan untuk keperluan pengajuan.</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ModalCancelButton onClick={handleDismissRequest} />
            </div>
          </div>
          </div>
        </div>
      </div>

      {dismissConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
              <div className="w-full max-w-[520px] rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.35)]">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-500/10 text-error-600">
                    <CloseIcon />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-neutral-800">Konfirmasi keluar?</h3>
                    <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                      Data parsing sudah tersedia. Apakah Anda yakin ingin keluar dari proses ini?
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" size="sm" onClick={() => setDismissConfirmOpen(false)}>
                    Tidak
                  </Button>
                  <Button variant="error" size="sm" onClick={handleConfirmExit}>
                    Ya
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

    {selectedParseRow && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
        onClick={(event) => event.target === event.currentTarget && setSelectedParseRow(null)}
      >
        <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Tutup preview detail"
            onClick={() => setSelectedParseRow(null)}
          >
            <CloseIcon />
          </button>

          <div className="border-b border-border-primary px-5 py-5 pr-16 sm:px-8">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Detail Mapping</div>
            <h3 className="mt-1 text-[24px] font-semibold text-neutral-800">Seri {selectedParseRow.seri}</h3>
            <p className="mt-1 max-w-3xl text-[12px] text-neutral-600 sm:text-[13px]">
              Lihat data barang yang dipetakan AI beserta sumber OCR yang dipakai untuk baris ini.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                <div className="border-b border-border-primary pb-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Data Barang</div>
                  <div className="mt-1 text-[13px] font-semibold text-neutral-800">Hasil parse untuk seri {selectedParseRow.seri}</div>
                </div>

                <div className="mt-4 grid gap-2 text-[12px]">
                  {[
                    { label: "Seri", value: selectedParseRow.seri },
                    { label: "Uraian Barang", value: selectedParseRow.uraian },
                    { label: "HS Code", value: selectedParseRow.hsCode },
                    { label: "Qty", value: selectedParseRow.quantity },
                    { label: "Sumber", value: selectedParseRow.source.label },
                    { label: "File", value: selectedParseRow.source.fileName },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-border-primary px-3 py-2">
                      <span className="text-neutral-600">{item.label}</span>
                      <span className="text-right font-semibold text-neutral-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50/70 p-3 text-[12px] leading-5 text-brand-primary-800">
                  Confidence parsing global: <span className="font-semibold">{parseConfidence}%</span> {parseConfidenceLabel}
                </div>
              </section>

              <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                <div className="border-b border-border-primary pb-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Preview Sumber OCR</div>
                  <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedParseRow.source.label}</div>
                </div>

                <div className="mt-4 h-[520px] overflow-hidden rounded-2xl border border-border-primary bg-background-primary/30">
                  {selectedParseRow.source.kind === "pdf" ? (
                    <Worker workerUrl={PDF_WORKER_URL}>
                      <Viewer fileUrl={`${SAMPLE_DRAFT_PDF}?v=${parseRevision}`} />
                    </Worker>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 shadow-sm">
                        <FileIcon />
                      </div>
                      <div className="mt-4 text-[14px] font-semibold text-neutral-800">{selectedParseRow.source.fileName}</div>
                      <p className="mt-2 max-w-sm text-[12px] leading-5 text-neutral-600">
                        Preview visual sumber ada pada dokumen OCR yang dipakai AI untuk memetakan baris ini.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="border-t border-border-primary px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] text-neutral-600">Tutup detail untuk kembali ke tabel mapping.</div>
              <Button variant="outline" size="sm" onClick={() => setSelectedParseRow(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
function DraftField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-primary bg-background-primary/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">{label}</div>
      <div className="mt-1 text-[12px] font-medium text-neutral-800">{value}</div>
    </div>
  );
}

function SidebarIcon({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold",
        active ? "bg-white text-[#02275D]" : "bg-brand-primary-50 text-brand-primary-600",
      ].join(" ")}
    >
      {label.slice(0, 1)}
    </span>
  );
}

export function DashboardSidebar() {
  const { location } = useRouterState();

  return (
    <aside className="sticky top-[72px] z-20 w-full shrink-0 self-start lg:top-[var(--shell-sticky-top)] lg:w-[240px]">
      <div className="max-h-[calc(100vh-var(--shell-sticky-top)-16px)] overflow-auto rounded-lg border border-border-primary bg-white p-3 shadow-sm">
        <div className="mb-3 px-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
          Menu
        </div>
        <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {menuItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-[#02275D] text-white"
                    : "text-neutral-700 hover:bg-brand-primary-50 hover:text-brand-primary-700",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <SidebarIcon label={item.label} active={active} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [query, setQuery] = useState("");
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [manualMethodOpen, setManualMethodOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<UploadFlowContext | null>(null);
  const filteredExamples = suratExamples.filter((item) => {
    const haystack = `${item.title} ${item.file} ${item.type} ${item.note}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("launcher") === "1") {
      setLauncherOpen(true);
      navigate({ to: "/", search: {} as never, replace: true });
    }
  }, [location.search, navigate]);

  const handleAiSubmit = (draft: AiSubmissionDraft) => {
    storeFormSnapshot("assistant", draft);
    navigate({ to: "/form" });
  };

  const handleStartChoice = (choice: StartChoice) => {
    setLauncherOpen(false);

    if (choice === "assistant") {
      setAssistantOpen(true);
      return;
    }

    if (choice === "manual") {
      setManualMethodOpen(true);
      return;
    }
  };

  const handleManualMethodChoice = (choice: Exclude<StartChoice, "assistant">) => {
    setManualMethodOpen(false);

    if (choice === "manual") {
      setManualOpen(true);
      return;
    }

    if (choice === "copy") {
      setCopyOpen(true);
      return;
    }

    setUploadContext({ source: "upload" });
    setUploadOpen(true);
  };

  const buildDraftFromUpload = (context: UploadFlowContext | null, excelFiles: string[], ocrFiles: string[]) => {
    const hasExcel = excelFiles.length > 0;
    const hasOcr = ocrFiles.length > 0;
    const sourceDocuments = hasExcel
      ? [...excelFiles, ...ocrFiles]
      : hasOcr
        ? [...ocrFiles]
        : context?.copyRow
          ? [context.copyRow.dokumen]
          : context?.documentType
            ? [context.documentType]
            : [];

    const jenisPengajuan =
      context?.documentType ||
      context?.copyRow?.dokumen ||
      (hasExcel ? "Pengajuan Barang Masuk / Impor" : hasOcr ? "Pengajuan Barang Masuk / Impor" : "Pengajuan Umum");

    const companyName = context?.copyRow?.perusahaan || "PT Contoh Nusantara";
    const npwp = context?.source === "copy" ? "01.234.567.8-999.000" : "01.234.567.8-999.000";
    const nib = context?.source === "copy" ? `COPY-${context.copyRow?.nomor ?? "0001"}` : "1234567890123";

    const draft: AiSubmissionDraft = {
      jenisPengajuan,
      namaPerusahaan: companyName,
      npwp,
      nib,
      keterangan:
        hasExcel && hasOcr
          ? "Data Excel digunakan sebagai sumber utama. Dokumen OCR digunakan sebagai validasi dan pelengkap data."
          : hasOcr
            ? "Data hasil OCR perlu ditinjau kembali."
            : context?.source === "copy"
              ? `Prefill disiapkan dari pengajuan sebelumnya ${context.copyRow?.nomor ?? ""}.`
              : `Prefill disiapkan dari dokumen ${jenisPengajuan}.`,
      dokumen: sourceDocuments.length ? sourceDocuments : ["surat_pengajuan_impor_v01.docx"],
    };

    const formState = buildBaseFormSnapshot(
      draft.jenisPengajuan,
      draft.namaPerusahaan,
      draft.npwp,
      draft.nib,
      draft.dokumen,
    );

    return { draft, formState };
  };

  const handleUploadComplete = ({ excelFiles, ocrFiles }: { excelFiles: string[]; ocrFiles: string[] }) => {
    const { draft, formState } = buildDraftFromUpload(uploadContext, excelFiles, ocrFiles);
    storeFormSnapshot(uploadContext?.source ?? "manual", draft, formState, buildUploadNotice(excelFiles, ocrFiles));
    navigate({ to: "/form" });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-primary bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5 lg:px-5">
      <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary-700 via-[#03306f] to-brand-primary-900 p-5 text-white shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">
            Featured
          </span>
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-white/90">
            <CalendarIcon />
            <span>Dashboard aktif</span>
          </div>
        </div>

        <h3 className="mt-5 max-w-4xl text-left text-[28px] font-semibold leading-tight text-white sm:text-[38px]">
          Selamat datang, Admin
        </h3>

        <p className="mt-3 max-w-5xl text-[12px] leading-6 text-white/90 sm:text-[13px]">
          Ringkasan pengajuan yang sedang berjalan, lengkap dengan akses cepat untuk memulai pengajuan baru.
        </p>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setLauncherOpen(true)}
          startIcon={<PlusIcon />}
          className="mt-6 w-fit border-white/20 bg-white text-brand-primary-800 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out hover:!translate-y-0 hover:border-white/40 hover:bg-white hover:shadow-[0_16px_34px_rgba(0,0,0,0.14)] focus-visible:ring-brand-primary-100"
        >
          Pengajuan
        </Button>
      </section>

      <div className="flex flex-col gap-4 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Dashboard</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
            Ringkasan Pengajuan
          </h5>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to="/data"
            search={{ status: stat.filter } as never}
            className={`group rounded-lg border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)] ${stat.cardTone} ${stat.hoverTone}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-700">{stat.label}</div>
                <div className={`mt-2 text-[28px] font-semibold leading-none ${stat.textTone}`}>{stat.value}</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors duration-300 ${stat.badgeTone}`}>
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-border-primary bg-background-primary/40 p-3 sm:p-4">
        <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-600">Contoh Surat Pengajuan</div>
            <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
              Cari template surat atau file lampiran
            </h5>
          </div>
          <div className="relative w-full sm:max-w-[320px]">
            <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-neutral-500">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari contoh file..."
              className="h-11 w-full rounded-md border border-border-primary bg-white pl-10 pr-3 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredExamples.map((item) => (
            <article key={item.file} className="rounded-lg border border-border-primary bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-primary-600">
                    {item.type}
                  </div>
                  <h6 className="mt-2 text-[16px] font-semibold leading-snug text-neutral-800">{item.title}</h6>
                </div>
                <div className="rounded-md bg-brand-primary-50 px-2 py-1 text-[11px] font-semibold text-brand-primary-600">
                  File
                </div>
              </div>

              <p className="mt-3 text-[12px] leading-5 text-neutral-700">{item.note}</p>

              <div className="mt-4 rounded-md border border-border-primary bg-neutral-50 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Nama File</div>
                <div className="mt-1 break-all text-[12px] font-medium text-neutral-800">{item.file}</div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button variant="outline" size="sm">
                  Lihat
                </Button>
                <Button variant="primary" size="sm">
                  Unduh
                </Button>
              </div>
            </article>
          ))}
        </div>

        {filteredExamples.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border-secondary bg-white p-6 text-center text-[12px] text-neutral-600">
            Tidak ada contoh file yang cocok dengan pencarian.
          </div>
        )}
      </div>
      <StartSubmissionModal open={launcherOpen} onClose={() => setLauncherOpen(false)} onSelect={handleStartChoice} />
      <ManualMethodModal
        open={manualMethodOpen}
        onClose={() => setManualMethodOpen(false)}
        onBack={() => {
          setManualMethodOpen(false);
          setLauncherOpen(true);
        }}
        onSelect={handleManualMethodChoice}
      />
      <AiStepModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onSubmit={handleAiSubmit}
      />
      <ManualDocumentModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onBack={() => {
          setManualOpen(false);
          setManualMethodOpen(true);
        }}
        onSelect={(documentType) => {
          setManualOpen(false);
          setUploadContext({ source: "manual", documentType });
          setUploadOpen(true);
        }}
      />
      <CopyDataModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        onBack={() => {
          setCopyOpen(false);
          setManualMethodOpen(true);
        }}
        onUse={(row) => {
          setCopyOpen(false);
          setUploadContext({ source: "copy", copyRow: row });
          setUploadOpen(true);
        }}
      />
      <UploadBarangModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploadContext(null);
        }}
        onBack={() => {
          setUploadOpen(false);
          if (uploadContext?.source === "copy") {
            setCopyOpen(true);
            return;
          }
          if (uploadContext?.source === "manual") {
            setManualOpen(true);
            return;
          }
          setManualMethodOpen(true);
        }}
        context={uploadContext}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}

export function Dashboard() {
  return (
    <section className="px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        <DashboardSidebar />
        <DashboardContent />
      </div>
    </section>
  );
}

export function ProposalListTable({
  title = "Daftar Pengajuan",
  subtitle = "Berisi daftar pengajuan yang tampil pada halaman beranda operasional.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { location } = useRouterState();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = (searchParams.get("status") as "Semua" | ProposalStatus | null) ?? "Semua";
  const visibleRows = useMemo(() => {
    const byStatus = statusFilter === "Semua" ? proposalRows : proposalRows.filter((row) => row.status === statusFilter);
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return byStatus;

    return byStatus.filter((row) =>
      `${row.pengajuan} ${row.dokumen} ${row.kirim} ${row.perusahaan} ${row.status}`.toLowerCase().includes(normalized),
    );
  }, [searchQuery, statusFilter]);
  const summaryItems: Array<"Semua" | ProposalStatus> = ["Semua", "Draft", "Proses", "Disetujui", "Ditolak"];
  const summaryCounts: Record<"Semua" | ProposalStatus, number> = {
    Semua: proposalRows.length,
    Draft: proposalRows.filter((row) => row.status === "Draft").length,
    Proses: proposalRows.filter((row) => row.status === "Proses").length,
    Disetujui: proposalRows.filter((row) => row.status === "Disetujui").length,
    Ditolak: proposalRows.filter((row) => row.status === "Ditolak").length,
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-primary bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5 lg:px-5">
      <div className="flex flex-col gap-4 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Data Pengajuan</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">{title}</h5>
          <p className="mt-1 text-[12px] text-neutral-600">{subtitle}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-[320px]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="search"
              placeholder="Cari pengajuan..."
              prefixIcon={<SearchIcon />}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            startIcon={<PlusIcon />}
            className="!border-brand-primary-800 !bg-brand-primary-800 hover:!border-brand-primary-700 hover:!bg-brand-primary-700"
            onClick={() => navigate({ to: "/", search: { launcher: "1" } as never })}
          >
            Pengajuan
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {summaryItems.map((status) => {
          const meta = proposalStatusMeta[status];
          const active = statusFilter === status;
          return (
            <Link
              key={status}
              to="/data"
              search={{ status: status === "Semua" ? undefined : status } as never}
              className={`group rounded-xl border p-3 text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] ${
                active ? `${meta.activeTone} border-transparent` : `${meta.tone} ${meta.borderTone}`
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.14em] opacity-80">Filter</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight">{meta.label}</div>
                  <div className="mt-1 text-[28px] font-semibold leading-none">{summaryCounts[status]}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${active ? "bg-white/20" : "bg-white/60"}`}>
                  {active ? "Aktif" : "Lihat"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border-primary">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-full border-collapse text-left text-[12px]">
          <thead className="bg-brand-primary-500 text-white">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Nomor Pengajuan</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Jenis Dokumen</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Tanggal Kirim Dokumen</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Nama Perusahaan</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {visibleRows.map((row) => (
              <tr key={row.pengajuan} className="border-t border-border-primary hover:bg-brand-primary-50/30">
                <td className="px-3 py-2 align-middle text-brand-primary-600">{row.pengajuan}</td>
                <td className="px-3 py-2 align-middle">
                  <span className="inline-flex rounded-full bg-brand-primary-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary-700">
                    {row.dokumen}
                  </span>
                </td>
                <td className="px-3 py-2 align-middle">{row.kirim}</td>
                <td className="px-3 py-2 align-middle">
                  <span className="block max-w-[260px] whitespace-normal leading-5 text-neutral-800">
                    {row.perusahaan}
                  </span>
                </td>
                <td className="px-3 py-2 align-middle">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                      row.status === "Draft"
                        ? "bg-brand-primary-50 text-brand-primary-700"
                        : row.status === "Proses"
                          ? "bg-info-50 text-info-700"
                          : row.status === "Disetujui"
                            ? "bg-success-50 text-success-700"
                            : "bg-error-50 text-error-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      aria-label={`Detail ${row.pengajuan}`}
                      size="sm"
                      variant="info"
                    className="h-8 w-8 justify-center px-0"
                  >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    {row.status !== "Draft" ? (
                      <Button
                        aria-label={`Progress ${row.pengajuan}`}
                        size="sm"
                        variant="info"
                        className="h-8 w-8 justify-center px-0"
                        onClick={() => navigate({ to: "/progress", search: { pengajuan: row.pengajuan } as never })}
                      >
                        <ProgressIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {row.status === "Draft" || (row.status === "Ditolak" && row.canEditAfterReject) ? (
                      <Button
                        aria-label={`Edit ${row.pengajuan}`}
                        size="sm"
                        variant="warning"
                        className="h-8 w-8 justify-center px-0"
                      >
                        <PenNewSquareIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      aria-label={`Copy ${row.pengajuan}`}
                      size="sm"
                      variant="brand"
                      className="h-8 w-8 justify-center px-0"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    {row.status !== "Proses" ? (
                      <Button
                        aria-label={`Hapus ${row.pengajuan}`}
                        size="sm"
                        variant="error"
                        className="h-8 w-8 justify-center px-0"
                      >
                        <TrashBinTrashIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border-secondary bg-white p-6 text-center text-[12px] text-neutral-600">
          Tidak ada pengajuan dengan filter ini.
        </div>
      ) : null}
    </div>
  );
}
