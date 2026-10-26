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
  { to: "/dashboard", label: "Dashboard" },
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

export type SystemNotification = {
  id: string;
  pengajuan: string;
  title: string;
  note: string;
  badge: "Perlu Tindakan" | "Penting" | "Info";
  badgeTone: string;
  time: string;
};

const notificationBadgeTone: Record<SystemNotification["badge"], string> = {
  "Perlu Tindakan": "bg-error-100 text-error-700",
  Penting: "bg-warning-100 text-warning-700",
  Info: "bg-info-100 text-info-700",
};

export const systemNotifications: SystemNotification[] = (
  [
    {
      id: "NTF-012",
      pengajuan: "2011642ED12320260605000003",
      title: "Pengajuan BC 2.3 membutuhkan perbaikan data barang.",
      badge: "Perlu Tindakan",
      note: "Ada data barang yang belum sesuai hasil validasi sistem dan perlu dilengkapi sebelum diproses lanjut.",
      time: "06-06-2026, 10:42",
    },
    {
      id: "NTF-011",
      pengajuan: "2012342ED12320260606000001",
      title: "Dokumen persetujuan BC 2.0 telah diterbitkan.",
      badge: "Info",
      note: "Sistem sudah menghasilkan dokumen final yang dapat diunduh oleh pengguna terkait.",
      time: "06-06-2026, 09:58",
    },
    {
      id: "NTF-010",
      pengajuan: "2010142ED12320260606000001",
      title: "Validasi sistem BC 2.3 berhasil dilakukan.",
      badge: "Penting",
      note: "Seluruh data dasar berhasil dibaca dan siap masuk ke tahap pemeriksaan berikutnya.",
      time: "06-06-2026, 09:21",
    },
    {
      id: "NTF-009",
      pengajuan: "2010142ED12320260606000001",
      title: "Pengajuan BC 2.3 masuk tahap Review Bea Cukai.",
      badge: "Info",
      note: "Pengajuan sedang diperiksa petugas. Pantau progres untuk melihat respon instansi terbaru.",
      time: "06-06-2026, 09:05",
    },
    {
      id: "NTF-008",
      pengajuan: "2011642ED12320260605000005",
      title: "Pengajuan BC 2.0 ditolak oleh instansi.",
      badge: "Perlu Tindakan",
      note: "Alasan penolakan sudah tersedia. Periksa catatan instansi sebelum membuat pengajuan baru.",
      time: "05-06-2026, 16:10",
    },
    {
      id: "NTF-007",
      pengajuan: "2011642ED12320260605000004",
      title: "Dokumen persetujuan BC 2.16 telah diterbitkan.",
      badge: "Info",
      note: "Dokumen final sudah tersedia dan dapat diunduh dari halaman progres pengajuan.",
      time: "05-06-2026, 13:30",
    },
    {
      id: "NTF-006",
      pengajuan: "2011642ED12320260605000004",
      title: "Pembayaran PNBP BC 2.16 terkonfirmasi.",
      badge: "Penting",
      note: "Bukti bayar sudah tervalidasi dan pengajuan diteruskan ke tahap penerbitan dokumen.",
      time: "05-06-2026, 12:02",
    },
    {
      id: "NTF-005",
      pengajuan: "2011642ED12320260605000003",
      title: "Pengajuan BC 2.3 ditolak dan dapat diperbaiki.",
      badge: "Perlu Tindakan",
      note: "Instansi meminta perbaikan dokumen pendukung. Pengajuan dapat diedit dan dikirim ulang.",
      time: "04-06-2026, 18:20",
    },
    {
      id: "NTF-004",
      pengajuan: "2011642ED12320260605000003",
      title: "Pengajuan BC 2.3 berhasil dikirim.",
      badge: "Info",
      note: "Pengajuan sudah diterima sistem dan menunggu validasi otomatis.",
      time: "04-06-2026, 17:05",
    },
    {
      id: "NTF-003",
      pengajuan: "2012342ED12320260606000001",
      title: "Hasil pemeriksaan BC 2.0 sesuai.",
      badge: "Penting",
      note: "Tidak ditemukan selisih antara dokumen dan hasil pemeriksaan fisik barang.",
      time: "03-06-2026, 14:47",
    },
    {
      id: "NTF-002",
      pengajuan: "2011642ED12320260605000005",
      title: "Lampiran invoice BC 2.0 tidak terbaca.",
      badge: "Perlu Tindakan",
      note: "File lampiran terdeteksi rusak atau terlalu buram. Unggah ulang lampiran dengan kualitas lebih baik.",
      time: "03-06-2026, 10:15",
    },
    {
      id: "NTF-001",
      pengajuan: "2011642ED12320260605000004",
      title: "Pengajuan BC 2.16 berhasil dikirim.",
      badge: "Info",
      note: "Pengajuan sudah diterima sistem dan menunggu validasi otomatis.",
      time: "02-06-2026, 08:30",
    },
  ] as Array<Omit<SystemNotification, "badgeTone">>
).map((item) => ({ ...item, badgeTone: notificationBadgeTone[item.badge] }));

export type SystemAnnouncement = {
  id: string;
  title: string;
  category: string;
  categoryTone: string;
  date: string;
  note: string;
  content: string[];
};

