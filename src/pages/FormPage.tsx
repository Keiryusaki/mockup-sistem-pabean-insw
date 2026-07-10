import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "../components/Badge";
import { Button, IconButton } from "../components/Button";
import { Input, Select, Textarea } from "../components/FormControls";
import { Modal } from "../components/Surface";
import { Tooltip } from "../components/Tooltip";
import {
  AI_DRAFT_STORAGE_KEY,
  BC20_FORM_STORAGE_KEY,
  FORM_NOTICE_STORAGE_KEY,
  FORM_SOURCE_STORAGE_KEY,
} from "./dashboard/formSnapshotData";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckReadIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CopyIcon,
  CalendarIcon,
  DocumentsIcon,
  EyeIcon,
  HamburgerMenuIcon,
  MagniferIcon,
  PlainIcon,
  PencilIcon,
  Pen2Icon,
  RoundedMagniferIcon,
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

const wizardSteps: Array<{ id: WizardStepId; label: string; description: string }> = [
  { id: "pengajuan", label: "Pengajuan", description: "Header, transaksi, pengangkutan, dan pelabuhan." },
  { id: "entitas", label: "Entitas", description: "Data pelaku usaha dan identitas entitas." },
  { id: "dokumen", label: "Dokumen Lampiran", description: "Daftar dokumen pengajuan yang dilampirkan." },
  { id: "kemasan", label: "Kemasan & Kontainer", description: "Kemasan dan data kontainer pengiriman." },
  { id: "barang", label: "Barang", description: "Rincian barang, spesifikasi, dan tarif." },
  { id: "review", label: "Review & Submit", description: "Ringkasan akhir sebelum submit." },
];

const sectionTone = "rounded-2xl border border-border-primary bg-white shadow-sm";
const fieldTone =
  "h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100";
const tocStickyClass = "lg:sticky lg:top-[calc(var(--shell-sticky-top)+12px)] lg:self-start";
const tocShellClass =
  "flex flex-col rounded-2xl border border-border-primary bg-white shadow-sm lg:h-[calc(100vh-var(--shell-sticky-top)-36px)] lg:max-h-[calc(100vh-var(--shell-sticky-top)-36px)]";
const tocScrollClass = "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1";

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
  { id: "compliance-trq", title: "TRQ" },
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

type EntityKind = "pengusahaImportir" | "ppjk" | "penerima" | "pembeli" | "penanggungJawab" | "barangEksporLcl";
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
  readOnly?: boolean;
  disabled?: boolean;
  lookup?: boolean;
};
type EntityDefinition = {
  kind: EntityKind;
  title: string;
  description: string;
  icon: typeof BuildingsIcon;
  defaultOpen?: boolean;
  headerFields?: EntityFieldConfig[];
  bodyHeading?: string;
  toggle?: { key: string; label: string };
  fields: EntityFieldConfig[];
  requiredFields: string[];
  defaultValues: Row;
  emptyState: string;
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
  { label: "Perorangan", value: "PERORANGAN" },
  { label: "Badan Usaha", value: "BADAN USAHA" },
  { label: "Badan Hukum", value: "BADAN HUKUM" },
  { label: "Cabang", value: "CABANG" },
];

