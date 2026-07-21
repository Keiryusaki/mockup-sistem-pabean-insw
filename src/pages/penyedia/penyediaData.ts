export type TradeKind = "Ekspor" | "Impor" | "KEK";
export type PenyediaStatus = "Proses" | "Selesai" | "Perlu Perhatian";
export type AiFlagTone = "green" | "yellow";

export type AiFlag = {
  id: string;
  label: string;
  tone: AiFlagTone;
};

export type AttentionIndicator = {
  id: string;
  label: string;
  count?: number;
  tone: AiFlagTone;
};

export type QualityScore = {
  completeness: string;
  consistency: string;
  hsValidation: string;
  supportingDocs: string;
};

export type CountryNode = {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  total: number;
  topHsCode: string;
  topDocument: string;
  statusBreakdown: { selesai: number; proses: number; perluPerhatian: number };
  aiInsights: string[];
  attention: AttentionIndicator[];
  quality: QualityScore;
};

export type PenyediaProposal = {
  pengajuan: string;
  dokumen: string;
  kind: TradeKind;
  countryCode: string;
  countryName: string;
  kirim: string;
  perusahaan: string;
  status: PenyediaStatus;
  progressLabel?: string;
  hsCode: string;
  flags: AiFlag[];
  aiSummary: string;
  findings: string[];
  documentsToCheck: string[];
  analysisNotes: string;
};

export const monitoringSummary = [
  {
    id: "total",
    label: "Total Pengajuan",
    value: "248",
    hint: "Seluruh pengajuan terpantau",
    tone: "border-brand-primary-100 bg-brand-primary-50/60 text-brand-primary-800",
  },
  {
    id: "proses",
    label: "Sedang Diproses",
    value: "94",
    hint: "Menunggu respon / review",
    tone: "border-warning-100 bg-warning-50/70 text-warning-800",
  },
  {
    id: "selesai",
    label: "Selesai",
    value: "129",
    hint: "Sudah terselesaikan",
    tone: "border-success-100 bg-success-50/70 text-success-800",
  },
  {
    id: "perhatian",
    label: "Perlu Perhatian",
    value: "25",
    hint: "Kelengkapan / konsistensi data",
    tone: "border-error-100 bg-error-50/70 text-error-800",
  },
] as const;

