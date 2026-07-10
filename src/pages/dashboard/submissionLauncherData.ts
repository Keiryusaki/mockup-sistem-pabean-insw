export type StartChoice = "assistant" | "manual" | "copy" | "upload";

export type ManualDocumentOption = {
  id: string;
  title: string;
  description: string;
};

export type CopyDataItem = {
  key: string;
  title: string;
  description: string;
};

export type CopyDataGroup = CopyDataItem & {
  children: CopyDataItem[];
};

export type CopyProposalRow = {
  nomor: string;
  dokumen: string;
  tanggal: string;
  status: string;
  perusahaan: string;
};

export type UploadFlowContext = {
  source: "manual" | "copy" | "upload";
  documentType?: string;
  copyRow?: CopyProposalRow | null;
  copyGroups?: string[];
};

export function buildUploadNotice(excelFiles: string[], ocrFiles: string[]) {
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

export type UploadStage = "upload" | "validasi";

export type UploadStatus = "empty" | "picked" | "uploaded" | "failed";

export type UploadSlot = {
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

export const OCR_UPLOAD_DEFAULTS = [
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
    id: "bl",
    label: "Bill of Lading (B/L)",
    description: "Dokumen pengangkutan utama yang menunjukkan detail pengiriman dan muatan barang.",
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

export const createUploadSlot = (id: string, label: string, description: string, required: boolean, removable = false): UploadSlot => ({
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

export const createDefaultOcrSlots = () =>
  OCR_UPLOAD_DEFAULTS.map((item) => createUploadSlot(item.id, item.label, item.description, item.required));

export const copyDataTree: CopyDataGroup[] = [
  {
    key: "pengajuan",
    title: "Pengajuan",
    description: "Data inti yang dipakai sebagai dasar pengajuan baru.",
    children: [
      { key: "pengajuan.header", title: "Header", description: "Nomor, kantor, jenis, dan informasi utama pengajuan." },
      { key: "pengajuan.transaksi", title: "Transaksi", description: "Nilai, pembayaran, valuta, dan komponen transaksi." },
      { key: "pengajuan.pengangkutan", title: "Pengangkutan", description: "Sarana angkut, voyage, dan perkiraan kedatangan." },
      { key: "pengajuan.pelabuhan", title: "Pelabuhan", description: "Pelabuhan muat, transit, tujuan, dan tempat timbun." },
    ],
  },
  {
    key: "entitas",
    title: "Entitas",
    description: "Data pelaku usaha yang terlibat dalam pengajuan.",
    children: [
      { key: "entitas.pengusaha", title: "Pengusaha", description: "Identitas pengaju utama dan data perusahaan." },
      { key: "entitas.ppjk", title: "PPJK", description: "Data perantara kepabeanan bila digunakan." },
      { key: "entitas.penerima", title: "Penerima", description: "Data pihak penerima barang atau shipment." },
      { key: "entitas.pembeli", title: "Pembeli", description: "Data pihak pembeli jika berbeda dari penerima." },
      { key: "entitas.penanggungJawab", title: "Penanggung Jawab", description: "Kontak dan identitas penanggung jawab pengajuan." },
      { key: "entitas.barangEksporLcl", title: "Barang Ekspor LCL", description: "Data konsolidasi atau LCL bila relevan." },
    ],
  },
  {
    key: "dokumen",
    title: "Dokumen",
    description: "Lampiran yang menyertai pengajuan.",
    children: [{ key: "dokumen.lampiran", title: "Dokumen Lampiran", description: "Daftar dokumen wajib dan lampiran tambahan." }],
  },
  {
    key: "kemasanKontainer",
    title: "Kemasan & Kontainer",
    description: "Detail data kemasan dan kontainer pengiriman.",
    children: [
      { key: "kemasanKontainer.kemasan", title: "Kemasan", description: "Jenis kemasan dan informasi pendukungnya." },
      { key: "kemasanKontainer.kontainer", title: "Kontainer", description: "Nomor, ukuran, jenis muatan, dan tipe kontainer." },
    ],
  },
  {
    key: "barang",
    title: "Barang",
    description: "Detail barang beserta turunan datanya.",
    children: [
      { key: "barang.data", title: "Barang", description: "Data utama barang per seri." },
      { key: "barang.spesifikasi", title: "Spesifikasi", description: "Spesifikasi tambahan per seri barang." },
      { key: "barang.dokumen", title: "Dokumen Barang", description: "Dokumen yang terhubung ke seri barang." },
      { key: "barang.vd", title: "Barang VD", description: "Data barang VD untuk seri terkait." },
      { key: "barang.tarif", title: "Barang Tarif", description: "Pungutan, tarif, dan fasilitas tarif." },
      { key: "barang.karantina", title: "Karantina", description: "Data karantina yang terhubung ke seri barang." },
    ],
  },
];

export const copyDataGroupLookup = new Map(copyDataTree.map((group) => [group.key, group]));
export const copyDataLeafLookup = new Map(copyDataTree.flatMap((group) => group.children.map((child) => [child.key, child] as const)));
export const copyDataLeafKeys = copyDataTree.flatMap((group) => group.children.map((child) => child.key));

export const MANUAL_DOCUMENT_OPTIONS: ManualDocumentOption[] = [
  { id: "bc20", title: "BC 2.0 - PIB Impor", description: "Dokumen impor untuk barang masuk ke wilayah Indonesia." },
  { id: "bc23", title: "BC 2.3 - PIB Ekspor", description: "Dokumen ekspor untuk pengeluaran barang dari wilayah Indonesia." },
  { id: "bc27", title: "BC 2.7 - PEB", description: "Dokumen PEB untuk pengeluaran barang ekspor." },
  { id: "bc216", title: "BC 2.16", description: "Skema pengajuan khusus sesuai kebutuhan proses." },
  { id: "bc30", title: "BC 3.0", description: "Dokumen untuk proses yang memerlukan alur BC 3.0." },
  { id: "lainnya", title: "Lainnya", description: "Pilih jika jenis dokumen belum tercantum." },
];

export const COPY_HISTORY_ROWS: CopyProposalRow[] = [
  { nomor: "10001", dokumen: "BC 2.0 - PIB Impor", tanggal: "20/06/2026", status: "Selesai", perusahaan: "PT Maju Jaya" },
  { nomor: "10002", dokumen: "BC 2.3 - PIB Ekspor", tanggal: "19/06/2026", status: "Proses", perusahaan: "PT Nusantara" },
  { nomor: "10003", dokumen: "BC 2.7 - PEB", tanggal: "18/06/2026", status: "Draft", perusahaan: "PT Sinar Abadi" },
];
