import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, IconButton } from "../components/Button";
import { Checkbox, Input, Select, Textarea } from "../components/FormControls";
import { Modal } from "../components/Surface";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CopyIcon,
  DocumentsIcon,
  EyeIcon,
  HamburgerMenuIcon,
  MagniferIcon,
  PenNewSquareIcon,
  TrashBinTrashIcon,
  TruckIcon,
  UserIcon,
} from "../components/Icons";

type AiSubmissionDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  keterangan: string;
  dokumen: string[];
};

type Row = Record<string, string>;
type WizardStepId = "pengajuan" | "entitas" | "dokumen" | "kemasan" | "barang" | "review";
type FormSource = "assistant" | "manual" | "copy" | "upload";
type MandatoryKey =
  | "nomorPengajuan"
  | "kantorPabean"
  | "jenisPib"
  | "jenisImpor"
  | "caraBayar"
  | "valuta"
  | "ndpbm"
  | "jenisTransaksi"
  | "caraPengangkutan"
  | "namaSaranaAngkut"
  | "perkiraanTanggalTiba"
  | "tempatTimbun";

type FormState = {
  pengajuan: Row;
  entitas: Row[];
  dokumen: Row[];
  kemasan: Row[];
  kontainer: Row[];
  barang: Row[];
  spesifikasi: Row[];
  barangDokumen: Row[];
  barangVd: Row[];
  barangTarif: Row[];
  karantina: Row[];
};

type BarangWorkspaceTab = "data-barang" | "compliance";
type BarangWorkspaceMode = "edit" | "add";
type BarangImportStage = "upload" | "parsing" | "preview";
type BarangSectionRow = { row: Row; index: number };

type StoredFormState = {
  draft: AiSubmissionDraft | null;
  formState: FormState;
};

const AI_DRAFT_STORAGE_KEY = "insw-ai-submission-draft";
const BC20_FORM_STORAGE_KEY = "insw-bc20-form-draft";
const FORM_SOURCE_STORAGE_KEY = "insw-form-source";
const FORM_NOTICE_STORAGE_KEY = "insw-form-notice";

const wizardSteps: Array<{ id: WizardStepId; label: string; description: string }> = [
  { id: "pengajuan", label: "Pengajuan", description: "Header, transaksi, pengangkutan, dan pelabuhan." },
  { id: "entitas", label: "Entitas", description: "Data pelaku usaha dan identitas entitas." },
  { id: "dokumen", label: "Dokumen", description: "Daftar dokumen pengajuan yang dilampirkan." },
  { id: "kemasan", label: "Kemasan & Kontainer", description: "Kemasan dan data kontainer pengiriman." },
  { id: "barang", label: "Barang", description: "Rincian barang, spesifikasi, dan tarif." },
  { id: "review", label: "Review & Submit", description: "Ringkasan akhir sebelum submit." },
];

const sectionTone = "rounded-2xl border border-border-primary bg-white shadow-sm";
const fieldTone =
  "h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100";

const barangMasterColumns = [
  "Seri",
  "HS Code",
  "Kode Barang",
  "Uraian",
  "Merek",
  "Tipe",
  "Negara Asal",
  "Jumlah Satuan",
  "Berat Bersih",
  "Status",
];

const barangInfoFields: EntityFieldConfig[] = [
  { key: "Seri", label: "Seri", placeholder: "1", span: 1 },
  { key: "HS Code", label: "HS Code", placeholder: "8471.30.10", span: 1 },
  { key: "Kode Barang", label: "Kode Barang", placeholder: "BRG-001", span: 1 },
  { key: "Uraian", label: "Uraian", placeholder: "Laptop Lenovo ThinkPad", span: 2 },
  { key: "Merek", label: "Merek", placeholder: "Lenovo", span: 1 },
  { key: "Tipe", label: "Tipe", placeholder: "Notebook", span: 1 },
  { key: "Ukuran", label: "Ukuran", placeholder: "14 Inch", span: 1 },
  { key: "Spesifikasi Lain", label: "Spesifikasi Lain", placeholder: "Core i7, 16GB RAM", span: 2 },
  { key: "Kondisi Barang", label: "Kondisi Barang", placeholder: "Baru", span: 1 },
  {
    key: "Negara Asal",
    label: "Negara Asal",
    type: "select",
    options: [
      { label: "Indonesia", value: "ID" },
      { label: "China", value: "CN" },
      { label: "Singapura", value: "SG" },
      { label: "Malaysia", value: "MY" },
      { label: "Jepang", value: "JP" },
    ],
    span: 1,
  },
  { key: "Berat Bersih", label: "Berat Bersih", placeholder: "950", span: 1 },
  { key: "Kode Satuan", label: "Kode Satuan", placeholder: "PCE", span: 1 },
  { key: "Jumlah Satuan", label: "Jumlah Satuan", placeholder: "10", span: 1 },
  { key: "Kode Kemasan", label: "Kode Kemasan", placeholder: "BOX", span: 1 },
  { key: "Jumlah Kemasan", label: "Jumlah Kemasan", placeholder: "2", span: 1 },
  { key: "Harga Invoice", label: "Harga Invoice", placeholder: "1250000", span: 1 },
];

const barangTocItems = [
  { id: "barang-info", title: "Informasi Barang", description: "Data inti barang per seri." },
  { id: "barang-spesifikasi", title: "Spesifikasi Wajib", description: "Spesifikasi tambahan per seri." },
  { id: "barang-dokumen", title: "Dokumen Barang", description: "Dokumen yang terhubung ke seri barang." },
  { id: "barang-vd", title: "Barang VD", description: "Mock data barang VD." },
  { id: "barang-tarif", title: "Barang Tarif", description: "Pungutan dan tarif per seri." },
];

const complianceTocItems = [
  { id: "compliance-lartas", title: "Lartas" },
  { id: "compliance-coo", title: "COO" },
  { id: "compliance-masterlist", title: "Masterlist" },
  { id: "compliance-tkq", title: "TKQ" },
  { id: "compliance-transportasi", title: "Transportasi" },
  { id: "compliance-karantina", title: "Karantina" },
  { id: "compliance-pendukung", title: "Dokumen Pendukung" },
];

const mandatoryPengajuanFields: MandatoryKey[] = [
  "nomorPengajuan",
  "kantorPabean",
  "jenisPib",
  "jenisImpor",
  "caraBayar",
  "valuta",
  "ndpbm",
  "jenisTransaksi",
  "caraPengangkutan",
  "namaSaranaAngkut",
  "perkiraanTanggalTiba",
  "tempatTimbun",
];

type EntityKind = "importir" | "ppjk" | "penjual" | "pemilikBarang" | "pengangkut";
type EntityFieldType = "input" | "select" | "textarea";
type EntityFieldOption = { label: string; value: string; description?: string };
type EntityFieldConfig = {
  key: string;
  label: string;
  type?: EntityFieldType;
  placeholder?: string;
  options?: EntityFieldOption[];
  span?: 1 | 2 | 3;
  note?: string;
};
type EntityDefinition = {
  kind: EntityKind;
  title: string;
  badge: "Wajib" | "Opsional";
  description: string;
  icon: typeof BuildingsIcon;
  defaultOpen?: boolean;
  fields: EntityFieldConfig[];
  defaultValues: Row;
};

const countryOptions: EntityFieldOption[] = [
  { label: "Indonesia", value: "ID" },
  { label: "Singapura", value: "SG" },
  { label: "Malaysia", value: "MY" },
  { label: "China", value: "CN" },
  { label: "Amerika Serikat", value: "US" },
  { label: "Jepang", value: "JP" },
];

const identityOptions: EntityFieldOption[] = [
  { label: "NPWP", value: "NPWP" },
  { label: "NITKU", value: "NITKU" },
  { label: "KTP", value: "KTP" },
  { label: "Paspor", value: "Paspor" },
];

const apiOptions: EntityFieldOption[] = [
  { label: "API-U", value: "API-U" },
  { label: "API-P", value: "API-P" },
  { label: "Non API", value: "Non API" },
];

const statusOptions: EntityFieldOption[] = [
  { label: "Aktif", value: "Aktif" },
  { label: "Tidak Aktif", value: "Tidak Aktif" },
  { label: "Dalam Proses", value: "Dalam Proses" },
];

