export type AssistedWizardBranch = "barang_masuk" | "barang_keluar" | "kek";

export type WizardOption = {
  key: string;
  label: string;
  description?: string;
};

export type FlowQuestionId = "triage" | "tujuan" | "pelaku" | "lokasi_kek" | "izin_khusus" | "dokumen";

export type FlowQuestion = {
  id: FlowQuestionId;
  prompt: string;
  options: WizardOption[];
  multi?: boolean;
};

export type AssistedWizardTree = {
  triage: FlowQuestion;
  branches: Record<AssistedWizardBranch, FlowQuestion[]>;
};

export const ASSISTED_WIZARD_TREE: AssistedWizardTree = {
  triage: {
    id: "triage",
    prompt: "Baik, saya bantu identifikasi. Apakah aktivitas Anda lebih berkaitan dengan barang masuk, barang keluar, atau kawasan khusus?",
    options: [
      { key: "barang_masuk", label: "Barang Masuk" },
      { key: "barang_keluar", label: "Barang Keluar" },
      { key: "kek", label: "Kawasan Ekonomi Khusus" },
    ],
  },
  branches: {
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
  },
};
