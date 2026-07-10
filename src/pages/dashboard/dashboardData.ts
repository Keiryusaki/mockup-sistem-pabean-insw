export type ProposalStatus = "Draft" | "Proses" | "Selesai" | "Ditolak";

export type ProposalRow = {
  pengajuan: string;
  dokumen: string;
  kirim: string;
  kirimAt: string | null;
  perusahaan: string;
  status: ProposalStatus;
  progressLabel?: string;
  canEditAfterReject?: boolean;
};

export const proposalRows: ProposalRow[] = [
  {
    pengajuan: "2012342ED12320260606000001",
    dokumen: "BC 2.0",
    kirim: "06-06-2026, 08:14",
    kirimAt: "2026-06-06T08:14:00",
    perusahaan: "0027681030529000000000 - PERWIRA MULIA SEMESTA",
    status: "Selesai",
  },
  {
    pengajuan: "2010142ED12320260606000001",
    dokumen: "BC 2.3",
    kirim: "06-06-2026, 09:03",
    kirimAt: "2026-06-06T09:03:00",
    perusahaan: "1234567890123456000000 - test",
    status: "Proses",
    progressLabel: "Review Bea Cukai",
  },
  {
    pengajuan: "201202BE4BC020260606000001",
    dokumen: "BC 2.7",
    kirim: "Belum ada pencatatan waktu",
    kirimAt: null,
    perusahaan: "0809692049081000000000 - TEST",
    status: "Draft",
  },
  {
    pengajuan: "2011642ED12320260605000005",
    dokumen: "BC 2.0",
    kirim: "05-06-2026, 15:22",
    kirimAt: "2026-06-05T15:22:00",
    perusahaan: "1234567890123456000000 - Test",
    status: "Ditolak",
    canEditAfterReject: false,
  },
  {
    pengajuan: "2011642ED12320260605000004",
    dokumen: "BC 2.16",
    kirim: "05-06-2026, 11:48",
    kirimAt: "2026-06-05T11:48:00",
    perusahaan: "1234567890123456000000 - DASINDO",
    status: "Selesai",
  },
  {
    pengajuan: "2011642ED12320260605000003",
    dokumen: "BC 2.3",
    kirim: "04-06-2026, 17:05",
    kirimAt: "2026-06-04T17:05:00",
    perusahaan: "1234567890123456000000 - SAMPLE TECH",
    status: "Ditolak",
    canEditAfterReject: true,
  },
];

export const menuItems = [
  { to: "/", label: "Dashboard" },
  { to: "/data", label: "Data Pengajuan" },
];

export const stats = [
  {
    label: "Draft",
    value: "1",
    cardTone: "border-neutral-200 bg-neutral-50/80",
    hoverTone: "hover:border-neutral-300 hover:bg-neutral-100/80",
    textTone: "text-neutral-800",
    badgeTone: "bg-neutral-100 text-neutral-700",
    filter: "Draft",
  },
  {
    label: "Proses",
    value: "1",
    cardTone: "border-warning-100 bg-warning-50/80",
    hoverTone: "hover:border-warning-200 hover:bg-warning-100/80",
    textTone: "text-warning-800",
    badgeTone: "bg-warning-100 text-warning-600",
    filter: "Proses",
  },
  {
    label: "Selesai",
    value: "2",
    cardTone: "border-success-100 bg-success-50/70",
    hoverTone: "hover:border-success-200 hover:bg-success-100/80",
    textTone: "text-success-800",
    badgeTone: "bg-success-100 text-success-700",
    filter: "Selesai",
  },
  {
    label: "Ditolak",
    value: "2",
    cardTone: "border-error-100 bg-error-50/70",
    hoverTone: "hover:border-error-200 hover:bg-error-100/80",
    textTone: "text-error-800",
    badgeTone: "bg-error-100 text-error-700",
    filter: "Ditolak",
  },
];

export const proposalStatusMeta: Record<
  "Semua" | ProposalStatus,
  { label: string; tone: string; activeTone: string; borderTone: string }