export const countryNodes: CountryNode[] = [
  {
    id: "cn",
    name: "China",
    code: "CN",
    lat: 35.8,
    lon: 104.2,
    total: 86,
    topHsCode: "8471 - Mesin pengolah data otomatis",
    topDocument: "BC 2.0",
    statusBreakdown: { selesai: 48, proses: 28, perluPerhatian: 10 },
    aiInsights: [
      "HS Code 8471 mendominasi pengajuan dari China.",
      "Mayoritas pengajuan selesai kurang dari 2 hari.",
      "Belum ditemukan pola anomali yang signifikan.",
      "Sebagian kecil pengajuan masih memerlukan pengecekan dokumen pendukung.",
    ],
    attention: [
      { id: "cn-a1", label: "COO belum tersedia", count: 8, tone: "yellow" },
      { id: "cn-a2", label: "Invoice belum sinkron", count: 3, tone: "yellow" },
      { id: "cn-a3", label: "Packing List belum tersedia", count: 2, tone: "yellow" },
      { id: "cn-a4", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
    ],
    quality: {
      completeness: "92%",
      consistency: "95%",
      hsValidation: "Sesuai",
      supportingDocs: "Perlu pengecekan",
    },
  },
  {
    id: "sg",
    name: "Singapura",
    code: "SG",
    lat: 1.35,
    lon: 103.82,
    total: 54,
    topHsCode: "2709 - Minyak mentah",
    topDocument: "BC 2.3",
    statusBreakdown: { selesai: 31, proses: 18, perluPerhatian: 5 },
    aiInsights: [
      "Volume pengajuan Singapura relatif stabil minggu ini.",
      "Mayoritas pengajuan selesai dengan kelengkapan dokumen yang baik.",
      "Sebagian kecil masih memerlukan pengecekan manual karena kelengkapan belum konsisten.",
    ],
    attention: [
      { id: "sg-a1", label: "Dokumen pendukung belum lengkap", count: 5, tone: "yellow" },
      { id: "sg-a2", label: "Lartas tidak diperlukan", tone: "green" },
      { id: "sg-a3", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
    ],
    quality: {
      completeness: "96%",
      consistency: "97%",
      hsValidation: "Sesuai",
      supportingDocs: "Baik",
    },
  },
  {
    id: "jp",
    name: "Jepang",
    code: "JP",
    lat: 36.2,
    lon: 138.25,
    total: 41,
    topHsCode: "8708 - Suku cadang kendaraan",
    topDocument: "BC 2.0",
    statusBreakdown: { selesai: 22, proses: 14, perluPerhatian: 5 },
    aiInsights: [
      "HS 8708 sering muncul pada rute Jepang.",
      "Beberapa pengajuan masih menunggu respon instansi.",
      "Belum ditemukan pola anomali yang menonjol.",
    ],
    attention: [
      { id: "jp-a1", label: "Perlu pengecekan reviewer", count: 5, tone: "yellow" },
      { id: "jp-a2", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
    ],
    quality: {
      completeness: "94%",
      consistency: "93%",
      hsValidation: "Sesuai",
      supportingDocs: "Perlu pengecekan",
    },
  },
  {
    id: "us",
    name: "Amerika Serikat",
    code: "US",
    lat: 39.8,
    lon: -98.5,
    total: 33,
    topHsCode: "0901 - Kopi",
    topDocument: "BC 2.7",
    statusBreakdown: { selesai: 16, proses: 12, perluPerhatian: 5 },
    aiInsights: [
      "Komoditas pertanian mendominasi rute AS.",
      "Sebagian pengajuan memerlukan pengecekan dokumen karantina.",
      "Mayoritas proses berjalan sesuai pola historis.",
    ],
    attention: [
      { id: "us-a1", label: "Dokumen pendukung belum lengkap", count: 4, tone: "yellow" },
      { id: "us-a2", label: "COO belum tersedia", count: 2, tone: "yellow" },
      { id: "us-a3", label: "Lartas tidak diperlukan", tone: "green" },
    ],
    quality: {
      completeness: "89%",
      consistency: "91%",
      hsValidation: "Sesuai",
      supportingDocs: "Perlu pengecekan",
    },
  },
  {
    id: "nl",
    name: "Belanda",
    code: "NL",
    lat: 52.1,
    lon: 5.3,
    total: 22,
    topHsCode: "1511 - Minyak kelapa sawit",
    topDocument: "BC 2.3",
    statusBreakdown: { selesai: 14, proses: 6, perluPerhatian: 2 },
    aiInsights: [
      "Rute Eropa relatif rapi dan konsisten.",
      "Mayoritas pengajuan selesai tanpa temuan kelengkapan.",
      "Belum ditemukan pola anomali yang signifikan.",
    ],
    attention: [
      { id: "nl-a1", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
      { id: "nl-a2", label: "Lartas tidak diperlukan", tone: "green" },
      { id: "nl-a3", label: "Packing List belum tersedia", count: 1, tone: "yellow" },
    ],
    quality: {
      completeness: "97%",
      consistency: "98%",
      hsValidation: "Sesuai",
      supportingDocs: "Baik",
    },
  },
  {
    id: "au",
    name: "Australia",
    code: "AU",
    lat: -25.3,
    lon: 133.8,
    total: 29,
    topHsCode: "2601 - Bijih besi",
    topDocument: "BC 2.16",
    statusBreakdown: { selesai: 12, proses: 12, perluPerhatian: 5 },
    aiInsights: [
      "Terdapat beberapa ketidaksesuaian berat pada lampiran packing list.",
      "Sebagian pengajuan masih memerlukan pengecekan reviewer.",
      "Pola volume mingguan relatif stabil.",
    ],
    attention: [
      { id: "au-a1", label: "Ada ketidaksesuaian data", count: 4, tone: "yellow" },
      { id: "au-a2", label: "Perlu pengecekan reviewer", count: 5, tone: "yellow" },
      { id: "au-a3", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
    ],
    quality: {
      completeness: "88%",
      consistency: "86%",
      hsValidation: "Sesuai",
      supportingDocs: "Perlu pengecekan",
    },
  },
  {
    id: "my",
    name: "Malaysia",
    code: "MY",
    lat: 4.2,
    lon: 101.9,
    total: 18,
    topHsCode: "8471 - Mesin",
    topDocument: "BC 2.0",
    statusBreakdown: { selesai: 9, proses: 7, perluPerhatian: 2 },
    aiInsights: [
      "Volume ASEAN meningkat moderat.",
      "Dokumen umumnya lengkap; 2 pengajuan masih perlu dilengkapi.",
      "Belum ditemukan pola anomali yang signifikan.",
    ],
    attention: [
      { id: "my-a1", label: "Dokumen pendukung belum lengkap", count: 2, tone: "yellow" },
      { id: "my-a2", label: "Tidak ditemukan indikasi duplikasi", tone: "green" },
      { id: "my-a3", label: "Lartas tidak diperlukan", tone: "green" },
    ],
    quality: {
      completeness: "95%",
      consistency: "96%",
      hsValidation: "Sesuai",
      supportingDocs: "Baik",
    },
  },
];

export const penyediaProposals: PenyediaProposal[] = [
  {
    pengajuan: "2012342ED12320260606000001",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "CN",
    countryName: "China",
    kirim: "06-06-2026, 08:14",
    perusahaan: "PERWIRA MULIA SEMESTA",
    status: "Selesai",
    hsCode: "8471.30",
    flags: [{ id: "f1", label: "Lengkap", tone: "green" }],
    aiSummary: "Dokumen pengajuan dari China terlihat lengkap dan konsisten dengan pola historis HS 8471.",
    findings: ["Uraian barang selaras dengan HS Code.", "Lampiran utama tersedia."],
    documentsToCheck: ["Invoice", "Packing List"],
    analysisNotes: "Tidak ada indikasi kelengkapan yang kurang. Informasi ini bersifat monitoring.",
  },
  {
    pengajuan: "2010142ED12320260606000001",
    dokumen: "BC 2.3",
    kind: "Ekspor",
    countryCode: "SG",
    countryName: "Singapura",
    kirim: "06-06-2026, 09:03",
    perusahaan: "MITRA EKSPOR INDONESIA",
    status: "Proses",
    progressLabel: "Sedang diproses",
    hsCode: "2709.00",
    flags: [{ id: "f2", label: "COO belum tersedia", tone: "yellow" }],
    aiSummary: "Pengajuan rute Singapura masih diproses. AI menandai dokumen COO belum terlampir.",
    findings: ["COO belum tersedia pada lampiran.", "Status proses masih aktif."],
    documentsToCheck: ["COO", "Bill of Lading"],
    analysisNotes: "Flag ini hanya membantu reviewer meninjau kelengkapan, bukan keputusan.",
  },
  {
    pengajuan: "2011642ED12320260605000005",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "JP",
    countryName: "Jepang",
    kirim: "05-06-2026, 15:22",
    perusahaan: "DASINDO",
    status: "Perlu Perhatian",
    hsCode: "8708.99",
    flags: [
      { id: "f3", label: "Ada ketidaksesuaian data", tone: "yellow" },
      { id: "f4", label: "Perlu pengecekan reviewer", tone: "yellow" },
    ],
    aiSummary: "Terdapat ketidaksesuaian uraian barang dan spesifikasi pada lampiran. Perlu pengecekan reviewer.",
    findings: ["Uraian barang dan spesifikasi belum selaras.", "Beberapa field pendukung perlu ditinjau ulang."],
    documentsToCheck: ["Invoice", "Spesifikasi Barang"],
    analysisNotes: "AI hanya menandai area yang perlu diperhatikan. Keputusan tetap pada petugas/instansi berwenang.",
  },
  {
    pengajuan: "2013342ED12320260607000011",
    dokumen: "BC 2.7",
    kind: "Ekspor",
    countryCode: "US",
    countryName: "Amerika Serikat",
    kirim: "07-06-2026, 10:21",
    perusahaan: "NUSANTARA LOGISTIK",
    status: "Proses",
    progressLabel: "Menunggu respon",
    hsCode: "0901.21",
    flags: [{ id: "f5", label: "Dokumen pendukung belum lengkap", tone: "yellow" }],
    aiSummary: "Komoditas pertanian menuju AS. Beberapa dokumen pendukung masih perlu dilengkapi.",
    findings: ["Dokumen pendukung belum lengkap.", "Proses masih menunggu respon."],
    documentsToCheck: ["Dokumen karantina", "Certificate of Origin"],
    analysisNotes: "Gunakan flag untuk navigasi review manual lebih cepat.",
  },
  {
    pengajuan: "2013342ED12320260607000012",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "MY",
    countryName: "Malaysia",
    kirim: "07-06-2026, 13:40",
    perusahaan: "GARUDA TRADING HOUSE",
    status: "Proses",
    progressLabel: "Sedang diproses",
    hsCode: "8471.30",
    flags: [{ id: "f6", label: "Lengkap", tone: "green" }],
    aiSummary: "Pengajuan ASEAN dengan kelengkapan dokumen yang baik pada tahap monitoring saat ini.",
    findings: ["Kelengkapan dokumen terlihat memadai."],
    documentsToCheck: ["Invoice"],
    analysisNotes: "Tetap pantau status proses hingga selesai.",
  },
  {
    pengajuan: "2013342ED12320260608000021",
    dokumen: "BC 2.3",
    kind: "Ekspor",
    countryCode: "NL",
    countryName: "Belanda",
    kirim: "08-06-2026, 09:12",
    perusahaan: "BAHARI PRIMA JAYA",
    status: "Selesai",
    hsCode: "1511.10",
    flags: [{ id: "f7", label: "Lengkap", tone: "green" }],
    aiSummary: "Rute Belanda selesai dengan catatan kelengkapan yang konsisten.",
    findings: ["Tidak ada temuan kelengkapan utama."],
    documentsToCheck: ["Packing List"],
    analysisNotes: "Informasi analisis hanya untuk arsip monitoring.",
  },
  {
    pengajuan: "2013342ED12320260608000022",
    dokumen: "BC 2.16",
    kind: "Impor",
    countryCode: "AU",
    countryName: "Australia",
    kirim: "08-06-2026, 15:55",
    perusahaan: "SAMUDRA KARGO SEJAHTERA",
    status: "Perlu Perhatian",
    hsCode: "2601.11",
    flags: [
      { id: "f8", label: "Ada ketidaksesuaian data", tone: "yellow" },
      { id: "f9", label: "Perlu pengecekan reviewer", tone: "yellow" },
    ],
    aiSummary: "Berat kotor dan nett pada packing list belum selaras. Perlu pengecekan reviewer.",
    findings: ["Ketidaksesuaian data berat pada lampiran.", "Perlu tinjauan manual."],
    documentsToCheck: ["Packing List", "Invoice"],
    analysisNotes: "Flag tidak bersifat keputusan; hanya menandai area pengamatan.",
  },
  {
    pengajuan: "2013342ED12320260609000031",
    dokumen: "BC 2.0",
    kind: "Ekspor",
    countryCode: "JP",
    countryName: "Jepang",
    kirim: "09-06-2026, 08:05",
    perusahaan: "PERWIRA MULIA SEMESTA",
    status: "Proses",
    progressLabel: "Menunggu respon instansi",
    hsCode: "8703.23",
    flags: [{ id: "f10", label: "Lengkap", tone: "green" }],
    aiSummary: "Pengajuan menuju Jepang sedang menunggu respon instansi. Kelengkapan dokumen tampak memadai.",
    findings: ["Status proses aktif.", "Dokumen utama tersedia."],
    documentsToCheck: ["Invoice", "B/L"],
    analysisNotes: "Pantau progres tanpa intervensi keputusan di dashboard ini.",
  },
  {
    pengajuan: "2013342ED12320260609000032",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "CN",
    countryName: "China",
    kirim: "09-06-2026, 11:20",
    perusahaan: "NUSANTARA LOGISTIK",
    status: "Perlu Perhatian",
    hsCode: "8471.50",
    flags: [{ id: "f11", label: "COO belum tersedia", tone: "yellow" }],
    aiSummary: "HS 8471 kembali dominan dari China. COO belum tersedia pada set lampiran terbaru.",
    findings: ["COO belum tersedia.", "Pengajuan masuk kategori perlu perhatian untuk kelengkapan."],
    documentsToCheck: ["COO", "Invoice"],
    analysisNotes: "Gunakan daftar pengajuan untuk menelusuri kasus serupa per negara.",
  },
  {
    pengajuan: "2013342ED12320260610000041",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "CN",
    countryName: "China",
    kirim: "10-06-2026, 09:40",
    perusahaan: "BAHARI PRIMA JAYA",
    status: "Proses",
    progressLabel: "Sedang diproses",
    hsCode: "8471.41",
    flags: [{ id: "f12", label: "Packing List belum tersedia", tone: "yellow" }],
    aiSummary: "Pengajuan tambahan dari China masih dalam proses. Packing List belum terlihat pada lampiran.",
    findings: ["Packing List belum tersedia.", "Proses masih berjalan."],
    documentsToCheck: ["Packing List"],
    analysisNotes: "Indikator ini membantu navigasi monitoring, bukan keputusan.",
  },
  {
    pengajuan: "2013342ED12320260610000042",
    dokumen: "BC 2.3",
    kind: "Ekspor",
    countryCode: "CN",
    countryName: "China",
    kirim: "10-06-2026, 14:05",
    perusahaan: "MITRA EKSPOR INDONESIA",
    status: "Selesai",
    hsCode: "8471.30",
    flags: [{ id: "f13", label: "Lengkap", tone: "green" }],
    aiSummary: "Pengajuan ekspor terkait China selesai dengan kelengkapan dokumen memadai.",
    findings: ["Kelengkapan dokumen memadai."],
    documentsToCheck: ["Invoice"],
    analysisNotes: "Informasi monitoring untuk jejak proses.",
  },
  {
    pengajuan: "2013342ED12320260610000043",
    dokumen: "BC 2.0",
    kind: "Impor",
    countryCode: "CN",
    countryName: "China",
    kirim: "10-06-2026, 16:22",
    perusahaan: "DASINDO",
    status: "Perlu Perhatian",
    hsCode: "8471.49",
    flags: [
      { id: "f14", label: "Invoice belum sinkron", tone: "yellow" },
      { id: "f15", label: "Perlu pengecekan reviewer", tone: "yellow" },
    ],
    aiSummary: "Nilai invoice dan ringkasan transaksi belum sinkron pada pengajuan ini.",
    findings: ["Invoice belum sinkron.", "Perlu tinjauan reviewer."],
    documentsToCheck: ["Invoice", "Ringkasan transaksi"],
    analysisNotes: "AI hanya menandai inkonsistensi untuk diperhatikan petugas.",
  },
];

export function projectCountry(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

export function filterPenyediaProposals(options: {
  countryCode?: string;
  query?: string;
  status?: PenyediaStatus | "Semua";
  kind?: TradeKind | "Semua";
}) {
  const countryCode = options.countryCode;
  const query = options.query?.trim().toLowerCase() ?? "";
  const status = options.status ?? "Semua";
  const kind = options.kind ?? "Semua";

  return penyediaProposals.filter((row) => {
    const matchesCountry = !countryCode || row.countryCode === countryCode;
    const matchesStatus = status === "Semua" || row.status === status;
    const matchesKind = kind === "Semua" || row.kind === kind;
    const matchesQuery =
      !query ||
      `${row.pengajuan} ${row.dokumen} ${row.perusahaan} ${row.countryName} ${row.hsCode} ${row.status}`
        .toLowerCase()
        .includes(query);
    return matchesCountry && matchesStatus && matchesKind && matchesQuery;
  });
}

export function getCountryProposalCount(countryCode: string, kind: TradeKind | "Semua" = "Semua") {
  return filterPenyediaProposals({ countryCode, kind }).length;
}