export const systemAnnouncements: SystemAnnouncement[] = [
  {
    id: "ANN-009",
    title: "Pemeliharaan sistem terjadwal",
    category: "Jadwal",
    categoryTone: "bg-brand-primary-100 text-brand-primary-700",
    date: "08 Jul 2026",
    note: "Akses layanan akan dibatasi sementara selama proses pemeliharaan rutin berlangsung.",
    content: [
      "Dalam rangka peningkatan kualitas layanan, akan dilakukan pemeliharaan sistem rutin pada Sabtu, 11 Juli 2026 pukul 22.00 – 02.00 WIB.",
      "Selama periode tersebut, pembuatan dan pengiriman pengajuan baru tidak dapat dilakukan. Pengajuan yang sudah terkirim tetap diproses setelah pemeliharaan selesai.",
      "Mohon menyelesaikan pengiriman pengajuan sebelum jadwal pemeliharaan untuk menghindari keterlambatan.",
    ],
  },
  {
    id: "ANN-008",
    title: "Perubahan format template dokumen",
    category: "Template",
    categoryTone: "bg-info-100 text-info-700",
    date: "10 Jul 2026",
    note: "Template pengajuan dan lampiran barang mendapat penyesuaian untuk menyamakan struktur data.",
    content: [
      "Template pengajuan dan lampiran data barang diperbarui untuk menyamakan struktur data antar jenis dokumen.",
      "Perubahan utama meliputi penambahan kolom kode HS 10 digit, satuan barang terstandar, dan negara asal dalam format kode ISO.",
      "Template lama masih dapat digunakan hingga 31 Juli 2026. Silakan unduh template terbaru pada bagian Panduan Penggunaan.",
    ],
  },
  {
    id: "ANN-007",
    title: "Informasi integrasi layanan INSW",
    category: "Integrasi",
    categoryTone: "bg-success-100 text-success-700",
    date: "12 Jul 2026",
    note: "Sinkronisasi antar layanan dan validasi sumber data dilakukan secara bertahap.",
    content: [
      "Integrasi layanan dengan sistem INSW dilakukan secara bertahap untuk memastikan konsistensi data antar instansi.",
      "Selama proses sinkronisasi, status pengajuan mungkin membutuhkan waktu lebih lama untuk diperbarui. Data tidak akan hilang.",
    ],
  },
  {
    id: "ANN-006",
    title: "Fitur ekstraksi dokumen otomatis tersedia",
    category: "Fitur Baru",
    categoryTone: "bg-brand-secondary-100 text-brand-secondary-700",
    date: "01 Jul 2026",
    note: "Pengguna dapat mengunggah dokumen pendukung dan sistem akan mengisi form secara otomatis.",
    content: [
      "Fitur Smart Submission kini dapat membaca invoice, packing list, dan bill of lading untuk mengisi form pengajuan secara otomatis.",
      "Hasil ekstraksi tetap perlu ditinjau sebelum pengajuan dikirim. Kolom dengan tingkat keyakinan rendah akan ditandai untuk diperiksa.",
    ],
  },
  {
    id: "ANN-005",
    title: "Penyesuaian jam layanan helpdesk",
    category: "Layanan",
    categoryTone: "bg-neutral-100 text-neutral-700",
    date: "25 Jun 2026",
    note: "Helpdesk kini melayani hingga pukul 21.00 WIB pada hari kerja.",
    content: [
      "Mulai 1 Juli 2026, layanan helpdesk tersedia Senin – Jumat pukul 07.00 – 21.00 WIB dan Sabtu pukul 08.00 – 14.00 WIB.",
      "Pengaduan di luar jam layanan tetap dapat dikirim melalui formulir masukan dan akan ditindaklanjuti pada hari kerja berikutnya.",
    ],
  },
  {
    id: "ANN-004",
    title: "Pembaruan referensi kode HS",
    category: "Template",
    categoryTone: "bg-info-100 text-info-700",
    date: "20 Jun 2026",
    note: "Referensi kode HS diperbarui mengikuti BTKI terbaru.",
    content: [
      "Referensi kode HS pada form pengajuan diperbarui mengikuti Buku Tarif Kepabeanan Indonesia (BTKI) terbaru.",
      "Pengajuan draft yang menggunakan kode HS lama akan diberi tanda peringatan dan perlu disesuaikan sebelum dikirim.",
    ],
  },
  {
    id: "ANN-003",
    title: "Pemeliharaan server penyimpanan dokumen",
    category: "Jadwal",
    categoryTone: "bg-brand-primary-100 text-brand-primary-700",
    date: "14 Jun 2026",
    note: "Unduh dokumen persetujuan tidak tersedia sementara selama 2 jam.",
    content: [
      "Pada Minggu, 14 Juni 2026 pukul 01.00 – 03.00 WIB dilakukan pemeliharaan server penyimpanan dokumen.",
      "Selama periode tersebut, dokumen persetujuan tidak dapat diunduh. Fitur lainnya tetap berjalan normal.",
    ],
  },
  {
    id: "ANN-002",
    title: "Login wajib menggunakan SSO",
    category: "Integrasi",
    categoryTone: "bg-success-100 text-success-700",
    date: "05 Jun 2026",
    note: "Seluruh pengguna wajib masuk menggunakan akun SSO yang terdaftar.",
    content: [
      "Mulai 5 Juni 2026, login dengan username dan password lokal tidak lagi tersedia. Seluruh pengguna wajib masuk menggunakan akun SSO.",
      "Pastikan akun SSO sudah terhubung dengan entitas perusahaan agar data pengajuan dapat diakses.",
    ],
  },
  {
    id: "ANN-001",
    title: "Peluncuran Smart Form LNSW",
    category: "Fitur Baru",
    categoryTone: "bg-brand-secondary-100 text-brand-secondary-700",
    date: "01 Jun 2026",
    note: "Smart Form resmi digunakan untuk pengajuan dokumen kepabeanan.",
    content: [
      "Smart Form LNSW resmi digunakan sebagai kanal pengajuan dokumen kepabeanan mulai 1 Juni 2026.",
      "Panduan penggunaan dan contoh dokumen tersedia di dashboard untuk membantu proses transisi.",
    ],
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