> = {
  Semua: {
    label: "Semua",
    tone: "bg-brand-primary-50 text-brand-primary-700",
    activeTone: "bg-brand-primary-800 text-white",
    borderTone: "border-brand-primary-100",
  },
  Draft: {
    label: "Draft",
    tone: "bg-neutral-50 text-neutral-700",
    activeTone: "bg-neutral-700 text-white",
    borderTone: "border-neutral-200",
  },
  Proses: {
    label: "Proses",
    tone: "bg-warning-50 text-warning-700",
    activeTone: "bg-warning-500 text-white",
    borderTone: "border-warning-100",
  },
  Selesai: {
    label: "Selesai",
    tone: "bg-success-50 text-success-700",
    activeTone: "bg-success-600 text-white",
    borderTone: "border-success-100",
  },
  Ditolak: {
    label: "Ditolak",
    tone: "bg-error-100 text-error-600",
    activeTone: "bg-error-600 text-white",
    borderTone: "border-error-100",
  },
};

export const proposalBadgeVariant: Record<ProposalStatus, "secondary" | "warning" | "success" | "error"> = {
  Draft: "secondary",
  Proses: "warning",
  Selesai: "success",
  Ditolak: "error",
};

export const systemNotifications = [
  {
    title: "Pengajuan BC 2.0 membutuhkan perbaikan data barang.",
    badge: "Perlu Tindakan",
    badgeTone: "bg-error-100 text-error-700",
    note: "Ada data barang yang belum sesuai hasil validasi sistem dan perlu dilengkapi sebelum diproses lanjut.",
  },
  {
    title: "Dokumen persetujuan telah diterbitkan.",
    badge: "Info",
    badgeTone: "bg-info-100 text-info-700",
    note: "Sistem sudah menghasilkan dokumen final yang dapat diunduh oleh pengguna terkait.",
  },
  {
    title: "Validasi sistem berhasil dilakukan.",
    badge: "Penting",
    badgeTone: "bg-warning-100 text-warning-700",
    note: "Seluruh data dasar berhasil dibaca dan siap masuk ke tahap pemeriksaan berikutnya.",
  },
];

export const systemAnnouncements = [
  {
    title: "Pemeliharaan sistem terjadwal",
    category: "Jadwal",
    categoryTone: "bg-brand-primary-100 text-brand-primary-700",
    date: "08 Jul 2026",
    note: "Akses layanan akan dibatasi sementara selama proses pemeliharaan rutin berlangsung.",
  },
  {
    title: "Perubahan format template dokumen",
    category: "Template",
    categoryTone: "bg-info-100 text-info-700",
    date: "10 Jul 2026",
    note: "Template pengajuan dan lampiran barang mendapat penyesuaian untuk menyamakan struktur data.",
  },
  {
    title: "Informasi integrasi layanan INSW",
    category: "Integrasi",
    categoryTone: "bg-success-100 text-success-700",
    date: "12 Jul 2026",
    note: "Sinkronisasi antar layanan dan validasi sumber data dilakukan secara bertahap.",
  },
];

export const usageGuides = [
  {
    title: "Panduan Membuat Pengajuan Baru",
    description: "Alur cepat untuk memulai pengajuan dari dashboard hingga form utama.",
    file: "panduan_membuat_pengajuan_baru.pdf",
  },
  {
    title: "Panduan Menggunakan Smart Submission Assistant",
    description: "Penjelasan langkah identifikasi, upload, parsing, dan review data.",
    file: "panduan_smart_submission_assistant.pdf",
  },
  {
    title: "Panduan Import Excel Barang",
    description: "Cara menyiapkan file Excel, upload, dan membaca hasil parsing barang.",
    file: "panduan_import_excel_barang.pdf",
  },
  {
    title: "Panduan Melihat Progress Pengajuan",
    description: "Menjelaskan cara memantau status proses, review, dan dokumen terbit.",
    file: "panduan_progress_pengajuan.pdf",
  },
];

export const pdfExamples = [
  {
    title: "Contoh Surat Pengajuan - Impor",
    file: "contoh_surat_pengajuan_bc20.pdf",
    note: "Referensi format surat pengajuan impor.",
  },
  {
    title: "Contoh Surat Pengajuan - Ekspor",
    file: "contoh_surat_pengajuan_bc20_ekspor.pdf",
    note: "Referensi format surat pengajuan ekspor.",
  },
  {
    title: "Contoh Lampiran - Data Kontainer",
    file: "contoh_lampiran_barang.pdf",
    note: "Referensi lampiran data kontainer.",
  },
  {
    title: "Contoh Dokumen Pendukung",
    file: "contoh_dokumen_pendukung.pdf",
    note: "Contoh file tambahan yang biasanya ikut diunggah.",
  },
];