const entityDefinitions: EntityDefinition[] = [
  {
    kind: "importir",
    title: "Importir",
    badge: "Wajib",
    description: "Aktor utama yang mewakili pihak pengaju barang masuk.",
    icon: BuildingsIcon,
    defaultOpen: true,
    defaultValues: {
      "Jenis Entitas": "Importir",
      "Jenis Identitas": "NPWP",
      "NITKU / NPWP": "3171010000001",
      "Nama Perusahaan": "PT Contoh Nusantara",
      Alamat: "Jl. Contoh Raya No. 123, Jakarta",
      NIB: "1234567890123",
      "Jenis API": "API-U",
      Status: "Aktif",
      Negara: "ID",
      "Kode Afiliasi": "00",
    },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", type: "select", options: identityOptions, span: 1 },
      { key: "NITKU / NPWP", label: "NITKU / NPWP", placeholder: "Masukkan NITKU atau NPWP", span: 1 },
      { key: "Nama Perusahaan", label: "Nama Perusahaan", placeholder: "Nama perusahaan importir", span: 2 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat lengkap perusahaan", span: 3 },
      { key: "NIB", label: "NIB", placeholder: "Nomor Induk Berusaha", span: 1 },
      { key: "Jenis API", label: "Jenis API", type: "select", options: apiOptions, span: 1 },
      { key: "Status", label: "Status", type: "select", options: statusOptions, span: 1 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Kode Afiliasi", label: "Kode Afiliasi", placeholder: "Kode afiliasi", span: 1 },
    ],
  },
  {
    kind: "ppjk",
    title: "PPJK",
    badge: "Opsional",
    description: "Pengusaha Pengurusan Jasa Kepabeanan bila proses menggunakan perantara kepabeanan.",
    icon: BriefcaseIcon,
    defaultValues: {
      "Jenis Entitas": "PPJK",
      "Nama PPJK": "PT Mitra PPJK",
      "Nomor PPJK": "PPJK-001",
      "NPWP / NITKU": "3171010000002",
      Alamat: "Jl. Pelabuhan No. 45, Jakarta",
    },
    fields: [
      { key: "Nama PPJK", label: "Nama PPJK", placeholder: "Nama perusahaan PPJK", span: 2 },
      { key: "Nomor PPJK", label: "Nomor PPJK", placeholder: "Nomor registrasi PPJK", span: 1 },
      { key: "NPWP / NITKU", label: "NPWP / NITKU", placeholder: "NPWP atau NITKU", span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat PPJK", span: 3 },
    ],
  },
  {
    kind: "penjual",
    title: "Penjual",
    badge: "Opsional",
    description: "Pihak yang menjual barang kepada importir.",
    icon: UserIcon,
    defaultValues: {
      "Jenis Entitas": "Penjual",
      "Nama Penjual": "PT Global Trade",
      Alamat: "Shenzhen, China",
      Negara: "CN",
    },
    fields: [
      { key: "Nama Penjual", label: "Nama Penjual", placeholder: "Nama penjual", span: 2 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat penjual", span: 2 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
    ],
  },
  {
    kind: "pemilikBarang",
    title: "Pemilik Barang",
    badge: "Opsional",
    description: "Pihak yang memiliki barang apabila berbeda dari importir.",
    icon: DocumentsIcon,
    defaultValues: {
      "Jenis Entitas": "Pemilik Barang",
      Nama: "PT Pemilik Satu",
      Alamat: "Jl. Industri No. 7, Batam",
      Negara: "ID",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama pemilik barang", span: 2 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pemilik barang", span: 2 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
    ],
  },
  {
    kind: "pengangkut",
    title: "Pengangkut",
    badge: "Opsional",
    description: "Pihak atau operator sarana angkut yang membawa barang.",
    icon: TruckIcon,
    defaultValues: {
      "Jenis Entitas": "Pengangkut",
      "Nama Pengangkut": "MV Contoh Nusantara",
      Negara: "ID",
      "Nomor Sarana Angkut": "VY-0626",
    },
    fields: [
      { key: "Nama Pengangkut", label: "Nama Pengangkut", placeholder: "Nama pengangkut", span: 2 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Nomor Sarana Angkut", label: "Nomor Sarana Angkut", placeholder: "Nomor sarana angkut", span: 2 },
    ],
  },
];

const entityDefinitionMap = Object.fromEntries(entityDefinitions.map((definition) => [definition.kind, definition])) as Record<EntityKind, EntityDefinition>;

const entityOrder: EntityKind[] = ["importir", "penjual", "ppjk", "pengangkut", "pemilikBarang"];

const stepFieldGroups = [
  {
    id: "header-pengajuan",
    title: "Header Pengajuan",
    fields: [
      { key: "nomorPengajuan", label: "Nomor Pengajuan", mandatory: true },
      { key: "kantorPabean", label: "Kantor Pabean", mandatory: true },
      { key: "jenisPib", label: "Jenis PIB", mandatory: true },
      { key: "jenisImpor", label: "Jenis Impor", mandatory: true },
      { key: "caraBayar", label: "Cara Bayar", mandatory: true },
    ],
  },
  {
    id: "transaksi",
    title: "Transaksi",
    fields: [
      { key: "valuta", label: "Valuta", mandatory: true },
      { key: "ndpbm", label: "NDPBM", mandatory: true },
      { key: "jenisTransaksi", label: "Jenis Transaksi", mandatory: true },
      { key: "harga", label: "Harga" },
      { key: "freight", label: "Freight" },
      { key: "asuransi", label: "Asuransi" },
      { key: "diskon", label: "Diskon" },
      { key: "beratKotor", label: "Berat Kotor" },
    ],
  },
  {
    id: "pengangkutan",
    title: "Pengangkutan",
    fields: [
      { key: "caraPengangkutan", label: "Cara Pengangkutan", mandatory: true },
      { key: "namaSaranaAngkut", label: "Nama Sarana Angkut", mandatory: true },
      { key: "nomorVoyage", label: "Nomor Voyage" },
      { key: "bendera", label: "Bendera" },
      { key: "perkiraanTanggalTiba", label: "Perkiraan Tanggal Tiba", mandatory: true },
    ],
  },
  {
    id: "pelabuhan",
    title: "Pelabuhan & Tempat Timbun",
    fields: [
      { key: "pelabuhanMuat", label: "Pelabuhan Muat" },
      { key: "pelabuhanTransit", label: "Pelabuhan Transit" },
      { key: "pelabuhanTujuan", label: "Pelabuhan Tujuan" },
      { key: "tempatTimbun", label: "Tempat Timbun", mandatory: true },
    ],
  },
] as const;

const dokumenColumns = ["Seri", "Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin"];
const kemasanColumns = ["Seri", "Jenis Kemasan", "Merek"];
const kontainerColumns = ["Seri", "Nomor Kontainer", "Ukuran", "Jenis Muatan", "Tipe"];
const barangColumns = [
  "Seri",
  "HS Code",
  "Kode Barang",
  "Uraian",
  "Merek",
  "Tipe",
  "Ukuran",
  "Spesifikasi Lain",
  "Kondisi Barang",
  "Negara Asal",
  "Berat Bersih",
  "Kode Satuan",
  "Jumlah Satuan",
  "Kode Kemasan",
  "Jumlah Kemasan",
  "Harga Invoice",
];
const spesifikasiColumns = ["Seri Barang", "Nama Spesifikasi", "Nilai", "Satuan"];
const barangDokumenColumns = ["Seri Barang", "Seri Dokumen", "Jenis Dokumen", "Nomor Dokumen", "Tanggal"];
const barangVdColumns = ["Seri Barang", "Jenis VD", "Nilai", "Keterangan"];
const barangTarifColumns = ["Seri Barang", "Jenis Pungutan", "Jenis Tarif", "Kode Satuan", "Jumlah Satuan", "Nilai Tarif", "Kode Fasilitas Tarif", "Nilai Tarif Fasilitas"];
const karantinaColumns = ["Seri Barang", "Komoditas Karantina", "Jenis Karantina", "Nomor Dokumen", "Status"];

const createRow = (columns: string[], values: Row = {}) =>
  columns.reduce<Row>((acc, column) => {
    acc[column] = values[column] ?? "";
    return acc;
  }, {});

const createBlankBarangRow = (seri: string) =>
  createRow(barangMasterColumns, {
    Seri: seri,
    Status: "Perlu Dilengkapi",
  });

const hasAnyValue = (row: Row) => Object.values(row).some((value) => value.trim().length > 0);
const hasAnyRows = (rows: Row[]) => rows.some(hasAnyValue);
const countFilledRows = (rows: Row[]) => rows.filter(hasAnyValue).length;

const formStepOrder: WizardStepId[] = ["pengajuan", "entitas", "dokumen", "kemasan", "barang", "review"];

const goToStep = (current: WizardStepId, delta: number) => {
  const index = formStepOrder.indexOf(current);
  const nextIndex = Math.min(formStepOrder.length - 1, Math.max(0, index + delta));
  return formStepOrder[nextIndex] ?? current;
};

const isMandatoryFilled = (value: string) => value.trim().length > 0;

const getSourceLabel = (source?: FormSource | null) => {
  if (source === "assistant") return "Smart Submission Assistant";
  if (source === "manual") return "Buat Pengajuan Baru";
  if (source === "copy") return "Copy Data Pengajuan";
  if (source === "upload") return "Upload Template Excel";
  return "Tidak diketahui";
};

const normalizeJenisPengajuan = (value?: string) => {
  const map: Record<string, string> = {
    "Impor Barang": "Pengajuan Barang Masuk / Impor",
    "Ekspor Barang": "Pengajuan Barang Keluar / Ekspor",
    "Pemasukan KEK": "Pengajuan KEK",
    "Pengeluaran KEK": "Pengajuan KEK",
    KEK: "Pengajuan KEK",
    "Pengajuan Umum": "Pengajuan Umum",
  };

  return value && map[value] ? map[value] : value || "Pengajuan Barang Masuk / Impor";
};

const createInitialFormState = (draft: AiSubmissionDraft | null): FormState => {
  const jenisPengajuan = normalizeJenisPengajuan(draft?.jenisPengajuan);
  const companyName = draft?.namaPerusahaan || "PT Contoh Nusantara";
  const npwp = draft?.npwp || "01.234.567.8-999.000";
  const nib = draft?.nib || "1234567890123";
  const documents = draft?.dokumen?.length ? draft.dokumen : ["surat_pengajuan_impor_v01.docx"];

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
      createRow(["Jenis Entitas", "Jenis Identitas", "NITKU / NPWP", "Nama Perusahaan", "Alamat", "NIB", "Jenis API", "Status", "Negara", "Kode Afiliasi"], {
        "Jenis Entitas": "Importir",
        "Jenis Identitas": "NPWP",
        "NITKU / NPWP": "3171010000001",
        "Nama Perusahaan": companyName,
        Alamat: "Jl. Contoh Raya No. 123, Jakarta",
        NIB: nib,
        "Jenis API": "API-U",
        Status: "Aktif",
        Negara: "ID",
        "Kode Afiliasi": "00",
      }),
      createRow(["Jenis Entitas", "Nama Penjual", "Alamat", "Negara"], { "Jenis Entitas": "Penjual" }),
      createRow(["Jenis Entitas", "Nama PPJK", "Nomor PPJK", "NPWP / NITKU", "Alamat"], { "Jenis Entitas": "PPJK" }),
      createRow(["Jenis Entitas", "Nama Pengangkut", "Negara", "Nomor Sarana Angkut"], { "Jenis Entitas": "Pengangkut" }),
      createRow(["Jenis Entitas", "Nama", "Alamat", "Negara"], { "Jenis Entitas": "Pemilik Barang" }),
    ],
    dokumen: [
      createRow(["Seri", "Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin"], {
        Seri: "1",
        "Kode Dokumen": "INV",
        "Nomor Dokumen": documents[0] || "surat_pengajuan_impor_v01.docx",
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      }),
      createRow(["Seri", "Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin"], {
        Seri: "2",
        "Kode Dokumen": "PL",
        "Nomor Dokumen": documents[1] || "packing_list_mock.pdf",
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      }),
    ],
    kemasan: [createRow(kemasanColumns, { Seri: "1", "Jenis Kemasan": "Pallet", Merek: "INSW" })],
    kontainer: [createRow(kontainerColumns, { Seri: "1", "Nomor Kontainer": "MSKU1234567", Ukuran: "40", "Jenis Muatan": "FCL", Tipe: "Dry" })],
    barang: [
      createRow(barangMasterColumns, {
        Seri: "1",
        "HS Code": "8471.30.10",
        "Kode Barang": "BRG-001",
        Uraian: "Laptop Lenovo ThinkPad",
        Merek: "Lenovo",
        Tipe: "Notebook",
        "Negara Asal": "CN",
        "Jumlah Satuan": "10",
        "Berat Bersih": "950",
        Status: "Perlu Validasi",
        Ukuran: "14 Inch",
        "Spesifikasi Lain": "Core i7, 16GB RAM",
        "Kondisi Barang": "Baru",
        "Kode Satuan": "PCE",
        "Kode Kemasan": "BOX",
        "Jumlah Kemasan": "2",
        "Harga Invoice": "1250000",
      }),
      createRow(barangMasterColumns, {
        Seri: "2",
        "HS Code": "8504.40.90",
        "Kode Barang": "BRG-002",
        Uraian: "Power Adapter",
        Merek: "Generic",
        Tipe: "Adapter",
        "Negara Asal": "SG",
        "Jumlah Satuan": "20",
        "Berat Bersih": "120",
        Status: "Lengkap",
        Ukuran: "-",
        "Spesifikasi Lain": "-",
        "Kondisi Barang": "Baru",
        "Kode Satuan": "PCE",
        "Kode Kemasan": "BOX",
        "Jumlah Kemasan": "1",
        "Harga Invoice": "500000",
      }),
      createRow(barangMasterColumns, {
        Seri: "3",
        "HS Code": "8528.52.00",
        "Kode Barang": "BRG-003",
        Uraian: "Monitor LED",
        Merek: "AOC",
        Tipe: "Display",
        "Negara Asal": "CN",
        "Jumlah Satuan": "5",
        "Berat Bersih": "2800",
        Status: "Perlu Dilengkapi",
        Ukuran: "24 Inch",
        "Spesifikasi Lain": "Full HD",
        "Kondisi Barang": "Baru",
        "Kode Satuan": "PCE",
        "Kode Kemasan": "CRT",
        "Jumlah Kemasan": "3",
        "Harga Invoice": "3200000",
      }),
    ],
    spesifikasi: [
      createRow(spesifikasiColumns, { "Seri Barang": "1", "Nama Spesifikasi": "Warna", Nilai: "Hitam", Satuan: "-" }),
      createRow(spesifikasiColumns, { "Seri Barang": "1", "Nama Spesifikasi": "Memori", Nilai: "16GB", Satuan: "GB" }),
      createRow(spesifikasiColumns, { "Seri Barang": "3", "Nama Spesifikasi": "Resolusi", Nilai: "1920 x 1080", Satuan: "px" }),
    ],
    barangDokumen: [
      createRow(barangDokumenColumns, { "Seri Barang": "1", "Seri Dokumen": "1", "Jenis Dokumen": "Invoice", "Nomor Dokumen": "INV-001", Tanggal: "2026-06-30" }),
      createRow(barangDokumenColumns, { "Seri Barang": "1", "Seri Dokumen": "2", "Jenis Dokumen": "Packing List", "Nomor Dokumen": "PL-001", Tanggal: "2026-06-30" }),
      createRow(barangDokumenColumns, { "Seri Barang": "2", "Seri Dokumen": "1", "Jenis Dokumen": "Invoice", "Nomor Dokumen": "INV-002", Tanggal: "2026-06-30" }),
    ],
    barangVd: [
      createRow(barangVdColumns, { "Seri Barang": "1", "Jenis VD": "VD001", Nilai: "1", Keterangan: "Volume data mock" }),
      createRow(barangVdColumns, { "Seri Barang": "2", "Jenis VD": "VD002", Nilai: "2", Keterangan: "Data tarif mock" }),
    ],
    barangTarif: [
      createRow(barangTarifColumns, {
        "Seri Barang": "1",
        "Jenis Pungutan": "BM",
        "Jenis Tarif": "Ad Valorem",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "10",
        "Nilai Tarif": "5",
        "Kode Fasilitas Tarif": "-",
        "Nilai Tarif Fasilitas": "0",
      }),
      createRow(barangTarifColumns, {
        "Seri Barang": "2",
        "Jenis Pungutan": "PPN",
        "Jenis Tarif": "Ad Valorem",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "20",
        "Nilai Tarif": "11",
        "Kode Fasilitas Tarif": "-",
        "Nilai Tarif Fasilitas": "0",
      }),
    ],
    karantina: [
      createRow(karantinaColumns, { "Seri Barang": "1", "Komoditas Karantina": "Hewan", "Jenis Karantina": "Hewan", "Nomor Dokumen": "KAR-001", Status: "Lulus" }),
      createRow(karantinaColumns, { "Seri Barang": "3", "Komoditas Karantina": "Tumbuhan", "Jenis Karantina": "Tumbuhan", "Nomor Dokumen": "KAR-002", Status: "Menunggu" }),
    ],
  };
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 fill-current transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="m7 10 5 5 5-5H7Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM6 9h12l-1 11H7L6 9Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="m9.2 16.2-3.7-3.7-1.4 1.4 5.1 5.1L20 8.2l-1.4-1.4-9.4 9.4Z" />
    </svg>
  );
}

function AccordionCard({
  title,
  subtitle,
  children,
  defaultOpen = true,
  badge,
  leadingIcon,
  headerActions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: { label: string; tone?: "brand" | "neutral" | "error" | "success" };
  leadingIcon?: ReactNode;
  headerActions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-border-primary bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          {leadingIcon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600">
              {leadingIcon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">{title}</div>
              {badge ? (
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    badge.tone === "error"
                      ? "bg-error-50 text-error-600"
                      : badge.tone === "success"
                        ? "bg-success-50 text-success-600"
                        : badge.tone === "neutral"
                          ? "bg-neutral-100 text-neutral-700"
                          : "bg-brand-primary-50 text-brand-primary-700",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {badge.label}
                </span>
              ) : null}
            </div>
            {subtitle && <div className="mt-1 text-[12px] text-neutral-600">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
            <ChevronIcon open={open} />
          </span>
        </div>
      </button>
      {open && <div className="border-t border-border-primary px-4 py-4">{children}</div>}
    </section>
  );
}

function EntityFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: EntityFieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const widthClass = field.span === 3 ? "md:col-span-2 xl:col-span-3" : field.span === 2 ? "md:col-span-2" : "";
  const wrapperClass = ["flex flex-col gap-1.5", widthClass].filter(Boolean).join(" ");

  if (field.type === "textarea") {
    return (
      <Textarea
        className={wrapperClass}
        label={field.label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder ?? field.label}
        rows={4}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        className={wrapperClass}
        label={field.label}
        value={value}
        onValueChange={onChange}
        placeholder={field.placeholder ?? `Pilih ${field.label.toLowerCase()}`}
        options={field.options ?? []}
      />
    );
  }

  return (
    <Input
      className={wrapperClass}
      label={field.label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder ?? field.label}
    />
  );
}

function EntityCardContent({
  entity,
  row,
  onChange,
}: {
  entity: EntityDefinition;
  row: Row;
  onChange: (column: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entity.fields.map((field) => (
        <EntityFieldRenderer
          key={field.key}
          field={field}
          value={row[field.key] ?? ""}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mandatory = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mandatory?: boolean;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      requiredMark={mandatory}
    />
  );
}

function EditableTable({
  columns,
  rows,
  onChange,
  onAdd,
  onRemove,
  minWidth,
  columnWidths,
}: {
  columns: string[];
  rows: Row[];
  onChange: (rowIndex: number, column: string, value: string) => void;
  onAdd: () => void;
  onRemove: (rowIndex: number) => void;
  minWidth?: number;
  columnWidths?: string[];
}) {
  const stretchToFill = (minWidth ?? 1100) <= 1200 || columns.length <= 4;
  const tableStyle = stretchToFill
    ? ({ width: "100%" } as const)
    : ({ minWidth: minWidth ?? 1100 } as const);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-border-primary">
        <table className="min-w-full table-fixed border-collapse text-left text-[12px]" style={tableStyle}>
          <thead className="bg-brand-primary-500 text-white">
            <tr>
              <th className="w-[56px] px-3 py-2">#</th>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className="px-3 py-2 font-semibold whitespace-nowrap"
                  style={{
                    width:
                      columnWidths?.[index] ??
                      (stretchToFill ? `${100 / columns.length}%` : `${Math.max(140, Math.floor((minWidth ?? 1100) / (columns.length + 2)))}px`),
                  }}
                >
                  {column}
                </th>
              ))}
              <th className="w-[112px] px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${columns[0]}-${rowIndex}`} className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                <td className="px-3 py-2 font-medium text-neutral-600">{rowIndex + 1}</td>
                {columns.map((column, index) => (
                  <td key={column} className="px-3 py-2" style={{ width: columnWidths?.[index] ?? (stretchToFill ? `${100 / columns.length}%` : undefined) }}>
                    <input
                      value={row[column] ?? ""}
                      onChange={(event) => onChange(rowIndex, column, event.target.value)}
                      className="h-9 w-full rounded-md border border-border-primary bg-white px-2 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                    />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <Button variant="error" size="sm" onClick={() => onRemove(rowIndex)} startIcon={<TrashIcon />}>
                    Hapus
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={onAdd} startIcon={<PlusIcon />}>
          Tambah Baris
        </Button>
      </div>
    </div>
  );
}

type BarangDetailSection = "spesifikasi" | "dokumen" | "vd" | "tarif" | "karantina";

function MiniStatusPill({ value }: { value: string }) {
  const toneClass =
    value === "Lengkap"
      ? "bg-success-100 text-success-600"
      : value === "Perlu Dilengkapi"
        ? "bg-warning-50 text-warning-600"
        : value === "Perlu Validasi"
          ? "bg-info-100 text-info-600"
          : value === "Belum Dicek"
            ? "bg-neutral-100 text-neutral-700"
            : "bg-error-50 text-error-600";

  return <span className={["inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", toneClass].join(" ")}>{value}</span>;
}

function CompactEditableTable({
  columns,
  rows,
  onChange,
  onAdd,
  onRemove,
  emptyState,
  addLabel = "Tambah Baris",
}: {
  columns: string[];
  rows: BarangSectionRow[];
  onChange: (rowIndex: number, column: string, value: string) => void;
  onAdd: () => void;
  onRemove: (rowIndex: number) => void;
  emptyState: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border-primary">
          <table className="min-w-full table-fixed border-collapse text-left text-[12px]">
            <thead className="bg-brand-primary-500 text-white">
              <tr>
                <th className="w-[56px] px-3 py-2">#</th>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {column}
                  </th>
                ))}
                <th className="w-[90px] px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, index }) => (
                <tr key={`${index}-${columns[0]}`} className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                  <td className="px-3 py-2 font-medium text-neutral-600">{index + 1}</td>
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-2">
                      <input
                        value={row[column] ?? ""}
                        onChange={(event) => onChange(index, column, event.target.value)}
                        className="h-9 w-full rounded-md border border-border-primary bg-white px-2 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <IconButton aria-label={`Hapus baris ${index + 1}`} size="sm" variant="error" onClick={() => onRemove(index)}>
                      <TrashBinTrashIcon className="h-4 w-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/30 p-4 text-[12px] text-neutral-600">
          {emptyState}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={onAdd} startIcon={<PlusIcon />}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function BarangWorkspaceDrawer({
  open,
  item,
  mode,
  activeTab,
  onTabChange,
  onClose,
  onSave,
  onUpdateMasterField,
  detailRows,
  onAddDetailRow,
  onRemoveDetailRow,
  onUpdateDetailRow,
}: {
  open: boolean;
  item: Row | null;
  mode: BarangWorkspaceMode;
  activeTab: BarangWorkspaceTab;
  onTabChange: (tab: BarangWorkspaceTab) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdateMasterField: (column: string, value: string) => void;
  detailRows: Record<BarangDetailSection, BarangSectionRow[]>;
  onAddDetailRow: (section: BarangDetailSection, template?: Row) => void;
  onRemoveDetailRow: (section: BarangDetailSection, rowIndex: number) => void;
  onUpdateDetailRow: (section: BarangDetailSection, rowIndex: number, column: string, value: string) => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [cooSource, setCooSource] = useState<"service" | "upload" | "none">("service");
  const [cooSearch, setCooSearch] = useState("");
  const [supportFiles, setSupportFiles] = useState<string[]>([]);
  const openFrameOne = useRef(0);
  const openFrameTwo = useRef(0);

  useEffect(() => {
    if (open) {
      setRendered(true);
      openFrameOne.current = window.requestAnimationFrame(() => {
        openFrameTwo.current = window.requestAnimationFrame(() => setAnimateOpen(true));
      });
      return () => {
        window.cancelAnimationFrame(openFrameOne.current);
        window.cancelAnimationFrame(openFrameTwo.current);
      };
    }
    setAnimateOpen(false);
    const timer = window.setTimeout(() => setRendered(false), 340);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCooSource("service");
    setCooSearch("");
    setSupportFiles([]);
    setTocOpen(true);
  }, [open, item?.Seri]);

  if (!rendered || !item) return null;

  const seri = item.Seri || "-";
  const drawerTitle = mode === "add" ? "Tambah Barang" : `Barang Seri ${seri} - ${item["Uraian"] || "Tanpa uraian"}`;
  const drawerSubtitle =
    mode === "add"
      ? "Isi data barang baru lalu simpan untuk menambah record ke tabel barang."
      : "Kelola detail barang per seri dari drawer kanan. Data inti dan detail turunannya tetap melekat pada barang yang sama.";
  const sourceItems = ["COO-001 - Certificate of Origin", "COO-002 - Preferential COO", "COO-003 - Origin Statement"];
  const filteredSourceItems = sourceItems.filter((entry) => entry.toLowerCase().includes(cooSearch.trim().toLowerCase()));
  const activeTocItems = activeTab === "data-barang" ? barangTocItems : complianceTocItems;

  const jumpToSection = (id: string) => {
    const target = document.getElementById(id);
    const container = target?.closest(".drawer-scroll-area") as HTMLElement | null;
    if (!target || !container) return;

    const offset = 52;
    const top = target.offsetTop - container.offsetTop - offset;
    container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const addFileNames = (event: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(event.target.files ?? []).map((file) => file.name);
    if (names.length > 0) setSupportFiles((current) => [...current, ...names]);
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        aria-label="Tutup workspace barang"
        onClick={onClose}
      />

      <div
        className={`absolute inset-y-0 right-0 w-[min(58vw,860px)] max-w-[calc(100vw-0.5rem)] overflow-visible border-l border-border-primary bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)] transition-transform duration-[340ms] ease-out transform-gpu ${
          animateOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full min-h-0 flex-col rounded-none bg-white lg:rounded-l-2xl">
            <div className="flex flex-col gap-4 border-b border-border-primary px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">Workspace Barang</div>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-neutral-800">{drawerTitle}</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{drawerSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-sm transition-colors hover:bg-brand-primary-50"
                aria-label="Tutup drawer"
              >
                ×
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-visible">
              <div className="pointer-events-none absolute left-0 top-28 z-50 hidden lg:block">
                {tocOpen ? (
                  <div className="pointer-events-auto w-56 -translate-x-full rounded-2xl border border-border-primary bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur">
                    <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">TOC</div>
                        <div className="text-[11px] text-neutral-700">Lompat cepat</div>
                      </div>
                      <IconButton aria-label="Sembunyikan TOC" size="sm" variant="outline" onClick={() => setTocOpen(false)} className="h-8 w-8">
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                    <div className="mt-2 max-h-[calc(100vh-220px)] space-y-1.5 overflow-auto pr-1">
                      {activeTocItems.map((section) => {
                        const sectionDescription = "description" in section ? (section as { description?: string }).description ?? "" : "";
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => jumpToSection(section.id)}
                            className="flex w-full items-start gap-2.5 rounded-xl border border-border-primary bg-white px-2.5 py-2.5 text-left transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-50/60"
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary-50 text-brand-primary-600">
                              <ArrowRightIcon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] font-semibold text-neutral-800">{section.title}</span>
                              {sectionDescription ? <span className="mt-0.5 block text-[10px] leading-4 text-neutral-600">{sectionDescription}</span> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTocOpen(true)}
                    className="pointer-events-auto flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-brand-primary-200 bg-white px-3 py-2 text-[11px] font-semibold text-brand-primary-700 shadow-lg transition-colors hover:bg-brand-primary-50"
                    aria-label="Buka TOC"
                  >
                    <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
                    <span className="whitespace-nowrap">TOC</span>
                  </button>
                )}
              </div>

              <div className="drawer-scroll-area h-full min-h-0 overflow-y-auto px-4 pt-0 pb-4 lg:px-5">
                <div className="sticky top-0 z-20 border-b border-border-primary bg-white/95 pt-0 backdrop-blur">
                  <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border-primary bg-white p-1">
                    <Button
                      fullWidth
                      variant={activeTab === "data-barang" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => onTabChange("data-barang")}
                      className={`rounded-md border-0 shadow-none transition-colors ${
                        activeTab === "data-barang"
                          ? "!bg-brand-primary-500 !text-white hover:!bg-brand-primary-600"
                          : "!bg-transparent !text-neutral-700 hover:!bg-neutral-100"
                      }`}
                    >
                      Data Barang
                    </Button>
                    <Button
                      fullWidth
                      variant={activeTab === "compliance" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => onTabChange("compliance")}
                      className={`rounded-md border-0 shadow-none transition-colors ${
                        activeTab === "compliance"
                          ? "!bg-brand-primary-500 !text-white hover:!bg-brand-primary-600"
                          : "!bg-transparent !text-neutral-700 hover:!bg-neutral-100"
                      }`}
                    >
                      Compliance & Perizinan
                    </Button>
                  </div>
                </div>

                {activeTab === "data-barang" ? (
                  <div className="space-y-4 pt-4">
                    <section id="barang-info" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-border-primary pb-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Informasi Barang</div>
                          <p className="mt-1 text-[12px] text-neutral-600">Edit data inti untuk barang seri ini.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <MiniStatusPill value={item.Status || "Perlu Validasi"} />
                          <span className="inline-flex rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                            {item["Negara Asal"] || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {barangInfoFields.map((field) => (
                          <EntityFieldRenderer
                            key={field.key}
                            field={field}
                            value={item[field.key] ?? ""}
                            onChange={(value) => onUpdateMasterField(field.key, value)}
                          />
                        ))}
                      </div>
                    </section>

                    <section id="barang-spesifikasi" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Spesifikasi Wajib</div>
                        <p className="text-[12px] text-neutral-600">Editable mini table per seri. Jika kosong tampilkan empty state.</p>
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={spesifikasiColumns.slice(1)}
                          rows={detailRows.spesifikasi}
                          onChange={(rowIndex, column, value) => onUpdateDetailRow("spesifikasi", rowIndex, column, value)}
                          onAdd={() => onAddDetailRow("spesifikasi", { "Seri Barang": seri })}
                          onRemove={(rowIndex) => onRemoveDetailRow("spesifikasi", rowIndex)}
                          emptyState="Tidak ada spesifikasi wajib untuk barang ini."
                          addLabel="Tambah Spesifikasi"
                        />
                      </div>
                    </section>

                    <section id="barang-dokumen" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Dokumen Barang</div>
                        <p className="text-[12px] text-neutral-600">Dokumen yang terhubung ke seri ini.</p>
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={barangDokumenColumns.slice(1)}
                          rows={detailRows.dokumen}
                          onChange={(rowIndex, column, value) => onUpdateDetailRow("dokumen", rowIndex, column, value)}
                          onAdd={() => onAddDetailRow("dokumen", { "Seri Barang": seri })}
                          onRemove={(rowIndex) => onRemoveDetailRow("dokumen", rowIndex)}
                          emptyState="Belum ada dokumen barang untuk seri ini."
                          addLabel="Tambah Dokumen"
                        />
                      </div>
                    </section>

                    <section id="barang-vd" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Barang VD</div>
                        <p className="text-[12px] text-neutral-600">Mock data barang VD untuk seri ini.</p>
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={barangVdColumns.slice(1)}
                          rows={detailRows.vd}
                          onChange={(rowIndex, column, value) => onUpdateDetailRow("vd", rowIndex, column, value)}
                          onAdd={() => onAddDetailRow("vd", { "Seri Barang": seri })}
                          onRemove={(rowIndex) => onRemoveDetailRow("vd", rowIndex)}
                          emptyState="Belum ada data barang VD untuk seri ini."
                          addLabel="Tambah VD"
                        />
                      </div>
                    </section>

                    <section id="barang-tarif" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Barang Tarif</div>
                        <p className="text-[12px] text-neutral-600">Pungutan dan tarif per seri barang.</p>
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={barangTarifColumns.slice(1)}
                          rows={detailRows.tarif}
                          onChange={(rowIndex, column, value) => onUpdateDetailRow("tarif", rowIndex, column, value)}
                          onAdd={() => onAddDetailRow("tarif", { "Seri Barang": seri })}
                          onRemove={(rowIndex) => onRemoveDetailRow("tarif", rowIndex)}
                          emptyState="Belum ada data tarif untuk barang ini."
                          addLabel="Tambah Tarif"
                        />
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <section id="compliance-lartas" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Lartas</div>
                        <p className="text-[12px] text-neutral-600">Ringkasan hasil cek lartas dan rekomendasi dokumen.</p>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4">
                          <div className="text-[12px] font-semibold text-neutral-800">Status: Perlu Dokumen</div>
                          <p className="mt-2 text-[12px] leading-6 text-neutral-700">Lartas barang ini memerlukan dokumen tambahan untuk validasi.</p>
                        </div>
                        <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4">
                          <div className="text-[12px] font-semibold text-neutral-800">Sumber Data</div>
                          <p className="mt-2 text-[12px] leading-6 text-neutral-700">Gunakan data dari Service INSW atau input manual bila diperlukan.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Cek Lartas
                        </Button>
                        <Button variant="primary" size="sm">
                          Gunakan Data INSW
                        </Button>
                      </div>
                    </section>

                    <section id="compliance-coo" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-border-primary pb-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">COO</div>
                        <p className="text-[12px] text-neutral-600">Pilih sumber COO secara inline tanpa modal.</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant={cooSource === "service" ? "primary" : "outline"} size="sm" onClick={() => setCooSource("service")}>
                          Gunakan COO dari Service INSW
                        </Button>
                        <Button variant={cooSource === "upload" ? "primary" : "outline"} size="sm" onClick={() => setCooSource("upload")}>
                          Upload COO Baru
                        </Button>
                        <Button variant={cooSource === "none" ? "primary" : "outline"} size="sm" onClick={() => setCooSource("none")}>
                          Tidak menggunakan COO
                        </Button>
                      </div>
                      {cooSource === "service" ? (
                        <div className="mt-4 rounded-2xl border border-border-primary bg-background-primary/30 p-4">
                          <div className="flex items-center gap-2">
                            <div className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-neutral-500">
                              <MagniferIcon className="h-4 w-4" />
                            </div>
                            <input
                              value={cooSearch}
                              onChange={(event) => setCooSearch(event.target.value)}
                              placeholder="Cari COO..."
                              className={fieldTone}
                            />
                          </div>
                          <div className="mt-3 space-y-2">
                            {filteredSourceItems.length > 0 ? (
                              filteredSourceItems.map((entry) => (
                                <div key={entry} className="rounded-xl border border-border-primary bg-white px-3 py-2 text-[12px] text-neutral-700">
                                  {entry}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-border-primary bg-white px-3 py-2 text-[12px] text-neutral-600">
                                Tidak ada COO yang cocok.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section id="compliance-masterlist" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Masterlist</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Gunakan Masterlist tersedia
                        </Button>
                        <Button variant="outline" size="sm">
                          Upload Masterlist baru
                        </Button>
                        <Button variant="outline" size="sm">
                          Tidak menggunakan Masterlist
                        </Button>
                      </div>
                    </section>

                    <section id="compliance-tkq" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">TKQ</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Input label="Nomor TKQ" value="TKQ-001" onChange={() => void 0} />
                        <Input label="Tanggal" value="2026-07-04" onChange={() => void 0} />
                        <Input label="Status" value="Belum Dicek" onChange={() => void 0} />
                      </div>
                    </section>

                    <section id="compliance-transportasi" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Transportasi</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Input label="Moda Transportasi" value="Laut" onChange={() => void 0} />
                        <Input label="Nama Sarana Angkut" value="MV Contoh Nusantara" onChange={() => void 0} />
                        <Input label="Nomor Voyage / Flight / Trip" value="VY-0626" onChange={() => void 0} />
                        <Input label="Pelabuhan Muat" value="SGSIN" onChange={() => void 0} />
                        <Input label="Pelabuhan Tujuan" value="IDTPP" onChange={() => void 0} />
                      </div>
                    </section>

                    <section id="compliance-karantina" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Karantina</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="Komoditas Karantina" value="Tumbuhan" onChange={() => void 0} />
                        <Input label="Jenis Karantina" value="Karantina Tumbuhan" onChange={() => void 0} />
                        <Input label="Nomor Dokumen" value="KAR-001" onChange={() => void 0} />
                        <Input label="Status" value="Perlu Validasi" onChange={() => void 0} />
                      </div>
                    </section>

                    <section id="compliance-pendukung" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Dokumen Pendukung</div>
                      <div className="mt-4 rounded-2xl border border-dashed border-border-primary bg-background-primary/30 p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                          onChange={addFileNames}
                          className="block w-full text-[12px] text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary-500 file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-white"
                        />
                        <div className="mt-3 space-y-2">
                          {supportFiles.length > 0 ? (
                            supportFiles.map((name) => (
                              <div key={name} className="rounded-xl border border-border-primary bg-white px-3 py-2 text-[12px] text-neutral-700">
                                {name}
                              </div>
                            ))
                          ) : (
                            <div className="text-[12px] text-neutral-600">Belum ada file yang dipilih.</div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border-primary pt-4">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Tutup
                  </Button>
                  <Button variant="primary" size="sm" onClick={onSave}>
                    {mode === "add" ? "Simpan Barang" : "Simpan Perubahan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{label}</div>
      <div className="mt-2 text-[26px] font-semibold text-neutral-800">{value}</div>
    </div>
  );
}

function StepFooterActions({
  step,
  onPrevious,
  onCheck,
  onNext,
}: {
  step: WizardStepId;
  onPrevious?: () => void;
  onCheck: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-primary pt-4">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={!onPrevious}>
        {"< sebelumnya"}
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCheck}>
          Cek Kelengkapan
        </Button>
        <Button variant="primary" size="sm" onClick={onNext} disabled={!onNext}>
          selanjutnya {">"}
        </Button>
      </div>
    </div>
  );
}

export function FormPage() {
  const [draft, setDraft] = useState<AiSubmissionDraft | null>(null);
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState(null));
  const [activeStep, setActiveStep] = useState<WizardStepId>("pengajuan");
  const [notif, setNotif] = useState(true);
  const [source, setSource] = useState<FormSource | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Data bisa dikoreksi sebelum submit.");
  const [barangWorkspaceOpen, setBarangWorkspaceOpen] = useState(false);
  const [barangWorkspaceMode, setBarangWorkspaceMode] = useState<BarangWorkspaceMode>("edit");
  const [barangWorkspaceTab, setBarangWorkspaceTab] = useState<BarangWorkspaceTab>("data-barang");
  const [selectedBarangSeri, setSelectedBarangSeri] = useState<string>("1");
  const [barangDraftRow, setBarangDraftRow] = useState<Row | null>(null);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
  const [importExcelFileName, setImportExcelFileName] = useState("");
  const [importExcelStage, setImportExcelStage] = useState<BarangImportStage>("upload");
  const [clearBarangOpen, setClearBarangOpen] = useState(false);

  useEffect(() => {
    const savedForm = sessionStorage.getItem(BC20_FORM_STORAGE_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as StoredFormState;
        setDraft(parsed.draft ?? null);
        setFormState(parsed.formState ?? createInitialFormState(parsed.draft ?? null));
        setSource((sessionStorage.getItem(FORM_SOURCE_STORAGE_KEY) as FormSource | null) ?? null);
        setSourceNotice(sessionStorage.getItem(FORM_NOTICE_STORAGE_KEY));
        setStatusMessage("Draft form terakhir berhasil dimuat.");
        return;
      } catch {
        sessionStorage.removeItem(BC20_FORM_STORAGE_KEY);
      }
    }

    const raw = sessionStorage.getItem(AI_DRAFT_STORAGE_KEY);
    if (!raw) {
      setFormState(createInitialFormState(null));
      setSource(null);
      setSourceNotice(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AiSubmissionDraft;
      setDraft(parsed);
      setFormState(createInitialFormState(parsed));
      setSource((sessionStorage.getItem(FORM_SOURCE_STORAGE_KEY) as FormSource | null) ?? "assistant");
      setSourceNotice(sessionStorage.getItem(FORM_NOTICE_STORAGE_KEY));
      setStatusMessage("Data terisi dari Smart Submission Assistant.");
    } catch {
      setDraft(null);
      setFormState(createInitialFormState(null));
      setSource(null);
      setSourceNotice(null);
    }
  }, []);

  const importirRow = formState.entitas.find((row) => row["Jenis Entitas"] === "Importir") ?? formState.entitas[0] ?? null;

  const stepComplete = useMemo(
    () => ({
      pengajuan: mandatoryPengajuanFields.every((key) => isMandatoryFilled(formState.pengajuan[key] ?? "")),
      entitas:
        hasAnyRows(formState.entitas) &&
        ["Jenis Entitas", "Jenis Identitas", "NITKU / NPWP", "Nama Perusahaan", "Alamat", "NIB", "Jenis API", "Status", "Negara", "Kode Afiliasi"].every((column) =>
          isMandatoryFilled(importirRow?.[column] ?? ""),
        ),
      dokumen: hasAnyRows(formState.dokumen) && ["Seri", "Kode Dokumen", "Nomor Dokumen"].every((column) => isMandatoryFilled(formState.dokumen[0]?.[column] ?? "")),
      kemasan:
        hasAnyRows(formState.kemasan) &&
        hasAnyRows(formState.kontainer) &&
        ["Jenis Kemasan"].every((column) => isMandatoryFilled(formState.kemasan[0]?.[column] ?? "")) &&
        ["Nomor Kontainer", "Ukuran"].every((column) => isMandatoryFilled(formState.kontainer[0]?.[column] ?? "")),
      barang:
        hasAnyRows(formState.barang) &&
        ["HS Code", "Kode Barang", "Uraian", "Negara Asal", "Kode Satuan", "Jumlah Satuan", "Harga Invoice"].every((column) =>
          isMandatoryFilled(formState.barang[0]?.[column] ?? ""),
        ),
    }),
    [formState, importirRow],
  );

  const reviewStatus = useMemo(() => {
    const sections = ["pengajuan", "entitas", "dokumen", "kemasan", "barang"] as const;
    return sections.every((section) => stepComplete[section]);
  }, [stepComplete]);

  const summaryCounts = useMemo(
    () => ({
      entitas: countFilledRows(formState.entitas),
      dokumen: countFilledRows(formState.dokumen),
      barang: countFilledRows(formState.barang),
      kontainer: countFilledRows(formState.kontainer),
    }),
    [formState],
  );

  const selectedBarang = useMemo(() => {
    return formState.barang.find((row) => row.Seri === selectedBarangSeri) ?? formState.barang[0] ?? null;
  }, [formState.barang, selectedBarangSeri]);

  const nextBarangSeri = useMemo(() => {
    const maxSeri = formState.barang.reduce((max, row) => {
      const numeric = Number.parseInt(row.Seri ?? "", 10);
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 0);
    return String(maxSeri + 1);
  }, [formState.barang]);

  const workspaceBarang = barangWorkspaceMode === "add" ? barangDraftRow : selectedBarang;

  const selectedBarangIndex = useMemo(() => formState.barang.findIndex((row) => row.Seri === selectedBarang?.Seri), [formState.barang, selectedBarang]);

  const selectedBarangDetailRows = useMemo(
    () => ({
      spesifikasi: formState.spesifikasi.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      dokumen: formState.barangDokumen.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      vd: formState.barangVd.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      tarif: formState.barangTarif.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      karantina: formState.karantina.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
    }),
    [formState, workspaceBarang],
  );

  const updateRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, rowIndex: number, column: string, value: string) => {
    setFormState((current) => {
      const rows = [...current[section]];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };
      return { ...current, [section]: rows };
    });
  };

  const addRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, columns: string[], template?: Row) => {
    setFormState((current) => ({
      ...current,
      [section]: [...current[section], createRow(columns, template)],
    }));
  };

  const updateBarangField = (column: string, value: string) => {
    if (barangWorkspaceMode === "add") {
      setBarangDraftRow((current) => {
        if (!current) return current;
        return { ...current, [column]: value };
      });
      return;
    }

    if (selectedBarangIndex < 0) return;
    updateRow("barang", selectedBarangIndex, column, value);
  };

  const updateBarangDetailRow = (section: BarangDetailSection, rowIndex: number, column: string, value: string) => {
    const map: Record<BarangDetailSection, keyof Pick<FormState, "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      spesifikasi: "spesifikasi",
      dokumen: "barangDokumen",
      vd: "barangVd",
      tarif: "barangTarif",
      karantina: "karantina",
    };
    updateRow(map[section], rowIndex, column, value);
  };

  const addBarangDetailRow = (section: BarangDetailSection, template?: Row) => {
    const seri = workspaceBarang?.Seri ?? nextBarangSeri;
    const map: Record<BarangDetailSection, { section: keyof Pick<FormState, "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">; columns: string[]; template: Row }> = {
      spesifikasi: {
        section: "spesifikasi",
        columns: spesifikasiColumns,
        template: { "Seri Barang": seri, "Nama Spesifikasi": "", Nilai: "", Satuan: "" },
      },
      dokumen: {
        section: "barangDokumen",
        columns: barangDokumenColumns,
        template: { "Seri Barang": seri, "Seri Dokumen": "", "Jenis Dokumen": "", "Nomor Dokumen": "", Tanggal: "" },
      },
      vd: { section: "barangVd", columns: barangVdColumns, template: { "Seri Barang": seri, "Jenis VD": "", Nilai: "", Keterangan: "" } },
      tarif: {
        section: "barangTarif",
        columns: barangTarifColumns,
        template: {
          "Seri Barang": seri,
          "Jenis Pungutan": "",
          "Jenis Tarif": "",
          "Kode Satuan": "",
          "Jumlah Satuan": "",
          "Nilai Tarif": "",
          "Kode Fasilitas Tarif": "",
          "Nilai Tarif Fasilitas": "",
        },
      },
      karantina: {
        section: "karantina",
        columns: karantinaColumns,
        template: { "Seri Barang": seri, "Komoditas Karantina": "", "Jenis Karantina": "", "Nomor Dokumen": "", Status: "" },
      },
    };
    const config = map[section];
    addRow(config.section, config.columns, template ?? config.template);
  };

  const removeBarangDetailRow = (section: BarangDetailSection, rowIndex: number) => {
    const map: Record<BarangDetailSection, keyof Pick<FormState, "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      spesifikasi: "spesifikasi",
      dokumen: "barangDokumen",
      vd: "barangVd",
      tarif: "barangTarif",
      karantina: "karantina",
    };
    setFormState((current) => {
      const key = map[section];
      const rows = [...current[key]];
      rows.splice(rowIndex, 1);
      return { ...current, [key]: rows };
    });
  };

  const saveBarangWorkspace = () => {
    if (barangWorkspaceMode === "add") {
      if (!workspaceBarang) {
        setStatusMessage("Draft barang belum siap disimpan.");
        return;
      }
      const nextRow: Row = { ...workspaceBarang, Status: workspaceBarang.Status || "Perlu Dilengkapi" };
      setFormState((current) => ({ ...current, barang: [...current.barang, nextRow] }));
      setSelectedBarangSeri(nextRow.Seri || nextBarangSeri);
      setBarangWorkspaceMode("edit");
      setBarangDraftRow(null);
      setStatusMessage(`Barang seri ${nextRow.Seri || nextBarangSeri} ditambahkan.`);
    } else if (selectedBarangIndex >= 0) {
      updateRow("barang", selectedBarangIndex, "Status", "Lengkap");
      setStatusMessage(`Detail barang seri ${selectedBarangSeri} disimpan.`);
    } else {
      setStatusMessage("Detail barang belum bisa disimpan karena seri belum dipilih.");
    }
    setBarangWorkspaceOpen(false);
  };

  const openAddBarang = () => {
    const draftRow = createBlankBarangRow(nextBarangSeri);
    setBarangDraftRow(draftRow);
    setBarangWorkspaceMode("add");
    setSelectedBarangSeri(draftRow.Seri || nextBarangSeri);
    setBarangWorkspaceTab("data-barang");
    setBarangWorkspaceOpen(true);
  };

  const openEditBarang = (row: Row) => {
    setBarangWorkspaceMode("edit");
    setBarangDraftRow(null);
    setSelectedBarangSeri(row.Seri || "1");
    setBarangWorkspaceTab("data-barang");
    setBarangWorkspaceOpen(true);
  };

  const openImportExcel = () => {
    setImportExcelFileName("");
    setImportExcelStage("upload");
    setImportExcelOpen(true);
  };

  const startImportParsing = () => {
    if (!importExcelFileName) {
      setStatusMessage("Pilih file XLSX dulu untuk import barang.");
      return;
    }
    setImportExcelStage("parsing");
    window.setTimeout(() => setImportExcelStage("preview"), 700);
  };

  const replaceBarangData = () => {
    const importedRows = [
      createRow(barangMasterColumns, {
        Seri: "1",
        "HS Code": "8471.30.10",
        "Kode Barang": "BRG-IMP-001",
        Uraian: "Laptop Import Preview",
        Merek: "Lenovo",
        Tipe: "Notebook",
        "Negara Asal": "CN",
        "Jumlah Satuan": "8",
        "Berat Bersih": "820",
        Status: "Perlu Dilengkapi",
      }),
      createRow(barangMasterColumns, {
        Seri: "2",
        "HS Code": "8504.40.90",
        "Kode Barang": "BRG-IMP-002",
        Uraian: "Adapter Import Preview",
        Merek: "Generic",
        Tipe: "Adapter",
        "Negara Asal": "SG",
        "Jumlah Satuan": "20",
        "Berat Bersih": "90",
        Status: "Perlu Dilengkapi",
      }),
    ];
    setFormState((current) => ({
      ...current,
      barang: importedRows,
      spesifikasi: [],
      barangDokumen: [],
      barangVd: [],
      barangTarif: [],
      karantina: [],
    }));
    setSelectedBarangSeri("1");
    setBarangWorkspaceMode("edit");
    setBarangDraftRow(null);
    setImportExcelOpen(false);
    setStatusMessage("Data barang mock berhasil diganti dari hasil import Excel.");
  };

  const clearBarangData = () => {
    setFormState((current) => ({
      ...current,
      barang: [],
      spesifikasi: [],
      barangDokumen: [],
      barangVd: [],
      barangTarif: [],
      karantina: [],
    }));
    setSelectedBarangSeri("1");
    setBarangWorkspaceMode("edit");
    setBarangDraftRow(null);
    setClearBarangOpen(false);
    setStatusMessage("Seluruh data barang dan child data sudah dihapus.");
  };

  const importPreviewRows: Array<{ no: number; hsCode: string; nama: string; jumlah: string; negara: string; berat: string; status: string }> = [
    { no: 1, hsCode: "8471.30.10", nama: "Laptop Lenovo ThinkPad", jumlah: "10", negara: "CN", berat: "950", status: "Selesai" },
    { no: 2, hsCode: "8504.40.90", nama: "Power Adapter", jumlah: "20", negara: "SG", berat: "120", status: "Perlu Cek" },
    { no: 3, hsCode: "8473.30.99", nama: "Docking Station", jumlah: "5", negara: "MY", berat: "45", status: "Selesai" },
  ];

  const removeRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, columns: string[]) => {
    setFormState((current) => {
      const rows = current[section].length > 1 ? current[section].slice(0, -1) : [createRow(columns)];
      return { ...current, [section]: rows };
    });
  };

  const updatePengajuanField = (key: string, value: string) => {
    setFormState((current) => ({
      ...current,
      pengajuan: {
        ...current.pengajuan,
        [key]: value,
      },
    }));
  };

  const updateEntityField = (kind: EntityKind, column: string, value: string) => {
    const entityTitle = entityDefinitionMap[kind].title;
    setFormState((current) => {
      const rowIndex = current.entitas.findIndex((row) => row["Jenis Entitas"] === entityTitle);
      if (rowIndex < 0) return current;
      const rows = [...current.entitas];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };
      return { ...current, entitas: rows };
    });
  };

  const saveSnapshot = () => {
    const snapshot: StoredFormState = {
      draft,
      formState,
    };
    sessionStorage.setItem(BC20_FORM_STORAGE_KEY, JSON.stringify(snapshot));
    setStatusMessage("Draft form disimpan lokal di browser.");
  };

  const submitForm = () => {
    saveSnapshot();
    setStatusMessage("Pengajuan mock berhasil disubmit. Silakan lanjut integrasi backend.");
  };

  const activeStepLabel = wizardSteps.find((step) => step.id === activeStep)?.label ?? "Pengajuan";
  const handleCheckCompleteness = () => {
    const currentIndex = formStepOrder.indexOf(activeStep);
    const stepKey = currentIndex >= 0 ? formStepOrder[currentIndex] : "pengajuan";
    if (stepKey === "review") {
      setStatusMessage(reviewStatus ? "Review sudah siap submit." : "Masih ada data mandatory yang belum lengkap.");
      return;
    }

    setStatusMessage(stepComplete[stepKey] ? "Step ini sudah lengkap." : "Masih ada field mandatory yang harus dilengkapi.");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-3 py-4 sm:px-4 sm:py-5">
      <section className="rounded-2xl bg-gradient-to-br from-brand-primary-500 via-[#03306f] to-[#0756a7] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">Smart Draft dari Smart Submission Assistant</span>
        </div>
        <div className="mt-3 max-w-5xl text-[13px] leading-6 text-white/92">
          Data berikut diisi otomatis berdasarkan hasil percakapan dan dokumen yang dianalisis. Pengguna tetap dapat melakukan koreksi sebelum submit.
        </div>
      </section>

      <section className={`${sectionTone} p-4 pb-6 sm:p-5 sm:pb-7`}>
        <div className="flex flex-col gap-3 border-b border-border-primary pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Form BC 2.0</div>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-neutral-800">Form Pengajuan BC 2.0</h1>
            <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
              Wizard non-linear. Klik step mana pun untuk berpindah kategori, lalu edit block field di dalam accordion.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
              Sumber data: {getSourceLabel(source)}
            </div>
            {sourceNotice && (
              <div className="mt-2 inline-flex items-center rounded-full border border-brand-primary-100 bg-brand-primary-50/60 px-3 py-1 text-[12px] font-medium text-brand-primary-800">
                {sourceNotice}
              </div>
            )}
          </div>
          <div className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
            {activeStepLabel}
          </div>
        </div>

      <div className="mt-4 rounded-2xl border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="overflow-x-auto pb-1 pt-2">
          <div className="relative flex min-w-[920px] items-start pt-1">
              {wizardSteps.map((step, index) => {
                const active = step.id === activeStep;
                const done = step.id === "review" ? reviewStatus : stepComplete[step.id];
                const isLast = index === wizardSteps.length - 1;
                return (
                  <div key={step.id} className="relative flex flex-1 items-start">
                    {!isLast && (
                      <div
                        className={[
                          "absolute left-[calc(50%+24px)] top-[18px] h-px w-[calc(100%-48px)]",
                          done ? "bg-brand-primary-500/70" : "bg-border-primary",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-2 text-center transition-transform hover:-translate-y-0.5"
                    >
                      <span
                        className={[
                          "relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-semibold shadow-sm transition-colors",
                          active
                            ? "border-brand-primary-500 bg-brand-primary-500 text-white"
                            : done
                              ? "border-brand-primary-500 bg-brand-primary-50 text-brand-primary-600"
                              : "border-border-primary bg-background-primary text-neutral-500",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {done ? <CheckIcon /> : step.id === "pengajuan" ? "1" : step.id === "entitas" ? "2" : step.id === "dokumen" ? "3" : step.id === "kemasan" ? "4" : step.id === "barang" ? "5" : "6"}
                      </span>
                      <span className="min-w-0">
                        <span className={["block text-[12px] font-semibold", active || done ? "text-brand-primary-700" : "text-neutral-700"].filter(Boolean).join(" ")}>
                          {step.label}
                        </span>
                        <span className="mt-1 block text-[10px] leading-4 text-neutral-500">{step.description}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

        <div className="mt-4 rounded-2xl border border-border-primary bg-background-primary/30 px-4 py-3 text-[12px] text-neutral-700">
          {statusMessage}
        </div>
        <div className="my-5 border-t border-border-primary" />

        {activeStep === "pengajuan" && (
        <div className="flex flex-col gap-4">
          {stepFieldGroups.map((group) => (
            <AccordionCard key={group.id} title={group.title} subtitle="Edit field secara langsung di bawah ini." defaultOpen>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.fields.map((field) => (
                  <FormField
                    key={field.key}
                    label={field.label}
                    value={formState.pengajuan[field.key] ?? ""}
                    onChange={(value) => updatePengajuanField(field.key, value)}
                    placeholder={field.label}
                    type={field.key === "perkiraanTanggalTiba" ? "date" : "text"}
                    mandatory={"mandatory" in field ? Boolean(field.mandatory) : false}
                  />
                ))}
              </div>
            </AccordionCard>
          ))}
          <StepFooterActions
            step="pengajuan"
            onPrevious={() => setActiveStep(goToStep("pengajuan", -1))}
            onCheck={handleCheckCompleteness}
            onNext={() => setActiveStep(goToStep("pengajuan", 1))}
          />
        </div>
        )}

      {activeStep === "entitas" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 border-b border-border-primary pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Profil Pelaku Usaha</div>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-neutral-800">Entitas</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                  Isi profil masing-masing pelaku usaha yang terlibat dalam pengajuan. Setiap card mewakili satu entitas bisnis, bukan baris tabel.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {entityOrder.map((kind) => {
                const entity = entityDefinitionMap[kind];
                const entityRow = formState.entitas.find((row) => row["Jenis Entitas"] === entity.title);
                if (!entityRow) return null;
                const Icon = entity.icon;
                const wideCard = kind === "importir";

                return (
                  <div key={kind} className={wideCard ? "lg:col-span-2" : ""}>
                    <AccordionCard
                      title={entity.title}
                      subtitle={entity.description}
                      defaultOpen={entity.defaultOpen ?? false}
                      badge={{ label: entity.badge, tone: entity.badge === "Wajib" ? "brand" : "neutral" }}
                      leadingIcon={<Icon className="h-5 w-5" />}
                    >
                      <EntityCardContent entity={entity} row={entityRow} onChange={(column, value) => updateEntityField(kind, column, value)} />
                    </AccordionCard>
                  </div>
                );
              })}
            </div>
          </div>

          <StepFooterActions
            step="entitas"
            onPrevious={() => setActiveStep(goToStep("entitas", -1))}
            onCheck={handleCheckCompleteness}
            onNext={() => setActiveStep(goToStep("entitas", 1))}
          />
        </div>
      )}

      {activeStep === "dokumen" && (
        <div className="flex flex-col gap-4">
        <AccordionCard title="Dokumen Pengajuan" subtitle="Daftar dokumen yang dilampirkan pada BC 2.0." defaultOpen>
          <EditableTable
            columns={dokumenColumns}
            rows={formState.dokumen}
            onChange={(rowIndex, column, value) => updateRow("dokumen", rowIndex, column, value)}
            onAdd={() => addRow("dokumen", dokumenColumns)}
            onRemove={() => removeRow("dokumen", dokumenColumns)}
            minWidth={1100}
          />
        </AccordionCard>
        <StepFooterActions
          step="dokumen"
          onPrevious={() => setActiveStep(goToStep("dokumen", -1))}
          onCheck={handleCheckCompleteness}
          onNext={() => setActiveStep(goToStep("dokumen", 1))}
        />
        </div>
      )}

      {activeStep === "kemasan" && (
        <div className="flex flex-col gap-4">
          <AccordionCard title="Kemasan" subtitle="Editable table data kemasan." defaultOpen>
            <EditableTable
              columns={kemasanColumns}
              rows={formState.kemasan}
              onChange={(rowIndex, column, value) => updateRow("kemasan", rowIndex, column, value)}
              onAdd={() => addRow("kemasan", kemasanColumns)}
              onRemove={() => removeRow("kemasan", kemasanColumns)}
              minWidth={900}
            />
          </AccordionCard>
          <AccordionCard title="Kontainer" subtitle="Editable table data kontainer." defaultOpen>
            <EditableTable
              columns={kontainerColumns}
              rows={formState.kontainer}
              onChange={(rowIndex, column, value) => updateRow("kontainer", rowIndex, column, value)}
              onAdd={() => addRow("kontainer", kontainerColumns)}
              onRemove={() => removeRow("kontainer", kontainerColumns)}
              minWidth={1100}
            />
          </AccordionCard>
          <StepFooterActions
            step="kemasan"
            onPrevious={() => setActiveStep(goToStep("kemasan", -1))}
            onCheck={handleCheckCompleteness}
            onNext={() => setActiveStep(goToStep("kemasan", 1))}
          />
        </div>
      )}

      {activeStep === "barang" && (
        <div className="flex flex-col gap-4">
          <section className={`${sectionTone} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 border-b border-border-primary pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Step Barang</div>
                <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Daftar Barang</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                  Step ini hanya menampilkan tabel utama. Detail turunan tiap seri dikelola lewat drawer kanan melalui tombol Kelola Detail.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                  {formState.barang.length} barang
                </span>
                <span className="rounded-full bg-background-primary px-3 py-1 text-[12px] font-semibold text-neutral-700">
                  Child data per seri
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="primary" size="sm" startIcon={<PlusIcon />} onClick={openAddBarang}>
                Tambah Barang
              </Button>
              <Button variant="outline" size="sm" onClick={openImportExcel}>
                Import Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusMessage("Download template barang masih placeholder.")}>
                Download Template
              </Button>
              <Button variant="error" size="sm" onClick={() => setClearBarangOpen(true)}>
                Clear Data
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border-primary">
              <table className="min-w-full table-fixed border-collapse text-left text-[12px]">
                <thead className="bg-brand-primary-500 text-white">
                  <tr>
                    {barangMasterColumns.map((column) => (
                      <th key={column} className="px-3 py-3 font-semibold whitespace-nowrap">
                        {column}
                      </th>
                    ))}
                    <th className="w-[140px] px-3 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formState.barang.map((row, rowIndex) => (
                    <tr key={row.Seri || rowIndex} className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                      {barangMasterColumns.map((column) => {
                        if (column === "Status") {
                          return (
                            <td key={column} className="px-3 py-3">
                              <MiniStatusPill value={row.Status || "Perlu Validasi"} />
                            </td>
                          );
                        }
                        return (
                          <td key={column} className="px-3 py-3 text-neutral-700">
                            {row[column] || "-"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={<PenNewSquareIcon className="h-4 w-4" />}
                          onClick={() => openEditBarang(row)}
                        >
                          Kelola Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-border-primary bg-background-primary/30 p-4 text-[12px] text-neutral-700">
              Child data seperti spesifikasi, dokumen, VD, tarif, dan karantina sekarang melekat pada barang seri yang dipilih.
            </div>
          </section>

          <StepFooterActions
            step="barang"
            onPrevious={() => setActiveStep(goToStep("barang", -1))}
            onCheck={handleCheckCompleteness}
            onNext={() => setActiveStep(goToStep("barang", 1))}
          />

          <BarangWorkspaceDrawer
            open={barangWorkspaceOpen}
            item={workspaceBarang}
            mode={barangWorkspaceMode}
            activeTab={barangWorkspaceTab}
            onTabChange={setBarangWorkspaceTab}
            onClose={() => {
              setBarangWorkspaceOpen(false);
              setBarangWorkspaceMode("edit");
              setBarangDraftRow(null);
            }}
            onSave={saveBarangWorkspace}
            onUpdateMasterField={updateBarangField}
            detailRows={selectedBarangDetailRows}
            onAddDetailRow={addBarangDetailRow}
            onRemoveDetailRow={removeBarangDetailRow}
            onUpdateDetailRow={updateBarangDetailRow}
          />
        </div>
      )}

      {activeStep === "review" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Status Kelengkapan" value={reviewStatus ? "Lengkap" : "Perlu Koreksi"} />
            <SummaryCard label="Jumlah Entitas" value={summaryCounts.entitas} />
            <SummaryCard label="Jumlah Dokumen" value={summaryCounts.dokumen} />
            <SummaryCard label="Jumlah Barang" value={summaryCounts.barang} />
            <SummaryCard label="Jumlah Kontainer" value={summaryCounts.kontainer} />
          </div>

          <div className={`${sectionTone} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Ringkasan Akhir</div>
                <h2 className="mt-1 text-[18px] font-semibold text-neutral-800">Review & Submit</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                  Cek kembali ringkasan data utama sebelum menyimpan draft atau mengirim pengajuan mock.
                </p>
              </div>
              <div className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                {reviewStatus ? "Siap submit" : "Ada data yang perlu dilengkapi"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border-primary bg-white p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Status Data</div>
                <ul className="mt-3 space-y-2 text-[12px] text-neutral-700">
                  <li className="flex items-center justify-between gap-3">
                    <span>Pengajuan</span>
                    <span className={stepComplete.pengajuan ? "font-semibold text-success-600" : "text-error-600"}>{stepComplete.pengajuan ? "Lengkap" : "Belum lengkap"}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Entitas</span>
                    <span className={stepComplete.entitas ? "font-semibold text-success-600" : "text-error-600"}>{stepComplete.entitas ? "Lengkap" : "Belum lengkap"}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Dokumen</span>
                    <span className={stepComplete.dokumen ? "font-semibold text-success-600" : "text-error-600"}>{stepComplete.dokumen ? "Lengkap" : "Belum lengkap"}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Kemasan & Kontainer</span>
                    <span className={stepComplete.kemasan ? "font-semibold text-success-600" : "text-error-600"}>{stepComplete.kemasan ? "Lengkap" : "Belum lengkap"}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Barang</span>
                    <span className={stepComplete.barang ? "font-semibold text-success-600" : "text-error-600"}>{stepComplete.barang ? "Lengkap" : "Belum lengkap"}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-brand-primary-100 bg-brand-primary-50/60 p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">Prefill Smart Draft</div>
                <div className="mt-3 space-y-2 text-[12px] text-neutral-700">
                  <div>
                    <span className="font-medium">Nama Perusahaan: </span>
                    {draft?.namaPerusahaan || importirRow?.["Nama Perusahaan"] || "PT Contoh Nusantara"}
                  </div>
                  <div>
                    <span className="font-medium">NPWP: </span>
                    {draft?.npwp || "01.234.567.8-999.000"}
                  </div>
                  <div>
                    <span className="font-medium">Jenis Pengajuan: </span>
                    {formState.pengajuan.jenisPib}
                  </div>
                  <div>
                    <span className="font-medium">Keterangan: </span>
                    {draft?.keterangan || "Pengajuan umum berdasarkan asistensi AI."}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setActiveStep(goToStep("review", -1))}>
                {"< sebelumnya"}
              </Button>
              <Button variant="outline" size="sm" onClick={saveSnapshot}>
                Simpan Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleCheckCompleteness}>
                Cek Kelengkapan
              </Button>
              <Button variant="primary" size="sm" onClick={submitForm}>
                Submit Pengajuan
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveStep("review")}>
                selanjutnya {">"}
              </Button>
            </div>
          </div>
        </div>
        )}

        <div className="mt-6 rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-[12px] text-neutral-600">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v6h5v2h-7V7h2Z" />
              </svg>
            </span>
            <span>Data tetap bisa diedit manual kapan saja. Semua perubahan masih mock/local dulu.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox label="Kirim notifikasi email" checked={notif} onChange={(event) => setNotif(event.target.checked)} />
            <Button variant="outline" size="sm" onClick={saveSnapshot}>
              Simpan Draft
            </Button>
          </div>
          </div>
        </div>

        <Modal
          open={importExcelOpen}
          title="Import Excel Barang"
          description="Upload XLSX lalu cek hasil parsing sebelum mengganti seluruh data barang."
          onClose={() => {
            setImportExcelOpen(false);
            setImportExcelFileName("");
            setImportExcelStage("upload");
          }}
          widthClassName="w-[min(96vw,1200px)]"
          panelClassName="max-h-[88vh] flex flex-col"
          bodyClassName="flex-1 overflow-y-auto"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportExcelOpen(false);
                  setImportExcelFileName("");
                  setImportExcelStage("upload");
                }}
              >
                Batal
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatusMessage("Template Excel Barang siap diunduh (placeholder).")}>
                  Download Template
                </Button>
                <Button variant="primary" size="sm" onClick={startImportParsing} disabled={!importExcelFileName || importExcelStage !== "upload"}>
                  Upload & Parse
                </Button>
                <Button variant="error" size="sm" onClick={replaceBarangData} disabled={importExcelStage !== "preview"}>
                  Replace Data
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
              <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className={["rounded-full px-3 py-1", importExcelStage === "upload" ? "bg-brand-primary-500 text-white" : "bg-brand-primary-50 text-brand-primary-700"].join(" ")}>Upload Excel</span>
                <span className={["rounded-full px-3 py-1", importExcelStage === "parsing" ? "bg-warning-500 text-white" : "bg-warning-50 text-warning-700"].join(" ")}>Parsing</span>
                <span className={["rounded-full px-3 py-1", importExcelStage === "preview" ? "bg-success-500 text-white" : "bg-success-50 text-success-700"].join(" ")}>Preview Hasil</span>
              </div>

              {importExcelStage === "upload" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-dashed border-border-primary bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Step 1</div>
                    <h4 className="mt-1 text-[18px] font-semibold text-neutral-800">Upload Excel</h4>
                    <p className="mt-2 text-[12px] leading-6 text-neutral-600">Support file XLSX. Gunakan template barang yang sudah disiapkan.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setStatusMessage("Template Excel Barang siap diunduh (placeholder).")}>
                        Download Template
                      </Button>
                      <span className="text-[12px] text-neutral-500">Belum ada file dipilih.</span>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setImportExcelFileName(file?.name ?? "");
                        if (file) setImportExcelStage("upload");
                      }}
                      className="mt-4 block w-full text-[12px] text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary-500 file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-border-primary bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Informasi Import</div>
                    <p className="mt-2 text-[12px] leading-6 text-neutral-600">
                      Import akan menggantikan seluruh data Barang beserta child data yang terkait:
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[12px] text-neutral-700">
                      <li>Spesifikasi Wajib</li>
                      <li>Dokumen Barang</li>
                      <li>Barang VD</li>
                      <li>Barang Tarif</li>
                      <li>Karantina</li>
                    </ul>
                  </div>
                </div>
              ) : importExcelStage === "parsing" ? (
                <div className="mt-4 rounded-2xl border border-warning-100 bg-warning-50 p-4">
                  <div className="text-[12px] font-semibold text-warning-700">Parsing...</div>
                  <p className="mt-2 text-[12px] leading-6 text-warning-700">Sistem sedang membaca file XLSX dan menyiapkan preview hasil import.</p>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="overflow-hidden rounded-2xl border border-border-primary">
                    <table className="min-w-full table-fixed border-collapse text-left text-[12px]">
                      <thead className="bg-brand-primary-500 text-white">
                        <tr>
                          <th className="w-[56px] px-3 py-2">No</th>
                          <th className="px-3 py-2">HS Code</th>
                          <th className="px-3 py-2">Nama Barang</th>
                          <th className="px-3 py-2">Jumlah</th>
                          <th className="px-3 py-2">Negara Asal</th>
                          <th className="px-3 py-2">Berat</th>
                          <th className="px-3 py-2">Status Parsing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewRows.map((row) => (
                          <tr key={row.no} className="border-t border-border-primary">
                            <td className="px-3 py-2 font-medium text-neutral-600">{row.no}</td>
                            <td className="px-3 py-2">{row.hsCode}</td>
                            <td className="px-3 py-2">{row.nama}</td>
                            <td className="px-3 py-2">{row.jumlah}</td>
                            <td className="px-3 py-2">{row.negara}</td>
                            <td className="px-3 py-2">{row.berat}</td>
                            <td className="px-3 py-2">
                              <MiniStatusPill value={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/60 p-4 text-[12px] leading-6 text-brand-primary-800">
                    Import akan menggantikan seluruh data Barang beserta child data yang terkait.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          open={clearBarangOpen}
          title="Hapus seluruh data Barang?"
          description="Seluruh data Barang beserta detail turunannya akan dihapus."
          onClose={() => setClearBarangOpen(false)}
          bodyClassName="pt-0"
          footer={
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setClearBarangOpen(false)}>
                Batal
              </Button>
              <Button variant="error" size="sm" onClick={clearBarangData}>
                Hapus Semua
              </Button>
            </div>
          }
        >
          <div className="text-[12px] leading-6 text-neutral-600">
            Seluruh data barang beserta detail turunannya akan dihapus dari form sementara ini.
          </div>
        </Modal>
      </section>
    </div>
  );
}