const entityDefinitions: EntityDefinition[] = [
  {
    kind: "pengusahaImportir",
    title: "Pengusaha",
    description: "Entitas utama pengaju. Beberapa data dapat terisi otomatis dari SSO atau NIB.",
    icon: BuildingsIcon,
    defaultOpen: true,
    bodyHeading: "Pengusaha",
    requiredFields: [
      "NIB",
      "No Identitas (16 Digit)",
      "6 Digit Terakhir NITKU",
      "Nama Perusahaan",
      "Provinsi",
      "Kota / Kabupaten",
      "Kecamatan",
      "Kode Pos",
      "RT / RW",
      "Telephone",
      "Email",
      "On Behalf",
      "Status",
      "Alamat",
    ],
    emptyState: "Data pengusaha / importir belum diisi.",
    defaultValues: {
      "Jenis Entitas": "Pengusaha",
      NIB: "9120100781919",
      "No Identitas (16 Digit)": "0027681030529000",
      "6 Digit Terakhir NITKU": "000000",
      "Nama Perusahaan": "DASINDO",
      Provinsi: "JAWA TENGAH",
      "Kota / Kabupaten": "KAB. PURBALINGGA",
      Kecamatan: "BOJONGSARI",
      "Kode Pos": "24352",
      "RT / RW": "-",
      Telephone: "+9712180861000",
      Email: "gunawan.septiyadi@kemenkeu.go.id",
      "On Behalf": "",
      Status: "PERORANGAN",
      Alamat: "DESA GEMBONG",
    },
    fields: [
      { key: "NIB", label: "NIB", placeholder: "Nomor Induk Berusaha", span: 1 },
      { key: "No Identitas (16 Digit)", label: "No Identitas (16 Digit)", placeholder: "16 digit identitas", span: 1, readOnly: true, disabled: true },
      { key: "6 Digit Terakhir NITKU", label: "6 Digit Terakhir NITKU", placeholder: "000000", span: 1, lookup: true },
      { key: "Nama Perusahaan", label: "Nama Perusahaan", placeholder: "Nama perusahaan", span: 1 },
      { key: "Provinsi", label: "Provinsi", placeholder: "Provinsi", span: 1 },
      { key: "Kota / Kabupaten", label: "Kota / Kabupaten", placeholder: "Kabupaten / kota", span: 1 },
      { key: "Kecamatan", label: "Kecamatan", placeholder: "Kecamatan", span: 1 },
      { key: "Kode Pos", label: "Kode Pos", placeholder: "Kode pos", span: 1 },
      { key: "RT / RW", label: "RT / RW", placeholder: "-", span: 1 },
      { key: "Telephone", label: "Telephone", placeholder: "Nomor telepon", span: 1 },
      { key: "Email", label: "Email", placeholder: "email@domain.com", span: 1 },
      { key: "On Behalf", label: "On Behalf", placeholder: "Atas nama / perwakilan", span: 2 },
      { key: "Status", label: "Status", type: "select", options: statusOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat lengkap", span: 3 },
    ],
  },
  {
    kind: "ppjk",
    title: "PPJK",
    description: "Gunakan bila pengurusan dilakukan melalui perantara kepabeanan.",
    icon: BriefcaseIcon,
    toggle: { key: "Menggunakan PPJK", label: "Menggunakan PPJK" },
    requiredFields: ["Nama PPJK", "Nomor PPJK", "NPWP / NITKU", "Alamat"],
    defaultValues: {
      "Jenis Entitas": "PPJK",
      "Menggunakan PPJK": "",
      "Nama PPJK": "",
      "Nomor PPJK": "",
      "NPWP / NITKU": "",
      Alamat: "",
    },
    fields: [
      { key: "Nama PPJK", label: "Nama PPJK", placeholder: "Nama perusahaan PPJK", span: 1 },
      { key: "Nomor PPJK", label: "Nomor PPJK", placeholder: "Nomor registrasi PPJK", span: 1 },
      { key: "NPWP / NITKU", label: "NPWP / NITKU", placeholder: "NPWP atau NITKU", span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat PPJK", span: 3 },
    ],
    emptyState: "PPJK belum diaktifkan pada pengajuan ini.",
  },
  {
    kind: "penerima",
    title: "Penerima",
    description: "Pihak penerima barang atau shipment.",
    icon: UserIcon,
    defaultOpen: true,
    requiredFields: ["Nama", "Alamat", "Negara"],
    defaultValues: {
      "Jenis Entitas": "Penerima",
      Nama: "testing",
      Alamat: "testing",
      Negara: "SG",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama penerima", span: 2 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat penerima", span: 3 },
    ],
    emptyState: "Data penerima belum diisi.",
  },
  {
    kind: "pembeli",
    title: "Pembeli",
    description: "Dapat disamakan dengan penerima jika datanya sama.",
    icon: DocumentsIcon,
    toggle: { key: "Sama dengan Penerima", label: "Sama dengan Penerima" },
    requiredFields: ["Nama", "Alamat", "Negara"],
    defaultValues: {
      "Jenis Entitas": "Pembeli",
      "Sama dengan Penerima": "Ya",
      Nama: "testing",
      Alamat: "testing",
      Negara: "SG",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama pembeli", span: 2 },
      { key: "Negara", label: "Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pembeli", span: 3 },
    ],
    emptyState: "Pembeli akan mengikuti data penerima.",
  },
  {
    kind: "penanggungJawab",
    title: "Penanggung Jawab",
    description: "Kontak utama yang menangani pengajuan dan tindak lanjut.",
    icon: UserIcon,
    requiredFields: ["Nama", "Jabatan", "Kota", "Kode Pos", "Email"],
    defaultValues: {
      "Jenis Entitas": "Penanggung Jawab",
      Nama: "testing",
      Jabatan: "test",
      Kota: "Kota Jakarta Selatan",
      "Kode Pos": "00000",
      Email: "testing@test.com",
      Keterangan: "test",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama penanggung jawab", span: 2, lookup: true },
      { key: "Jabatan", label: "Jabatan", placeholder: "Jabatan", span: 1 },
      { key: "Kota", label: "Kota", placeholder: "Kota", span: 1 },
      { key: "Kode Pos", label: "Kode Pos", placeholder: "Kode pos", span: 1 },
      { key: "Email", label: "Email", placeholder: "email@domain.com", span: 1 },
      { key: "Keterangan", label: "Keterangan", type: "textarea", placeholder: "Keterangan tambahan", span: 3 },
    ],
    emptyState: "Data penanggung jawab belum diisi.",
  },
  {
    kind: "barangEksporLcl",
    title: "Barang Ekspor Konsolidasi / LCL",
    description: "Aktifkan bila pengajuan melibatkan konsolidasi atau LCL.",
    icon: TruckIcon,
    toggle: { key: "Aktifkan Konsolidasi", label: "Gunakan Barang Ekspor Konsolidasi / LCL" },
    requiredFields: ["Jenis Konsolidasi", "Jumlah House", "Nomor House"],
    defaultValues: {
      "Jenis Entitas": "Barang Ekspor Konsolidasi / LCL",
      "Aktifkan Konsolidasi": "",
      "Jenis Konsolidasi": "",
      "Jumlah House": "",
      "Nomor House": "",
      Keterangan: "",
    },
    fields: [
      {
        key: "Jenis Konsolidasi",
        label: "Jenis Konsolidasi",
        type: "select",
        options: [
          { label: "LCL", value: "LCL" },
          { label: "FCL", value: "FCL" },
          { label: "Gabungan", value: "Gabungan" },
        ],
        span: 1,
      },
      { key: "Jumlah House", label: "Jumlah House", placeholder: "Jumlah house", span: 1 },
      { key: "Nomor House", label: "Nomor House", placeholder: "Nomor house", span: 1 },
      { key: "Keterangan", label: "Keterangan", type: "textarea", placeholder: "Keterangan tambahan", span: 3 },
    ],
    emptyState: "Barang ekspor konsolidasi belum diaktifkan.",
  },
];

const entityDefinitionMap = Object.fromEntries(entityDefinitions.map((definition) => [definition.kind, definition])) as Record<EntityKind, EntityDefinition>;

const entityOrder: EntityKind[] = ["pengusahaImportir", "ppjk", "penerima", "pembeli", "penanggungJawab", "barangEksporLcl"];

const stepFieldGroups = [
  {
    id: "header-pengajuan",
    title: "Header Pengajuan",
    icon: DocumentsIcon,
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
    icon: CopyIcon,
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
    icon: TruckIcon,
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
    icon: CalendarIcon,
    fields: [
      { key: "pelabuhanMuat", label: "Pelabuhan Muat" },
      { key: "pelabuhanTransit", label: "Pelabuhan Transit" },
      { key: "pelabuhanTujuan", label: "Pelabuhan Tujuan" },
      { key: "tempatTimbun", label: "Tempat Timbun", mandatory: true },
    ],
  },
] as const;

const dokumenColumns = ["Seri", "Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin"];
const mandatoryDokumenDefinitions = [
  { seri: "1", kode: "INV", placeholder: "surat_pengajuan_impor_v01.docx" },
  { seri: "2", kode: "PL", placeholder: "packing_list_mock.pdf" },
  { seri: "3", kode: "BL", placeholder: "bill_of_lading_mock.pdf" },
] as const;

const createDokumenLampiranRow = (definition: (typeof mandatoryDokumenDefinitions)[number], nomorDokumen?: string) =>
  createRow(dokumenColumns, {
    Seri: definition.seri,
    "Kode Dokumen": definition.kode,
    "Nomor Dokumen": nomorDokumen || definition.placeholder,
    Tanggal: "2026-06-30",
    "Kode Fasilitas": "-",
    "Kode Ijin": "-",
  });

const normalizeDokumenRows = (rows: Row[]) => {
  const mandatoryRows = mandatoryDokumenDefinitions.map((definition) => {
    const existing = rows.find((row) => row["Kode Dokumen"] === definition.kode);
    return existing ? createRow(dokumenColumns, { ...existing, Seri: definition.seri, "Kode Dokumen": definition.kode }) : createDokumenLampiranRow(definition);
  });
  const extraRows = rows.filter((row) => !mandatoryDokumenDefinitions.some((definition) => row["Kode Dokumen"] === definition.kode));
  return [...mandatoryRows, ...extraRows.map((row, index) => createRow(dokumenColumns, { ...row, Seri: row.Seri || String(index + mandatoryRows.length + 1) }))];
};

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
const isTruthyValue = (value?: string) => ["1", "true", "ya", "yes", "on"].includes((value ?? "").trim().toLowerCase());
const getSectionRow = (rows: Row[], title: string) => rows.find((row) => row["Jenis Entitas"] === title) ?? null;
const getSectionColumns = (definition: EntityDefinition) => [
  "Jenis Entitas",
  ...(definition.headerFields?.map((field) => field.key) ?? []),
  ...(definition.toggle ? [definition.toggle.key] : []),
  ...definition.fields.map((field) => field.key),
];
const isSectionComplete = (definition: EntityDefinition, row: Row | null, rows: Row[]) => {
  if (!row) return false;
  if (definition.toggle && !isTruthyValue(row[definition.toggle.key])) {
    return false;
  }

  if (definition.kind === "pembeli" && isTruthyValue(row["Sama dengan Penerima"])) {
    const penerima = getSectionRow(rows, "Penerima");
    return Boolean(penerima) && definition.requiredFields.every((field) => isMandatoryFilled(row[field] ?? ""));
  }

  return definition.requiredFields.every((field) => isMandatoryFilled(row[field] ?? ""));
};

const isSectionStarted = (definition: EntityDefinition, row: Row | null) => {
  if (!row) return false;
  if (definition.toggle && isTruthyValue(row[definition.toggle.key])) return true;
  return definition.fields.some((field) => isMandatoryFilled(row[field.key] ?? "")) || hasAnyValue(row);
};

const getSectionStatus = (definition: EntityDefinition, row: Row | null, rows: Row[]) => {
  if (!row) {
    return { label: "Belum Diisi", tone: "neutral" as const };
  }

  if (definition.toggle && !isTruthyValue(row[definition.toggle.key])) {
    return { label: "Belum Diisi", tone: "neutral" as const };
  }

  if (isSectionComplete(definition, row, rows)) {
    return { label: "Lengkap", tone: "success" as const };
  }

  if (isSectionStarted(definition, row)) {
    return { label: "Perlu Dilengkapi", tone: "warning" as const };
  }

  return { label: "Belum Diisi", tone: "neutral" as const };
};

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
  const documents = draft?.dokumen?.length ? draft.dokumen : mandatoryDokumenDefinitions.map((definition) => definition.placeholder);

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
    entitas: entityDefinitions.map((definition) =>
      createRow(
        ["Jenis Entitas", ...(definition.headerFields?.map((field) => field.key) ?? []), ...definition.fields.map((field) => field.key), ...(definition.toggle ? [definition.toggle.key] : [])],
        {
          ...definition.defaultValues,
          ...(definition.kind === "pengusahaImportir"
            ? {
                "Nama Perusahaan": companyName,
                "No Identitas (16 Digit)": npwp,
                NIB: nib,
              }
            : {}),
        },
      ),
    ),
    dokumen: normalizeDokumenRows([
      createDokumenLampiranRow(mandatoryDokumenDefinitions[0], documents[0]),
      createDokumenLampiranRow(mandatoryDokumenDefinitions[1], documents[1]),
      createDokumenLampiranRow(mandatoryDokumenDefinitions[2], documents[2]),
    ]),
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

const normalizeFormState = (state: FormState): FormState => ({
  ...state,
  dokumen: normalizeDokumenRows(state.dokumen),
});

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
  badge?: { label: string; tone?: "brand" | "neutral" | "error" | "success" | "warning" | "info" };
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
                        : badge.tone === "warning"
                          ? "bg-warning-100 text-warning-600"
                          : badge.tone === "info"
                            ? "bg-info-100 text-info-600"
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
  disabled = false,
  onLookup,
}: {
  field: EntityFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onLookup?: () => void;
}) {
  const widthClass = field.span === 3 ? "md:col-span-2 xl:col-span-3" : field.span === 2 ? "md:col-span-2" : "";
  const wrapperClass = ["flex flex-col gap-1.5", widthClass].filter(Boolean).join(" ");
  const isDisabled = disabled || field.readOnly || field.disabled;

  if (field.lookup) {
    return (
      <label className={wrapperClass}>
        <span className="text-[12px] font-medium text-neutral-700">{field.label}</span>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? field.label}
            readOnly={isDisabled}
            disabled={isDisabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLookup}
            disabled={disabled || field.disabled}
            className="whitespace-nowrap"
          >
            Cari
          </Button>
        </div>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        className={wrapperClass}
        label={field.label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder ?? field.label}
        rows={4}
        disabled={isDisabled}
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
        disabled={isDisabled}
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
      readOnly={isDisabled}
      disabled={isDisabled}
    />
  );
}

function EntityCardContent({
  entity,
  row,
  onChange,
  disabled = false,
  onLookup,
}: {
  entity: EntityDefinition;
  row: Row;
  onChange: (column: string, value: string) => void;
  disabled?: boolean;
  onLookup?: (field: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entity.fields.map((field) => (
        <EntityFieldRenderer
          key={field.key}
          field={field}
          value={row[field.key] ?? ""}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabled}
          onLookup={field.lookup ? () => onLookup?.(field.key) : undefined}
        />
      ))}
    </div>
  );
}

function EntitasCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 shadow-sm transition-colors hover:border-brand-primary-200 hover:bg-brand-primary-50/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border-primary text-brand-primary-600 focus:ring-brand-primary-100"
      />
      <span className="whitespace-nowrap">{label}</span>
    </label>
  );
}

function EntitasSectionNote({ text }: { text: string }) {
  return <div className="rounded-xl border border-border-primary bg-background-primary/40 px-4 py-3 text-[12px] leading-6 text-neutral-700">{text}</div>;
}

function SectionEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/20 px-4 py-4 text-[12px] leading-6 text-neutral-600">
      {text}
    </div>
  );
}

