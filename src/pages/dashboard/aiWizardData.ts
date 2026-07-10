import { ASSISTED_WIZARD_TREE } from "./aiWizardTree";

export type WizardStep = "identifikasi" | "dokumen" | "parsing";
export type NeedChoice = "pemasukan" | "pengeluaran" | "lainnya";
export type DetailChoice =
  | "impor_barang"
  | "pemasukan_kek"
  | "lainnya_pemasukan"
  | "ekspor_barang"
  | "pengeluaran_kek"
  | "lainnya_pengeluaran"
  | "barang_masuk"
  | "barang_keluar"
  | "kawasan_ekonomi_khusus";

export type AiDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  ringkasanKebutuhan: string;
  rekomendasiSistem: string;
  dokumenPendukung: string[];
};

export type AiSubmissionDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  keterangan: string;
  dokumen: string[];
};

export type ActivityChoice = "barang_masuk" | "barang_keluar" | "kek" | "tidak_yakin";
export type QuestionId = "triage" | "tujuan" | "pelaku" | "lokasi_kek" | "izin_khusus" | "dokumen";
export type FlowOption = { key: string; label: string; description?: string };
export type FlowQuestion = {
  id: QuestionId;
  prompt: string;
  options: FlowOption[];
  multi?: boolean;
};
export type ConversationMessage = { role: "assistant" | "user"; text: string };
export type WizardAnalysis = {
  rekomendasi: string;
  jenisPengajuan: string;
  dokumenWajib: string[];
  ringkasan: string;
};

export const STEP_LABELS: Array<{ key: WizardStep; label: string; icon: string }> = [
  { key: "identifikasi", label: "Identifikasi", icon: "1" },
  { key: "dokumen", label: "Upload Data Barang", icon: "2" },
  { key: "parsing", label: "Data Parsing", icon: "3" },
];

export const INITIAL_PROMPT = "Halo! Saya Smart Submission Assistant INSW. Untuk memulai, apa yang ingin Anda lakukan?";

export const NEED_OPTIONS: Array<{ key: NeedChoice; title: string; description: string }> = [
  { key: "pemasukan", title: "Pemasukan", description: "Pengajuan terkait pemasukan barang, dana, atau lainnya ke dalam wilayah Indonesia." },
  { key: "pengeluaran", title: "Pengeluaran", description: "Pengajuan terkait pengeluaran barang, dana, atau lainnya dari wilayah Indonesia." },
  { key: "lainnya", title: "Lainnya / Tidak Yakin", description: "Saya tidak yakin atau ingin dibantu menentukan jenis pengajuan." },
];

export const RESPONSE_OPTIONS: Record<NeedChoice, Array<{ key: DetailChoice; title: string }>> = {
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

export const ACTIVITY_OPTIONS: Array<{ key: ActivityChoice; title: string; description: string }> = [
  { key: "barang_masuk", title: "Barang Masuk Indonesia", description: "Aktivitas terkait pemasukan barang ke wilayah Indonesia." },
  { key: "barang_keluar", title: "Barang Keluar Indonesia", description: "Aktivitas terkait pengeluaran barang dari wilayah Indonesia." },
  { key: "kek", title: "Kawasan Ekonomi Khusus (KEK)", description: "Aktivitas yang berada di kawasan ekonomi khusus." },
  { key: "tidak_yakin", title: "Saya Tidak Yakin", description: "Saya belum yakin dan butuh bantuan identifikasi jenis pengajuan." },
];

export const TRIAGE_QUESTION = ASSISTED_WIZARD_TREE.triage;
export const FLOW_QUESTIONS = ASSISTED_WIZARD_TREE.branches;

export const REQUIRED_DOCUMENTS: Record<Exclude<ActivityChoice, "tidak_yakin">, string[]> = {
  barang_masuk: ["Invoice", "Packing List", "Bill of Lading"],
  barang_keluar: ["Invoice", "Packing List", "Bill of Lading"],
  kek: ["Invoice", "Packing List", "Bill of Lading"],
};

export const ANALYSIS_CHECKLIST = [
  "Mengidentifikasi aktivitas",
  "Mengidentifikasi jenis pelaku usaha",
  "Mencocokkan regulasi",
  "Menentukan dokumen yang diperlukan",
  "Menyiapkan proses parsing",
];

export function getActivityLabel(choice: ActivityChoice | null) {
  if (choice === "barang_masuk") return "Barang Masuk Indonesia";
  if (choice === "barang_keluar") return "Barang Keluar Indonesia";
  if (choice === "kek") return "Kawasan Ekonomi Khusus (KEK)";
  return "Saya Tidak Yakin";
}

export function getBranchChoice(choice?: string | null) {
  if (choice === "barang_masuk" || choice === "barang_keluar" || choice === "kek") return choice;
  return null;
}

export function getBranchTitle(activity: Exclude<ActivityChoice, "tidak_yakin">) {
  if (activity === "barang_masuk") return "Pengajuan Barang Masuk / Impor";
  if (activity === "barang_keluar") return "Pengajuan Barang Keluar / Ekspor";
  return "Pengajuan KEK";
}

export function getQuestionFlow(activity: Exclude<ActivityChoice, "tidak_yakin">) {
  return FLOW_QUESTIONS[activity];
}

export function getAnswerLabel(question: FlowQuestion, value: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((entry) => question.options.find((option) => option.key === entry)?.label ?? entry).join(", ");
  }
  return question.options.find((option) => option.key === value)?.label ?? value;
}

export function getAnalysisResult(activity: Exclude<ActivityChoice, "tidak_yakin">, answers: Record<string, string | string[]>) {
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

export function buildAiDraftFromAnalysis(
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

export function toSubmissionDraft(draft: AiDraft): AiSubmissionDraft {
  return {
    jenisPengajuan: draft.jenisPengajuan,
    namaPerusahaan: draft.namaPerusahaan,
    npwp: draft.npwp,
    nib: draft.nib,
    keterangan: draft.ringkasanKebutuhan,
    dokumen: draft.dokumenPendukung,
  };
}