function SectionStatusBadge({ label, tone }: { label: string; tone: "brand" | "neutral" | "warning" | "success" | "error" | "info" }) {
  return (
    <Badge variant={tone === "neutral" ? "secondary" : tone === "brand" ? "brand" : tone} className="px-2.5 py-1 text-[10px] font-semibold">
      {label}
    </Badge>
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
  onAdd,
  onRemove,
  minWidth,
  columnWidths,
  showAddButton = true,
  editingRowIndex,
  editingRow,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  editTitle,
  editSubtitle,
}: {
  columns: string[];
  rows: Row[];
  onAdd: () => void;
  onRemove: (rowIndex: number) => void;
  minWidth?: number;
  columnWidths?: string[];
  showAddButton?: boolean;
  editingRowIndex?: number | null;
  editingRow?: Row | null;
  onEditStart?: (rowIndex: number) => void;
  onEditChange?: (column: string, value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  editTitle?: string;
  editSubtitle?: string;
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
              <th className="w-[92px] whitespace-nowrap px-3 py-2 sm:w-[176px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isEditing = editingRowIndex === rowIndex && Boolean(editingRow);
              return (
                <Fragment key={`${columns[0]}-${rowIndex}`}>
                  <tr className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                    <td className="px-3 py-3 font-medium text-neutral-600">{rowIndex + 1}</td>
                    {columns.map((column, index) => (
                      <td key={column} className="px-3 py-3 text-neutral-700" style={{ width: columnWidths?.[index] ?? (stretchToFill ? `${100 / columns.length}%` : undefined) }}>
                        {row[column] || <span className="text-neutral-400">-</span>}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <div className="flex flex-nowrap items-center justify-end gap-2">
                        <div className="flex items-center gap-2 sm:hidden">
                          <IconButton aria-label={`Edit baris ${rowIndex + 1}`} size="sm" variant="warning" onClick={() => onEditStart?.(rowIndex)}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton aria-label={`Hapus baris ${rowIndex + 1}`} size="sm" variant="error" onClick={() => onRemove(rowIndex)}>
                            <TrashBinTrashIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                        <div className="hidden items-center gap-2 sm:flex">
                          <Button variant="warning" size="sm" startIcon={<PencilIcon className="h-3.5 w-3.5" />} onClick={() => onEditStart?.(rowIndex)}>
                            Edit
                          </Button>
                          <Button variant="error" size="sm" onClick={() => onRemove(rowIndex)} startIcon={<TrashIcon />}>
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {isEditing && editingRow && onEditChange && onEditSave && onEditCancel ? (
                    <tr>
                      <td colSpan={columns.length + 2} className="border-t border-border-primary bg-background-primary/30 px-3 py-3">
                        <CompactSectionRowEditor
                          title={editTitle ?? "Edit Record"}
                          subtitle={editSubtitle}
                          columns={columns}
                          value={editingRow}
                          onChange={onEditChange}
                          onSave={onEditSave}
                          onCancel={onEditCancel}
                          saveLabel="Simpan Perubahan"
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAddButton ? (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onAdd} startIcon={<PlusIcon />}>
            Tambah Baris
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type BarangDetailSection = "spesifikasi" | "dokumen" | "vd" | "tarif" | "karantina";

function MiniStatusPill({ value }: { value: string }) {
  const variant =
    value === "Lengkap"
      ? "success"
      : value === "Perlu Dilengkapi"
        ? "warning"
        : value === "Perlu Validasi"
          ? "info"
          : value === "Belum Dicek"
            ? "secondary"
            : "error";

  return <Badge variant={variant}>{value}</Badge>;
}

function CompactEditableTable({
  columns,
  rows,
  onAdd,
  onRemove,
  emptyState,
  addLabel = "Tambah Baris",
  addFormOpen,
  addFormRow,
  onAddStart,
  onAddChange,
  onAddSave,
  onAddCancel,
  addFormTitle,
  addFormSubtitle,
  editingRowIndex,
  editingRow,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  editTitle,
  editSubtitle,
}: {
  columns: string[];
  rows: BarangSectionRow[];
  onAdd: () => void;
  onRemove: (rowIndex: number) => void;
  emptyState: string;
  addLabel?: string;
  addFormOpen?: boolean;
  addFormRow?: Row | null;
  onAddStart?: () => void;
  onAddChange?: (column: string, value: string) => void;
  onAddSave?: () => void;
  onAddCancel?: () => void;
  addFormTitle?: string;
  addFormSubtitle?: string;
  editingRowIndex?: number | null;
  editingRow?: Row | null;
  onEditStart?: (rowIndex: number) => void;
  onEditChange?: (column: string, value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  editTitle?: string;
  editSubtitle?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={onAddStart ?? onAdd} startIcon={<PlusIcon />}>
          {addLabel}
        </Button>
      </div>
      {addFormOpen && addFormRow && onAddChange && onAddSave && onAddCancel ? (
        <CompactSectionRowEditor
          title={addFormTitle ?? `Tambah ${addLabel}`}
          subtitle={addFormSubtitle}
          columns={columns}
          value={addFormRow}
          onChange={onAddChange}
          onSave={onAddSave}
          onCancel={onAddCancel}
          saveLabel="Simpan"
        />
      ) : null}
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
                <th className="w-[92px] whitespace-nowrap px-3 py-2 sm:w-[176px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, index }) => {
                const isEditing = editingRowIndex === index && Boolean(editingRow);
                return (
                  <Fragment key={`${index}-${columns[0]}`}>
                    <tr className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                      <td className="px-3 py-2 font-medium text-neutral-600">{index + 1}</td>
                      {columns.map((column) => (
                        <td key={column} className="px-3 py-2 text-neutral-700">
                          {row[column] || <span className="text-neutral-400">-</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex flex-nowrap items-center justify-end gap-2">
                          <div className="flex items-center gap-2 sm:hidden">
                          <IconButton aria-label={`Edit baris ${index + 1}`} size="sm" variant="warning" onClick={() => onEditStart?.(index)}>
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                            <IconButton aria-label={`Hapus baris ${index + 1}`} size="sm" variant="error" onClick={() => onRemove(index)}>
                              <TrashBinTrashIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                          <div className="hidden items-center gap-2 sm:flex">
                            <Button variant="warning" size="sm" startIcon={<PencilIcon className="h-3.5 w-3.5" />} onClick={() => onEditStart?.(index)}>
                              Edit
                            </Button>
                            <IconButton aria-label={`Hapus baris ${index + 1}`} size="sm" variant="error" onClick={() => onRemove(index)}>
                              <TrashBinTrashIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isEditing && editingRow && onEditChange && onEditSave && onEditCancel ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="border-t border-border-primary bg-background-primary/30 px-3 py-3">
                          <CompactSectionRowEditor
                            title={editTitle ?? "Edit Record"}
                            subtitle={editSubtitle}
                            columns={columns}
                            value={editingRow}
                            onChange={onEditChange}
                            onSave={onEditSave}
                            onCancel={onEditCancel}
                            saveLabel="Simpan Perubahan"
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/30 p-4 text-[12px] text-neutral-600">
          {emptyState}
        </div>
      )}
    </div>
  );
}

function DokumenLampiranEditor({
  title,
  subtitle,
  value,
  onChange,
  onSave,
  onCancel,
  saveLabel = "Simpan",
  codeLocked = false,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  value: Row;
  onChange: (column: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  codeLocked?: boolean;
  compact?: boolean;
}) {
  const [selectedFileName, setSelectedFileName] = useState(value["Nomor Dokumen"] ?? "");

  useEffect(() => {
    setSelectedFileName(value["Nomor Dokumen"] ?? "");
  }, [value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileName = file?.name ?? "";
    setSelectedFileName(fileName);
    onChange("Nomor Dokumen", fileName);
  };

  return (
    <div className={compact ? "rounded-xl border border-border-primary bg-background-primary/25 p-3" : "rounded-2xl border border-brand-primary-100 bg-brand-primary-50/30 p-4 shadow-sm"}>
      <div className={compact ? "flex flex-wrap items-start justify-between gap-2" : "flex flex-wrap items-start justify-between gap-3"}>
        <div className="min-w-0">
          <div className={compact ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600" : "text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600"}>{title}</div>
          {subtitle ? (
            <p className={compact ? "mt-1 max-w-3xl text-[11px] leading-5 text-neutral-600" : "mt-1 max-w-3xl text-[12px] leading-6 text-neutral-600"}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {!compact ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 shadow-sm">
            <DocumentsIcon className="h-3.5 w-3.5" />
            Form
          </span>
        ) : null}
      </div>

      <div className={compact ? "mt-3 rounded-xl border border-dashed border-border-primary bg-white/80 p-3" : "mt-4 rounded-2xl border border-dashed border-border-primary bg-white/80 p-4"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Input File</div>
            <div className="mt-1 text-[12px] leading-5 text-neutral-600">Pilih file lampiran, lalu nama file akan otomatis masuk ke kolom Nomor Dokumen.</div>
          </div>
          <span className="rounded-full bg-background-primary px-3 py-1 text-[11px] font-semibold text-neutral-600">
            {selectedFileName ? "File terpilih" : "Belum ada file"}
          </span>
        </div>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="mt-3 block w-full text-[12px] text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary-500 file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-white"
        />
        <div className="mt-2 text-[11px] text-neutral-500">{selectedFileName || "Nama file yang dipilih akan otomatis mengisi Nomor Dokumen."}</div>
      </div>

      <div className={compact ? "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3" : "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
        <Input
          label="Seri"
          value={value.Seri ?? ""}
          onChange={(event) => onChange("Seri", event.target.value)}
          placeholder="1"
          requiredMark
        />
        <Input
          label="Kode Dokumen"
          value={value["Kode Dokumen"] ?? ""}
          onChange={(event) => onChange("Kode Dokumen", event.target.value)}
          placeholder={codeLocked ? "INV" : "INV / PL / BL"}
          disabled={codeLocked}
          requiredMark
        />
        <Input
          label="Nomor Dokumen"
          value={value["Nomor Dokumen"] ?? selectedFileName ?? ""}
          onChange={() => void 0}
          placeholder="Nama file akan terisi otomatis"
          readOnly
          requiredMark
        />
        <Input
          label="Tanggal"
          value={value.Tanggal ?? ""}
          onChange={(event) => onChange("Tanggal", event.target.value)}
          type="date"
          requiredMark
        />
        <Input
          label="Kode Fasilitas"
          value={value["Kode Fasilitas"] ?? ""}
          onChange={(event) => onChange("Kode Fasilitas", event.target.value)}
          placeholder="-"
        />
        <Input
          label="Kode Ijin"
          value={value["Kode Ijin"] ?? ""}
          onChange={(event) => onChange("Kode Ijin", event.target.value)}
          placeholder="-"
        />
      </div>

      <div className={compact ? "mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border-primary pt-3" : "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border-primary pt-4"}>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} startIcon={<CheckReadIcon className="h-3.5 w-3.5" />}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

function CompactSectionRowEditor({
  title,
  subtitle,
  columns,
  value,
  onChange,
  onSave,
  onCancel,
  saveLabel = "Simpan",
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  value: Row;
  onChange: (column: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border-primary bg-background-primary/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">{title}</div>
          {subtitle ? <p className="mt-1 text-[11px] leading-5 text-neutral-600">{subtitle}</p> : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((column) => (
          <Input
            key={column}
            label={column}
            value={value[column] ?? ""}
            onChange={(event) => onChange(column, event.target.value)}
            placeholder={column}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border-primary pt-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} startIcon={<CheckReadIcon className="h-3.5 w-3.5" />}>
          {saveLabel}
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
  detailEditState,
  onStartDetailEdit,
  onUpdateDetailEdit,
  onSaveDetailEdit,
  onCancelDetailEdit,
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
  detailEditState: { section: BarangDetailSection; rowIndex: number; row: Row } | null;
  onStartDetailEdit: (section: BarangDetailSection, rowIndex: number, row: Row) => void;
  onUpdateDetailEdit: (column: string, value: string) => void;
  onSaveDetailEdit: () => void;
  onCancelDetailEdit: () => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [cooSource, setCooSource] = useState<"service" | "upload" | "none">("service");
  const [cooSearch, setCooSearch] = useState("");
  const [supportFiles, setSupportFiles] = useState<string[]>([]);
  const [detailAddState, setDetailAddState] = useState<{ section: BarangDetailSection; row: Row } | null>(null);
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
    setDetailAddState(null);
    onCancelDetailEdit();
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
  const detailDraftColumns: Record<BarangDetailSection, string[]> = {
    spesifikasi: spesifikasiColumns.slice(1),
    dokumen: barangDokumenColumns.slice(1),
    vd: barangVdColumns.slice(1),
    tarif: barangTarifColumns.slice(1),
    karantina: karantinaColumns.slice(1),
  };
  const detailAddLabels: Record<BarangDetailSection, string> = {
    spesifikasi: "Tambah Spesifikasi",
    dokumen: "Tambah Dokumen",
    vd: "Tambah VD",
    tarif: "Tambah Tarif",
    karantina: "Tambah Karantina",
  };
  const detailAddTitles: Record<BarangDetailSection, string> = {
    spesifikasi: "Tambah Spesifikasi",
    dokumen: "Tambah Dokumen Barang",
    vd: "Tambah Barang VD",
    tarif: "Tambah Barang Tarif",
    karantina: "Tambah Karantina",
  };
  const detailAddSubtitles: Record<BarangDetailSection, string> = {
    spesifikasi: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    dokumen: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    vd: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    tarif: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    karantina: "Isi data baru lalu simpan untuk menambah record ke tabel.",
  };

  const createDetailDraftRow = (section: BarangDetailSection, seriBarang: string) =>
    createRow(
      section === "spesifikasi"
        ? spesifikasiColumns
        : section === "dokumen"
          ? barangDokumenColumns
          : section === "vd"
            ? barangVdColumns
            : section === "tarif"
              ? barangTarifColumns
              : karantinaColumns,
      { "Seri Barang": seriBarang },
    );

  const startAddDetailRow = (section: BarangDetailSection) => {
    const seriBarang = item.Seri || "1";
    setDetailAddState({ section, row: createDetailDraftRow(section, seriBarang) });
    onCancelDetailEdit();
  };

  const updateAddDetailField = (column: string, value: string) => {
    setDetailAddState((current) => {
      if (!current) return current;
      return { ...current, row: { ...current.row, [column]: value } };
    });
  };

  const cancelAddDetailRow = () => {
    setDetailAddState(null);
  };

  const saveAddDetailRow = () => {
    if (!detailAddState) return;
    onAddDetailRow(detailAddState.section, detailAddState.row);
    setDetailAddState(null);
  };

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
                          onAdd={() => void 0}
                          onRemove={(rowIndex) => onRemoveDetailRow("spesifikasi", rowIndex)}
                          emptyState="Tidak ada spesifikasi wajib untuk barang ini."
                          addLabel={detailAddLabels.spesifikasi}
                          addFormOpen={detailAddState?.section === "spesifikasi"}
                          addFormRow={detailAddState?.section === "spesifikasi" ? detailAddState.row : null}
                          onAddStart={() => startAddDetailRow("spesifikasi")}
                          onAddChange={updateAddDetailField}
                          onAddSave={saveAddDetailRow}
                          onAddCancel={cancelAddDetailRow}
                          addFormTitle={detailAddTitles.spesifikasi}
                          addFormSubtitle={detailAddSubtitles.spesifikasi}
                          editingRowIndex={detailEditState?.section === "spesifikasi" ? detailEditState.rowIndex : null}
                          editingRow={detailEditState?.section === "spesifikasi" ? detailEditState.row : null}
                          onEditStart={(rowIndex) => {
                            setDetailAddState(null);
                            const target = detailRows.spesifikasi.find((item) => item.index === rowIndex);
                            if (target) onStartDetailEdit("spesifikasi", rowIndex, target.row);
                          }}
                          onEditChange={onUpdateDetailEdit}
                          onEditSave={onSaveDetailEdit}
                          onEditCancel={onCancelDetailEdit}
                          editTitle="Edit Spesifikasi"
                          editSubtitle="Ubah data spesifikasi lalu simpan."
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
                          onAdd={() => void 0}
                          onRemove={(rowIndex) => onRemoveDetailRow("dokumen", rowIndex)}
                          emptyState="Belum ada dokumen barang untuk seri ini."
                          addLabel={detailAddLabels.dokumen}
                          addFormOpen={detailAddState?.section === "dokumen"}
                          addFormRow={detailAddState?.section === "dokumen" ? detailAddState.row : null}
                          onAddStart={() => startAddDetailRow("dokumen")}
                          onAddChange={updateAddDetailField}
                          onAddSave={saveAddDetailRow}
                          onAddCancel={cancelAddDetailRow}
                          addFormTitle={detailAddTitles.dokumen}
                          addFormSubtitle={detailAddSubtitles.dokumen}
                          editingRowIndex={detailEditState?.section === "dokumen" ? detailEditState.rowIndex : null}
                          editingRow={detailEditState?.section === "dokumen" ? detailEditState.row : null}
                          onEditStart={(rowIndex) => {
                            setDetailAddState(null);
                            const target = detailRows.dokumen.find((item) => item.index === rowIndex);
                            if (target) onStartDetailEdit("dokumen", rowIndex, target.row);
                          }}
                          onEditChange={onUpdateDetailEdit}
                          onEditSave={onSaveDetailEdit}
                          onEditCancel={onCancelDetailEdit}
                          editTitle="Edit Dokumen Barang"
                          editSubtitle="Ubah data dokumen lalu simpan."
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
                          onAdd={() => void 0}
                          onRemove={(rowIndex) => onRemoveDetailRow("vd", rowIndex)}
                          emptyState="Belum ada data barang VD untuk seri ini."
                          addLabel={detailAddLabels.vd}
                          addFormOpen={detailAddState?.section === "vd"}
                          addFormRow={detailAddState?.section === "vd" ? detailAddState.row : null}
                          onAddStart={() => startAddDetailRow("vd")}
                          onAddChange={updateAddDetailField}
                          onAddSave={saveAddDetailRow}
                          onAddCancel={cancelAddDetailRow}
                          addFormTitle={detailAddTitles.vd}
                          addFormSubtitle={detailAddSubtitles.vd}
                          editingRowIndex={detailEditState?.section === "vd" ? detailEditState.rowIndex : null}
                          editingRow={detailEditState?.section === "vd" ? detailEditState.row : null}
                          onEditStart={(rowIndex) => {
                            setDetailAddState(null);
                            const target = detailRows.vd.find((item) => item.index === rowIndex);
                            if (target) onStartDetailEdit("vd", rowIndex, target.row);
                          }}
                          onEditChange={onUpdateDetailEdit}
                          onEditSave={onSaveDetailEdit}
                          onEditCancel={onCancelDetailEdit}
                          editTitle="Edit Barang VD"
                          editSubtitle="Ubah data VD lalu simpan."
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
                          onAdd={() => void 0}
                          onRemove={(rowIndex) => onRemoveDetailRow("tarif", rowIndex)}
                          emptyState="Belum ada data tarif untuk barang ini."
                          addLabel={detailAddLabels.tarif}
                          addFormOpen={detailAddState?.section === "tarif"}
                          addFormRow={detailAddState?.section === "tarif" ? detailAddState.row : null}
                          onAddStart={() => startAddDetailRow("tarif")}
                          onAddChange={updateAddDetailField}
                          onAddSave={saveAddDetailRow}
                          onAddCancel={cancelAddDetailRow}
                          addFormTitle={detailAddTitles.tarif}
                          addFormSubtitle={detailAddSubtitles.tarif}
                          editingRowIndex={detailEditState?.section === "tarif" ? detailEditState.rowIndex : null}
                          editingRow={detailEditState?.section === "tarif" ? detailEditState.row : null}
                          onEditStart={(rowIndex) => {
                            setDetailAddState(null);
                            const target = detailRows.tarif.find((item) => item.index === rowIndex);
                            if (target) onStartDetailEdit("tarif", rowIndex, target.row);
                          }}
                          onEditChange={onUpdateDetailEdit}
                          onEditSave={onSaveDetailEdit}
                          onEditCancel={onCancelDetailEdit}
                          editTitle="Edit Barang Tarif"
                          editSubtitle="Ubah data tarif lalu simpan."
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

                    <section id="compliance-trq" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">TRQ</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Input label="Nomor TRQ" value="TRQ-001" onChange={() => void 0} />
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
  onSaveDraft,
  onNext,
  showPrevious = true,
  showNext = true,
  saveDraftLabel,
  primaryLabel = "Selanjutnya",
  primaryStartIcon,
  primaryEndIcon = <ArrowRightIcon className="h-3.5 w-3.5" />,
}: {
  step: WizardStepId;
  onPrevious?: () => void;
  onCheck: () => void;
  onSaveDraft: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
  saveDraftLabel?: string;
  primaryLabel?: string;
  primaryStartIcon?: React.ReactNode;
  primaryEndIcon?: React.ReactNode;
}) {
  const stepLabelMap: Record<WizardStepId, string> = {
    pengajuan: "Pengajuan",
    entitas: "Entitas",
    dokumen: "Dokumen Lampiran",
    kemasan: "Kemasan",
    barang: "Barang",
    review: "Review",
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-primary pt-4">
      {showPrevious ? (
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!onPrevious} startIcon={<ArrowLeftIcon className="h-3.5 w-3.5" />}>
          Sebelumnya
        </Button>
      ) : (
        <span />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCheck} startIcon={<RoundedMagniferIcon className="h-3.5 w-3.5" />}>
          Cek Kelengkapan
        </Button>
        <Button variant="outline" size="sm" onClick={onSaveDraft} startIcon={<CheckReadIcon className="h-3.5 w-3.5" />}>
          {saveDraftLabel ?? `Simpan Draft ${stepLabelMap[step]}`}
        </Button>
        {showNext ? (
          <Button variant="primary" size="sm" onClick={onNext} disabled={!onNext} startIcon={primaryStartIcon} endIcon={primaryEndIcon}>
            {primaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FormPage() {
  const [draft, setDraft] = useState<AiSubmissionDraft | null>(null);
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState(null));
  const [activeStep, setActiveStep] = useState<WizardStepId>("pengajuan");
  const [source, setSource] = useState<FormSource | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Data bisa dikoreksi sebelum submit.");
  const [statusToastVisible, setStatusToastVisible] = useState(true);
  const [barangWorkspaceOpen, setBarangWorkspaceOpen] = useState(false);
  const [barangWorkspaceMode, setBarangWorkspaceMode] = useState<BarangWorkspaceMode>("edit");
  const [barangWorkspaceTab, setBarangWorkspaceTab] = useState<BarangWorkspaceTab>("data-barang");
  const [selectedBarangSeri, setSelectedBarangSeri] = useState<string>("1");
  const [barangDraftRow, setBarangDraftRow] = useState<Row | null>(null);
  const [dokumenAddOpen, setDokumenAddOpen] = useState(false);
  const [dokumenDraftRow, setDokumenDraftRow] = useState<Row | null>(null);
  const [dokumenEditIndex, setDokumenEditIndex] = useState<number | null>(null);
  const [dokumenEditRow, setDokumenEditRow] = useState<Row | null>(null);
  const [kemasanAddOpen, setKemasanAddOpen] = useState(false);
  const [kemasanDraftRow, setKemasanDraftRow] = useState<Row | null>(null);
  const [kemasanEditIndex, setKemasanEditIndex] = useState<number | null>(null);
  const [kemasanEditRow, setKemasanEditRow] = useState<Row | null>(null);
  const [kontainerAddOpen, setKontainerAddOpen] = useState(false);
  const [kontainerDraftRow, setKontainerDraftRow] = useState<Row | null>(null);
  const [kontainerEditIndex, setKontainerEditIndex] = useState<number | null>(null);
  const [kontainerEditRow, setKontainerEditRow] = useState<Row | null>(null);
  const [barangDetailEditState, setBarangDetailEditState] = useState<{
    section: BarangDetailSection;
    rowIndex: number;
    row: Row;
  } | null>(null);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
  const [importExcelFileName, setImportExcelFileName] = useState("");
  const [importExcelStage, setImportExcelStage] = useState<BarangImportStage>("upload");
  const [clearBarangOpen, setClearBarangOpen] = useState(false);
  const [activePengajuanSection, setActivePengajuanSection] = useState<string>(stepFieldGroups[0]?.id ?? "header-pengajuan");
  const [isPengajuanTocExpanded, setIsPengajuanTocExpanded] = useState(true);
  const [activeEntitasSection, setActiveEntitasSection] = useState<EntityKind>(entityDefinitions[0]?.kind ?? "pengusahaImportir");
  const [isEntitasTocExpanded, setIsEntitasTocExpanded] = useState(true);
  const pengajuanSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pengajuanScrollLockRef = useRef(false);
  const pengajuanScrollUnlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const entitasSectionRefs = useRef<Partial<Record<EntityKind, HTMLDivElement | null>>>({});
  const entitasScrollLockRef = useRef(false);
  const entitasScrollUnlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    if (!statusMessage) return;
    setStatusToastVisible(true);

    const timer = window.setTimeout(() => {
      setStatusToastVisible(false);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const savedForm = sessionStorage.getItem(BC20_FORM_STORAGE_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as StoredFormState;
        setDraft(parsed.draft ?? null);
        setFormState(normalizeFormState(parsed.formState ?? createInitialFormState(parsed.draft ?? null)));
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
      setFormState(normalizeFormState(createInitialFormState(parsed)));
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

  useEffect(() => {
    if (activeStep !== "pengajuan") return;
    const observedSections = stepFieldGroups
      .map((group) => ({ group, element: pengajuanSectionRefs.current[group.id] }))
      .filter((item): item is { group: (typeof stepFieldGroups)[number]; element: HTMLDivElement } => Boolean(item.element));

    if (!observedSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (pengajuanScrollLockRef.current) return;
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) return;

        const nextEntry =
          visibleEntries.find((entry) => entry.target.id === activePengajuanSection) ??
          visibleEntries.sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (nextEntry) {
          setActivePengajuanSection(nextEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-22% 0px -62% 0px",
        threshold: 0.01,
      },
    );

    observedSections.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [activePengajuanSection, activeStep]);

  useEffect(() => {
    if (activeStep !== "entitas") return;
    const observedSections = entityDefinitions
      .map((definition) => ({ definition, element: entitasSectionRefs.current[definition.kind] }))
      .filter((item): item is { definition: EntityDefinition; element: HTMLDivElement } => Boolean(item.element));

    if (!observedSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entitasScrollLockRef.current) return;
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) return;

        const nextEntry =
          visibleEntries.find((entry) => entry.target.id === activeEntitasSection) ??
          visibleEntries.sort(
            (left, right) => left.boundingClientRect.top - right.boundingClientRect.top,
          )[0];

        if (nextEntry) {
          setActiveEntitasSection(nextEntry.target.id as EntityKind);
        }
      },
      {
        root: null,
        rootMargin: "-22% 0px -62% 0px",
        threshold: 0.01,
      },
    );

    observedSections.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeEntitasSection, activeStep]);

  const entitasRowsByKind = useMemo(
    () =>
      Object.fromEntries(entityDefinitions.map((definition) => [definition.kind, getSectionRow(formState.entitas, definition.title)])) as Record<EntityKind, Row | null>,
    [formState.entitas],
  );

  const entitasSectionStatus = useMemo(
    () =>
      Object.fromEntries(
        entityDefinitions.map((definition) => [definition.kind, getSectionStatus(definition, entitasRowsByKind[definition.kind], formState.entitas)]),
      ) as Record<EntityKind, { label: string; tone: "brand" | "neutral" | "warning" | "success" | "error" | "info" }>,
    [entitasRowsByKind, formState.entitas],
  );

  const syncPembeliFromPenerima = (rows: Row[], penerimaRow: Row) => {
    const pembeliDefinition = entityDefinitionMap.pembeli;
    const pembeliIndex = rows.findIndex((row) => row["Jenis Entitas"] === pembeliDefinition.title);
    if (pembeliIndex < 0) return rows;

    const pembeliRow = rows[pembeliIndex];
    if (!isTruthyValue(pembeliRow["Sama dengan Penerima"])) return rows;

    rows[pembeliIndex] = {
      ...pembeliRow,
      Nama: penerimaRow.Nama ?? "",
      Alamat: penerimaRow.Alamat ?? "",
      Negara: penerimaRow.Negara ?? "",
    };
    return rows;
  };

  const stepComplete = useMemo(
    () => ({
      pengajuan: mandatoryPengajuanFields.every((key) => isMandatoryFilled(formState.pengajuan[key] ?? "")),
      entitas: entityDefinitions
        .filter((definition) => !definition.toggle || isTruthyValue(entitasRowsByKind[definition.kind]?.[definition.toggle.key]))
        .every((definition) => isSectionComplete(definition, entitasRowsByKind[definition.kind], formState.entitas)),
      dokumen:
        formState.dokumen.length >= mandatoryDokumenDefinitions.length &&
        mandatoryDokumenDefinitions.every(
          (definition, index) =>
            formState.dokumen[index]?.["Kode Dokumen"] === definition.kode &&
            dokumenColumns.every((column) => isMandatoryFilled(formState.dokumen[index]?.[column] ?? "")),
        ),
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
    [formState, entitasRowsByKind],
  );

  const reviewStatus = useMemo(() => {
    const sections = ["pengajuan", "entitas", "dokumen", "kemasan", "barang"] as const;
    return sections.every((section) => stepComplete[section]);
  }, [stepComplete]);

  const summaryCounts = useMemo(
    () => ({
      dokumen: countFilledRows(formState.dokumen),
      kemasan: countFilledRows(formState.kemasan),
      kontainer: countFilledRows(formState.kontainer),
      barang: countFilledRows(formState.barang),
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
    setBarangDetailEditState(null);
    setBarangWorkspaceOpen(true);
  };

  const openEditBarang = (row: Row) => {
    setBarangWorkspaceMode("edit");
    setBarangDraftRow(null);
    setSelectedBarangSeri(row.Seri || "1");
    setBarangWorkspaceTab("data-barang");
    setBarangDetailEditState(null);
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

  const createDokumenDraftRow = (seri = String(formState.dokumen.length + 1), base?: Row) =>
    createRow(dokumenColumns, {
      Seri: seri,
      "Kode Dokumen": "",
      "Nomor Dokumen": "",
      Tanggal: "2026-06-30",
      "Kode Fasilitas": "-",
      "Kode Ijin": "-",
      ...base,
    });

  const openDokumenAddForm = () => {
    setDokumenDraftRow(createDokumenDraftRow());
    setDokumenAddOpen(true);
  };

  const closeDokumenAddForm = () => {
    setDokumenAddOpen(false);
    setDokumenDraftRow(null);
  };

  const updateDokumenDraftField = (column: string, value: string) => {
    setDokumenDraftRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const saveDokumenDraftRow = () => {
    if (!dokumenDraftRow) return;
    if (!dokumenDraftRow["Nomor Dokumen"]) {
      setStatusMessage("Pilih file dokumen dulu sebelum menyimpan.");
      return;
    }
    setFormState((current) => ({
      ...current,
      dokumen: [...current.dokumen, createRow(dokumenColumns, dokumenDraftRow)],
    }));
    closeDokumenAddForm();
    setStatusMessage("Dokumen lampiran baru ditambahkan.");
  };

  const startEditDokumenRow = (rowIndex: number) => {
    setDokumenEditIndex(rowIndex);
    setDokumenEditRow(createRow(dokumenColumns, formState.dokumen[rowIndex] ?? createDokumenDraftRow(String(rowIndex + 1))));
    setDokumenAddOpen(false);
    setDokumenDraftRow(null);
  };

  const cancelEditDokumenRow = () => {
    setDokumenEditIndex(null);
    setDokumenEditRow(null);
  };

  const updateDokumenEditField = (column: string, value: string) => {
    setDokumenEditRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const saveDokumenEditRow = () => {
    if (dokumenEditIndex === null || !dokumenEditRow) return;
    setFormState((current) => {
      const rows = [...current.dokumen];
      rows[dokumenEditIndex] = createRow(dokumenColumns, dokumenEditRow);
      return { ...current, dokumen: rows };
    });
    cancelEditDokumenRow();
    setStatusMessage("Perubahan dokumen lampiran sudah disimpan.");
  };

  const removeDokumenRow = (rowIndex: number) => {
    if (rowIndex < mandatoryDokumenDefinitions.length) return;
    setFormState((current) => {
      const rows = [...current.dokumen];
      rows.splice(rowIndex, 1);
      return { ...current, dokumen: rows };
    });
    if (dokumenEditIndex === rowIndex) {
      cancelEditDokumenRow();
    } else if (dokumenEditIndex !== null && rowIndex < dokumenEditIndex) {
      setDokumenEditIndex((current) => (current === null ? current : current - 1));
    }
    setStatusMessage("Dokumen lampiran berhasil dihapus.");
  };

  const createCompactDraftRow = (section: "kemasan" | "kontainer", base?: Row) =>
    section === "kemasan"
      ? createRow(kemasanColumns, { Seri: String(formState.kemasan.length + 1), "Jenis Kemasan": "", Merek: "", ...base })
      : createRow(kontainerColumns, { Seri: String(formState.kontainer.length + 1), "Nomor Kontainer": "", Ukuran: "", "Jenis Muatan": "", Tipe: "", ...base });

  const openKemasanAddForm = () => {
    setKontainerAddOpen(false);
    setKontainerDraftRow(null);
    cancelEditKontainerRow();
    setKemasanDraftRow(createCompactDraftRow("kemasan"));
    setKemasanAddOpen(true);
  };

  const closeKemasanAddForm = () => {
    setKemasanAddOpen(false);
    setKemasanDraftRow(null);
  };

  const saveKemasanDraftRow = () => {
    if (!kemasanDraftRow) return;
    setFormState((current) => ({
      ...current,
      kemasan: [...current.kemasan, createRow(kemasanColumns, kemasanDraftRow)],
    }));
    closeKemasanAddForm();
    setStatusMessage("Record kemasan baru ditambahkan.");
  };

  const updateKemasanDraftField = (column: string, value: string) => {
    setKemasanDraftRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const startEditKemasanRow = (rowIndex: number) => {
    setKemasanEditIndex(rowIndex);
    setKemasanEditRow(createRow(kemasanColumns, formState.kemasan[rowIndex] ?? createCompactDraftRow("kemasan")));
    setKemasanAddOpen(false);
    setKemasanDraftRow(null);
  };

  const cancelEditKemasanRow = () => {
    setKemasanEditIndex(null);
    setKemasanEditRow(null);
  };

  const updateKemasanEditField = (column: string, value: string) => {
    setKemasanEditRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const saveKemasanEditRow = () => {
    if (kemasanEditIndex === null || !kemasanEditRow) return;
    setFormState((current) => {
      const rows = [...current.kemasan];
      rows[kemasanEditIndex] = createRow(kemasanColumns, kemasanEditRow);
      return { ...current, kemasan: rows };
    });
    cancelEditKemasanRow();
    setStatusMessage("Perubahan kemasan sudah disimpan.");
  };

  const openKontainerAddForm = () => {
    setKemasanAddOpen(false);
    setKemasanDraftRow(null);
    cancelEditKemasanRow();
    setKontainerDraftRow(createCompactDraftRow("kontainer"));
    setKontainerAddOpen(true);
  };

  const closeKontainerAddForm = () => {
    setKontainerAddOpen(false);
    setKontainerDraftRow(null);
  };

  const saveKontainerDraftRow = () => {
    if (!kontainerDraftRow) return;
    setFormState((current) => ({
      ...current,
      kontainer: [...current.kontainer, createRow(kontainerColumns, kontainerDraftRow)],
    }));
    closeKontainerAddForm();
    setStatusMessage("Record kontainer baru ditambahkan.");
  };

  const updateKontainerDraftField = (column: string, value: string) => {
    setKontainerDraftRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const startEditKontainerRow = (rowIndex: number) => {
    setKontainerEditIndex(rowIndex);
    setKontainerEditRow(createRow(kontainerColumns, formState.kontainer[rowIndex] ?? createCompactDraftRow("kontainer")));
    setKontainerAddOpen(false);
    setKontainerDraftRow(null);
  };

  const cancelEditKontainerRow = () => {
    setKontainerEditIndex(null);
    setKontainerEditRow(null);
  };

  const updateKontainerEditField = (column: string, value: string) => {
    setKontainerEditRow((current) => {
      if (!current) return current;
      return { ...current, [column]: value };
    });
  };

  const saveKontainerEditRow = () => {
    if (kontainerEditIndex === null || !kontainerEditRow) return;
    setFormState((current) => {
      const rows = [...current.kontainer];
      rows[kontainerEditIndex] = createRow(kontainerColumns, kontainerEditRow);
      return { ...current, kontainer: rows };
    });
    cancelEditKontainerRow();
    setStatusMessage("Perubahan kontainer sudah disimpan.");
  };

  const startEditBarangDetailRow = (section: BarangDetailSection, rowIndex: number, row: Row) => {
    const columnMap: Record<BarangDetailSection, string[]> = {
      spesifikasi: spesifikasiColumns.slice(1),
      dokumen: barangDokumenColumns.slice(1),
      vd: barangVdColumns.slice(1),
      tarif: barangTarifColumns.slice(1),
      karantina: karantinaColumns.slice(1),
    };
    setBarangDetailEditState({ section, rowIndex, row: createRow(columnMap[section], row) });
  };

  const cancelEditBarangDetailRow = () => {
    setBarangDetailEditState(null);
  };

  const updateBarangDetailEditField = (column: string, value: string) => {
    setBarangDetailEditState((current) => {
      if (!current) return current;
      return { ...current, row: { ...current.row, [column]: value } };
    });
  };

  const saveBarangDetailEditRow = () => {
    if (!barangDetailEditState) return;
    const { section, rowIndex, row } = barangDetailEditState;
    const map: Record<BarangDetailSection, keyof Pick<FormState, "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      spesifikasi: "spesifikasi",
      dokumen: "barangDokumen",
      vd: "barangVd",
      tarif: "barangTarif",
      karantina: "karantina",
    };
    const columnsMap: Record<BarangDetailSection, string[]> = {
      spesifikasi: spesifikasiColumns,
      dokumen: barangDokumenColumns,
      vd: barangVdColumns,
      tarif: barangTarifColumns,
      karantina: karantinaColumns,
    };
    setFormState((current) => {
      const key = map[section];
      const rows = [...current[key]];
      rows[rowIndex] = createRow(columnsMap[section], row);
      return { ...current, [key]: rows };
    });
    setBarangDetailEditState(null);
    setStatusMessage("Perubahan detail barang sudah disimpan.");
  };

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
    setFormState((current) => {
      const entityTitle = entityDefinitionMap[kind].title;
      const rowIndex = current.entitas.findIndex((row) => row["Jenis Entitas"] === entityTitle);
      if (rowIndex < 0) return current;
      const rows = [...current.entitas];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };

      if (kind === "penerima") {
        syncPembeliFromPenerima(rows, rows[rowIndex]);
      }

      if (kind === "pembeli" && column === "Sama dengan Penerima" && isTruthyValue(value)) {
        const penerimaRow = rows.find((row) => row["Jenis Entitas"] === entityDefinitionMap.penerima.title);
        if (penerimaRow) {
          rows[rowIndex] = {
            ...rows[rowIndex],
            Nama: penerimaRow.Nama ?? "",
            Alamat: penerimaRow.Alamat ?? "",
            Negara: penerimaRow.Negara ?? "",
            "Sama dengan Penerima": "Ya",
          };
        }
      }

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

  const scrollToEntitasSection = (kind: EntityKind) => {
    const target = entitasSectionRefs.current[kind];
    if (!target) return;

    entitasScrollLockRef.current = true;
    if (entitasScrollUnlockTimerRef.current) {
      window.clearTimeout(entitasScrollUnlockTimerRef.current);
    }
    setActiveEntitasSection(kind);
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    entitasScrollUnlockTimerRef.current = window.setTimeout(() => {
      entitasScrollLockRef.current = false;
    }, 650);
  };

  const scrollToPengajuanSection = (id: string) => {
    const target = pengajuanSectionRefs.current[id];
    if (!target) return;

    pengajuanScrollLockRef.current = true;
    if (pengajuanScrollUnlockTimerRef.current) {
      window.clearTimeout(pengajuanScrollUnlockTimerRef.current);
    }
    setActivePengajuanSection(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    pengajuanScrollUnlockTimerRef.current = window.setTimeout(() => {
      pengajuanScrollLockRef.current = false;
    }, 650);
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

        {statusToastVisible ? (
          <div className="mt-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/70 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] text-brand-primary-800">{statusMessage}</div>
              <Button variant="ghost" size="sm" onClick={() => setStatusToastVisible(false)} className="shrink-0 whitespace-nowrap">
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
        <div className="my-5 border-t border-border-primary" />

        {activeStep === "pengajuan" && (
        <div className="flex flex-col gap-4">
          <div
            className={[
              "grid gap-4",
              isPengajuanTocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]",
            ].join(" ")}
          >
            <aside className={tocStickyClass}>
              <div className={[tocShellClass, isPengajuanTocExpanded ? "p-4" : "p-2"].join(" ")}>
                <div className={["flex items-start gap-3", isPengajuanTocExpanded ? "justify-between" : "justify-center"].join(" ")}>
                  {isPengajuanTocExpanded ? (
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div>
                      <div className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section pengajuan yang ingin ditinjau.</div>
                    </div>
                  ) : (
                    <div className="sr-only">
                      <div>Table of Content</div>
                      <div>Lompat ke section pengajuan yang ingin ditinjau.</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPengajuanTocExpanded((value) => !value)}
                    aria-expanded={isPengajuanTocExpanded}
                    aria-label={isPengajuanTocExpanded ? "Ciutkan TOC pengajuan" : "Buka TOC pengajuan"}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50"
                    title={isPengajuanTocExpanded ? "Ciutkan TOC" : "Buka TOC"}
                  >
                    {isPengajuanTocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className={[tocScrollClass, "mt-4 flex flex-col gap-2", isPengajuanTocExpanded ? "" : "mt-3"].join(" ")}>
                  {stepFieldGroups.map((group) => {
                    const active = activePengajuanSection === group.id;
                    const Icon = group.icon;
                    if (isPengajuanTocExpanded) {
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => scrollToPengajuanSection(group.id)}
                          aria-label={group.title}
                          className={[
                            "group relative flex w-full items-start rounded-xl border text-left transition-colors",
                            "gap-3 px-3 py-3",
                            active
                              ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
                              : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/40",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-semibold text-neutral-800">{group.title}</span>
                            <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{group.fields.length} field</span>
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Tooltip
                        key={group.id}
                        placement="right"
                        offset={14}
                        className="block w-full"
                        content={
                          <div>
                            <div className="text-[12px] font-semibold text-neutral-800">{group.title}</div>
                            <div className="mt-1 text-[11px] leading-5 text-neutral-600">{group.fields.length} field pada section ini.</div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => scrollToPengajuanSection(group.id)}
                          aria-label={group.title}
                          className={[
                            "group relative flex w-full items-start rounded-xl border text-left transition-colors",
                            "justify-center px-2 py-3",
                            active
                              ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
                              : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/40",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex flex-col gap-4">
              {stepFieldGroups.map((group) => (
                <div
                  key={group.id}
                  ref={(node) => {
                    pengajuanSectionRefs.current[group.id] = node;
                  }}
                  id={group.id}
                  className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]"
                >
                  <AccordionCard title={group.title} subtitle="Edit field secara langsung di bawah ini." defaultOpen>
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
                </div>
              ))}
            </div>
          </div>
          <StepFooterActions
            step="pengajuan"
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(goToStep("pengajuan", 1))}
            showPrevious={false}
          />
        </div>
        )}

      {activeStep === "entitas" && (
        <div className="flex flex-col gap-4">
          <div
            className={[
              "grid gap-4",
              isEntitasTocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]",
            ].join(" ")}
          >
            <aside className={tocStickyClass}>
              <div className={[tocShellClass, isEntitasTocExpanded ? "p-4" : "p-2"].join(" ")}>
                <div className={["flex items-start gap-3", isEntitasTocExpanded ? "justify-between" : "justify-center"].join(" ")}>
                  {isEntitasTocExpanded ? (
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div>
                      <div className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section entitas yang ingin ditinjau.</div>
                    </div>
                  ) : (
                    <div className="sr-only">
                      <div>Table of Content</div>
                      <div>Lompat ke section entitas yang ingin ditinjau.</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEntitasTocExpanded((value) => !value)}
                    aria-expanded={isEntitasTocExpanded}
                    aria-label={isEntitasTocExpanded ? "Ciutkan TOC entitas" : "Buka TOC entitas"}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50"
                    title={isEntitasTocExpanded ? "Ciutkan TOC" : "Buka TOC"}
                  >
                    {isEntitasTocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className={[tocScrollClass, "mt-4 flex flex-col gap-2", isEntitasTocExpanded ? "" : "mt-3"].join(" ")}>
                  {entityDefinitions.map((definition) => {
                    const status = entitasSectionStatus[definition.kind];
                    const active = activeEntitasSection === definition.kind;
                    const Icon = definition.icon;

                    if (isEntitasTocExpanded) {
                      return (
                        <button
                          key={definition.kind}
                          type="button"
                          onClick={() => scrollToEntitasSection(definition.kind)}
                          aria-label={definition.title}
                          className={[
                            "group relative flex w-full items-start rounded-xl border text-left transition-colors",
                            "gap-3 px-3 py-3",
                            active
                              ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
                              : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/40",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-semibold text-neutral-800">{definition.title}</span>
                              <Badge
                                variant={status.tone === "neutral" ? "secondary" : status.tone === "brand" ? "brand" : status.tone}
                                className="px-2 py-0.5 text-[10px] font-semibold"
                              >
                                {status.label}
                              </Badge>
                            </span>
                            <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{definition.description}</span>
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Tooltip
                        key={definition.kind}
                        placement="right"
                        offset={14}
                        className="block w-full"
                        content={
                          <div>
                            <div className="text-[12px] font-semibold text-neutral-800">{definition.title}</div>
                            <div className="mt-1 text-[11px] leading-5 text-neutral-600">{definition.description}</div>
                            <div
                              className={[
                                "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                status.tone === "brand"
                                  ? "bg-brand-primary-50 text-brand-primary-700"
                                  : status.tone === "success"
                                    ? "bg-success-50 text-success-700"
                                    : status.tone === "warning"
                                      ? "bg-warning-50 text-warning-700"
                                      : status.tone === "error"
                                        ? "bg-error-50 text-error-700"
                                        : "bg-neutral-100 text-neutral-700",
                              ].join(" ")}
                            >
                              {status.label}
                            </div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => scrollToEntitasSection(definition.kind)}
                          aria-label={definition.title}
                          className={[
                            "group relative flex w-full items-start rounded-xl border text-left transition-colors",
                            "justify-center px-2 py-3",
                            active
                              ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
                              : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/40",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Profil Pelaku Usaha</div>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-neutral-800">Entitas</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                  Isi profil masing-masing pelaku usaha yang terlibat dalam pengajuan. Beberapa data dapat terisi otomatis dari SSO atau NIB dan tetap bisa ditinjau sebelum submit.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {entityDefinitions.map((definition) => {
                  const entityRow = entitasRowsByKind[definition.kind] ?? getSectionRow(formState.entitas, definition.title);
                  const status = entitasSectionStatus[definition.kind];
                  const Icon = definition.icon;
                  const isToggleActive = definition.toggle ? isTruthyValue(entityRow?.[definition.toggle.key]) : true;
                  const isPembeliSame = definition.kind === "pembeli" && isTruthyValue(entityRow?.["Sama dengan Penerima"]);
                  const isOptionalCollapsed = Boolean(definition.toggle) && !isToggleActive;

                  return (
                    <div
                      key={definition.kind}
                      id={definition.kind}
                      ref={(node) => {
                        entitasSectionRefs.current[definition.kind] = node;
                      }}
                      className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]"
                    >
                      <AccordionCard
                        title={definition.title}
                        subtitle={definition.description}
                        defaultOpen={definition.defaultOpen ?? false}
                        leadingIcon={<Icon className="h-5 w-5" />}
                        headerActions={<SectionStatusBadge label={status.label} tone={status.tone} />}
                      >
                        <div className="flex flex-col gap-4">
                          {definition.headerFields?.length ? (
                            <div className="flex flex-col gap-4">
                              <div className="grid grid-cols-1 gap-4 md:max-w-md">
                                {definition.headerFields.map((field) => (
                                  <EntityFieldRenderer
                                    key={field.key}
                                    field={field}
                                    value={entityRow?.[field.key] ?? field.placeholder ?? ""}
                                    onChange={(value) => updateEntityField(definition.kind, field.key, value)}
                                  />
                                ))}
                              </div>
                              <div className="border-t border-border-primary pt-4">
                                {definition.bodyHeading ? (
                                  <div className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-800">{definition.bodyHeading}</div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}

                          {definition.toggle ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-background-primary/25 px-4 py-3">
                              <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{definition.toggle.label}</div>
                                <div className="mt-1 text-[12px] leading-5 text-neutral-600">{isToggleActive ? "Section aktif dan siap diisi." : definition.emptyState}</div>
                              </div>
                              <EntitasCheckbox
                                label={definition.toggle.label}
                                checked={isToggleActive}
                                onChange={(checked) => {
                                  updateEntityField(definition.kind, definition.toggle!.key, checked ? "Ya" : "");
                                }}
                              />
                            </div>
                          ) : null}

                          {isOptionalCollapsed ? <SectionEmptyState text={definition.emptyState} /> : null}

                          {(!definition.toggle || isToggleActive) && !isOptionalCollapsed ? (
                            <>
                              {definition.kind === "pembeli" && isPembeliSame ? (
                                <EntitasSectionNote text="Data pembeli disamakan dengan penerima. Ubah ceklis bila ingin mengisi manual." />
                              ) : null}
                              <EntityCardContent
                                entity={definition}
                                row={entityRow ?? createRow(getSectionColumns(definition), definition.defaultValues)}
                                disabled={definition.kind === "pembeli" && isPembeliSame}
                                onChange={(column, value) => updateEntityField(definition.kind, column, value)}
                                onLookup={definition.kind === "penanggungJawab" ? () => setStatusMessage("Lookup penanggung jawab masih mock lokal.") : undefined}
                              />
                            </>
                          ) : null}
                        </div>
                      </AccordionCard>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <StepFooterActions
            step="entitas"
            onPrevious={() => setActiveStep(goToStep("entitas", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(goToStep("entitas", 1))}
          />
        </div>
      )}

      {activeStep === "dokumen" && (
        <div className="flex flex-col gap-4">
          <AccordionCard
            title="Dokumen Lampiran"
            subtitle="Tiga dokumen awal INV, PL, dan BL wajib tersedia. Record tambahan boleh ditambah dan dihapus."
            defaultOpen
            headerActions={
              <span className="rounded-full bg-brand-primary-50 px-3 py-1 text-[11px] font-semibold text-brand-primary-700">
                {formState.dokumen.length} record
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" startIcon={<PlusIcon />} onClick={openDokumenAddForm}>
                  Tambah
                </Button>
              </div>

              {dokumenAddOpen && dokumenDraftRow ? (
                <DokumenLampiranEditor
                  title="Tambah Dokumen Lampiran"
                  subtitle="Record baru akan muncul di bagian bawah tabel setelah disimpan."
                  value={dokumenDraftRow}
                  onChange={updateDokumenDraftField}
                  onSave={saveDokumenDraftRow}
                  onCancel={closeDokumenAddForm}
                  saveLabel="Simpan"
                  compact
                />
              ) : null}

              <div className="overflow-x-auto rounded-xl border border-border-primary">
                <table className="min-w-full table-fixed border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="w-[56px] px-3 py-2">#</th>
                      {dokumenColumns.map((column) => (
                        <th key={column} className="px-3 py-2 font-semibold whitespace-nowrap">
                          {column}
                        </th>
                      ))}
                      <th className="w-px whitespace-nowrap px-3 py-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formState.dokumen.map((row, rowIndex) => {
                      const isMandatoryRow = rowIndex < mandatoryDokumenDefinitions.length;
                      const isEditing = dokumenEditIndex === rowIndex && Boolean(dokumenEditRow);

                      return (
                        <Fragment key={`${row.Seri ?? rowIndex}-${row["Kode Dokumen"] ?? rowIndex}`}>
                          <tr
                            className={[
                              "border-t border-border-primary align-top",
                              isMandatoryRow ? "bg-brand-primary-50/10" : "hover:bg-brand-primary-50/20",
                            ].join(" ")}
                          >
                            <td className="px-3 py-3 font-medium text-neutral-600">{rowIndex + 1}</td>
                            {dokumenColumns.map((column) => (
                              <td key={column} className="px-3 py-3 align-top text-neutral-700">
                                <div className={column === "Kode Dokumen" && isMandatoryRow ? "inline-flex rounded-full bg-brand-primary-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary-700" : ""}>
                                  {row[column] || <span className="text-neutral-400">-</span>}
                                </div>
                              </td>
                            ))}
                            <td className="w-px whitespace-nowrap px-3 py-3">
                              <div className="flex flex-nowrap items-center justify-end gap-2">
                                <Button variant="warning" size="sm" startIcon={<PencilIcon className="h-3.5 w-3.5" />} onClick={() => startEditDokumenRow(rowIndex)}>
                                  Edit
                                </Button>
                                {!isMandatoryRow ? (
                                  <Button variant="error" size="sm" startIcon={<TrashBinTrashIcon className="h-3.5 w-3.5" />} onClick={() => removeDokumenRow(rowIndex)}>
                                    Hapus
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {isEditing && dokumenEditRow ? (
                            <tr>
                              <td colSpan={dokumenColumns.length + 2} className="border-t border-border-primary bg-background-primary/30 px-3 py-3">
                                <DokumenLampiranEditor
                                  title={`Edit Dokumen ${row["Kode Dokumen"] || rowIndex + 1}`}
                                  subtitle={
                                    isMandatoryRow
                                      ? "Dokumen wajib tidak bisa dihapus, tapi detailnya tetap bisa diperbarui."
                                      : "Perubahan akan langsung menggantikan record yang dipilih."
                                  }
                                  value={dokumenEditRow}
                                  onChange={updateDokumenEditField}
                                  onSave={saveDokumenEditRow}
                                  onCancel={cancelEditDokumenRow}
                                  saveLabel="Simpan Perubahan"
                                  codeLocked={isMandatoryRow}
                                  compact
                                />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </AccordionCard>
          <StepFooterActions
            step="dokumen"
            onPrevious={() => setActiveStep(goToStep("dokumen", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(goToStep("dokumen", 1))}
          />
        </div>
      )}

      {activeStep === "kemasan" && (
        <div className="flex flex-col gap-4">
          <AccordionCard
            title="Kemasan"
            subtitle="Data kemasan bisa ditambah lewat form collapsible agar area tabel tetap rapi."
            defaultOpen
            headerActions={
              <span className="rounded-full bg-brand-primary-50 px-3 py-1 text-[11px] font-semibold text-brand-primary-700">
                {formState.kemasan.length} record
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" startIcon={<PlusIcon />} onClick={openKemasanAddForm}>
                  Tambah
                </Button>
              </div>

              {kemasanAddOpen && kemasanDraftRow ? (
                <CompactSectionRowEditor
                  title="Tambah Kemasan"
                  subtitle="Isi field lalu simpan untuk menambah record baru."
                  columns={kemasanColumns}
                  value={kemasanDraftRow}
                  onChange={updateKemasanDraftField}
                  onSave={saveKemasanDraftRow}
                  onCancel={closeKemasanAddForm}
                  saveLabel="Simpan"
                />
              ) : null}

              <EditableTable
                columns={kemasanColumns}
                rows={formState.kemasan}
                onAdd={() => openKemasanAddForm()}
                onRemove={() => removeRow("kemasan", kemasanColumns)}
                minWidth={900}
                showAddButton={false}
                editingRowIndex={kemasanEditIndex}
                editingRow={kemasanEditRow}
                onEditStart={startEditKemasanRow}
                onEditChange={updateKemasanEditField}
                onEditSave={saveKemasanEditRow}
                onEditCancel={cancelEditKemasanRow}
                editTitle="Edit Kemasan"
                editSubtitle="Ubah data kemasan lalu simpan perubahan."
              />
            </div>
          </AccordionCard>
          <AccordionCard
            title="Kontainer"
            subtitle="Tambah record kontainer lewat toolbar, record lama tetap bisa diedit inline."
            defaultOpen
            headerActions={
              <span className="rounded-full bg-brand-primary-50 px-3 py-1 text-[11px] font-semibold text-brand-primary-700">
                {formState.kontainer.length} record
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" startIcon={<PlusIcon />} onClick={openKontainerAddForm}>
                  Tambah
                </Button>
              </div>

              {kontainerAddOpen && kontainerDraftRow ? (
                <CompactSectionRowEditor
                  title="Tambah Kontainer"
                  subtitle="Isi field lalu simpan untuk menambah record baru."
                  columns={kontainerColumns}
                  value={kontainerDraftRow}
                  onChange={updateKontainerDraftField}
                  onSave={saveKontainerDraftRow}
                  onCancel={closeKontainerAddForm}
                  saveLabel="Simpan"
                />
              ) : null}

              <EditableTable
                columns={kontainerColumns}
                rows={formState.kontainer}
                onAdd={() => openKontainerAddForm()}
                onRemove={() => removeRow("kontainer", kontainerColumns)}
                minWidth={1100}
                showAddButton={false}
                editingRowIndex={kontainerEditIndex}
                editingRow={kontainerEditRow}
                onEditStart={startEditKontainerRow}
                onEditChange={updateKontainerEditField}
                onEditSave={saveKontainerEditRow}
                onEditCancel={cancelEditKontainerRow}
                editTitle="Edit Kontainer"
                editSubtitle="Ubah data kontainer lalu simpan perubahan."
              />
            </div>
          </AccordionCard>
          <StepFooterActions
            step="kemasan"
            onPrevious={() => setActiveStep(goToStep("kemasan", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
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
                  variant="warning"
                  size="sm"
                  startIcon={<Pen2Icon className="h-4 w-4" />}
                  className="whitespace-nowrap"
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

          </section>

          <StepFooterActions
            step="barang"
            onPrevious={() => setActiveStep(goToStep("barang", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
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
              setBarangDetailEditState(null);
            }}
            onSave={saveBarangWorkspace}
            onUpdateMasterField={updateBarangField}
            detailRows={selectedBarangDetailRows}
            onAddDetailRow={addBarangDetailRow}
            onRemoveDetailRow={removeBarangDetailRow}
            onUpdateDetailRow={updateBarangDetailRow}
            detailEditState={barangDetailEditState}
            onStartDetailEdit={startEditBarangDetailRow}
            onUpdateDetailEdit={updateBarangDetailEditField}
            onSaveDetailEdit={saveBarangDetailEditRow}
            onCancelDetailEdit={cancelEditBarangDetailRow}
          />
        </div>
      )}

      {activeStep === "review" && (
        <div className="flex flex-col gap-4">
          <div className={`${sectionTone} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Ringkasan Akhir</div>
                <h2 className="mt-1 text-[18px] font-semibold text-neutral-800">Review & Submit</h2>
                <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                  Cek kembali ringkasan data utama sebelum menyimpan draft atau mengirim pengajuan mock.
                </p>
              </div>
              <div
                className="inline-flex"
              >
                <Badge
                  variant={reviewStatus ? "success" : "warning"}
                  startIcon={
                    reviewStatus ? (
                      <CheckReadIcon className="h-4 w-4" />
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M12 3 1.75 20h20.5L12 3Zm0 5.5 1 6h-2l1-6Zm0 10.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
                      </svg>
                    )
                  }
                  className="px-4 py-2 text-base font-semibold shadow-sm"
                >
                  {reviewStatus ? "Siap submit" : "Ada data yang perlu dilengkapi"}
                </Badge>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border-primary bg-background-primary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-brand-primary-600">Statistik Ringkas</div>
                  <div className="mt-1 text-[14px] font-semibold text-neutral-800">Jumlah data per alur utama</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Dokumen Lampiran" value={summaryCounts.dokumen} />
                <SummaryCard label="Kemasan" value={summaryCounts.kemasan} />
                <SummaryCard label="Kontainer" value={summaryCounts.kontainer} />
                <SummaryCard label="Barang" value={summaryCounts.barang} />
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
                    <span>Dokumen Lampiran</span>
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
                    {draft?.namaPerusahaan || entitasRowsByKind.pengusahaImportir?.["Nama Perusahaan"] || "PT Contoh Nusantara"}
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
          </div>

          <StepFooterActions
            step="review"
            onPrevious={() => setActiveStep(goToStep("review", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={submitForm}
            saveDraftLabel="Simpan Keseluruhan Draft"
            primaryLabel="Submit Pengajuan"
            primaryStartIcon={<PlainIcon className="h-3.5 w-3.5" />}
            primaryEndIcon={null}
          />
        </div>
        )}

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
