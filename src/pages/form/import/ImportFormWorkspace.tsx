import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "../../../components/Badge";
import { AnimatedDrawer } from "../../../components/AnimatedDrawer";
import { DrawerTocIcon, DrawerTocLayout } from "../../../components/DrawerTocLayout";
import { Button, IconButton } from "../../../components/Button";
import { Input, Select, Switch, Textarea } from "../../../components/FormControls";
import { Modal } from "../../../components/Surface";
import { Tooltip } from "../../../components/Tooltip";
import { Toast, inferToastTone } from "../../../components/Toast";
import { SectionStatusIconBadge, SectionStatusTextBadge, type SectionStatus } from "../../../components/SectionStatusIconBadge";
import { DemoFormSelector, FormDocumentHeader, FormStepFooterActions, FormStepper, SmartDraftBanner, type FormStepStatus } from "../../../components/FormWorkspaceShell";
import { ImportConfigurationDrawer } from "../../../form-config/import/ImportConfigurationDrawer";
import {
  cloneConfigFile,
  getDocumentConfig,
  resolveDocumentSteps,
} from "../../../form-config/shared/resolver";
import { FORM_CONFIG_ACCESS_EVENT, hasIntranetConfiguratorSession, isLocalConfiguratorHost } from "../../../form-config/shared/configurator-access";
import { initialImportConfigFile, readImportConfigDraft } from "../../../form-config/import/import-config";
import { importFormCatalog } from "../../../form-config/import/import-catalog";
import { loadPublishedFormConfig } from "../../../form-config/shared/config-provider";
import { assertValidFormOverrides } from "../../../form-config/shared/validation";
import type { DocumentConfigFile, FormDomain, ResolvedFieldConfig, ResolvedSectionConfig } from "../../../form-config/shared/types";
import {
  AI_DRAFT_STORAGE_KEY,
  BC20_FORM_STORAGE_KEY,
  FORM_NOTICE_STORAGE_KEY,
  FORM_SOURCE_STORAGE_KEY,
} from "../../dashboard/formSnapshotData";
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
} from "../../../components/Icons";

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
  barangCukai: Row[];
  spesifikasi: Row[];
  barangDokumen: Row[];
  barangVd: Row[];
  barangTarif: Row[];
  karantina: Row[];
  karantinaHewan: Row;
  karantinaIkan: Row;
  karantinaTumbuhan: Row;
};

type BarangWorkspaceTab = "data-barang" | "compliance";
type BarangWorkspaceMode = "edit" | "add";
type BarangImportStage = "upload" | "parsing" | "preview";
type BarangSectionRow = { row: Row; index: number };

type StoredFormState = {
  draft: AiSubmissionDraft | null;
  formState: FormState;
  documentType?: string;
  requiresQuarantine?: boolean;
};

const wizardSteps: Array<{ id: WizardStepId; label: string; description: string }> = [
  { id: "pengajuan", label: "Pengajuan", description: "Header, transaksi, pengangkutan, dan pelabuhan." },
  { id: "entitas", label: "Entitas", description: "Data pelaku usaha dan identitas entitas." },
  { id: "dokumen", label: "Dokumen Lampiran", description: "Daftar dokumen pengajuan yang dilampirkan." },
  { id: "kemasan", label: "Kemasan & Kontainer", description: "Kemasan dan data kontainer pengiriman." },
  { id: "barang", label: "Barang", description: "Rincian barang, spesifikasi, dan tarif." },
  { id: "review", label: "Review & Submit", description: "Ringkasan akhir sebelum submit." },
];

const wizardStepIcons = {
  pengajuan: BriefcaseIcon,
  entitas: UserIcon,
  dokumen: DocumentsIcon,
  kemasan: TruckIcon,
  barang: HamburgerMenuIcon,
  review: CheckReadIcon,
} satisfies Record<WizardStepId, typeof BriefcaseIcon>;

const sectionTone = "rounded-2xl border border-border-primary bg-white shadow-sm";
const fieldTone =
  "h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100";
const tocStickyClass = "lg:sticky lg:top-[calc(var(--shell-sticky-top)+12px)] lg:self-start";
const tocShellClass =
  "flex flex-col rounded-2xl border border-border-primary bg-white shadow-sm lg:h-[calc(100vh-var(--shell-sticky-top)-36px)] lg:max-h-[calc(100vh-var(--shell-sticky-top)-36px)]";
const tocScrollClass = "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1";

const pungutanMatrixColumns = [
  "Dibayar",
  "Ditanggung Pemerintah",
  "Ditunda",
  "Tidak Dipungut",
  "Dibebaskan",
  "Sudah Dilunasi",
] as const;

const pungutanMatrixRows: Array<{
  label: string;
  values: Array<number | null>;
  total?: boolean;
}> = [
  { label: "BM", values: [212195000, null, null, null, 212195000, null] },
  { label: "BMT", values: [282926000, null, null, null, null, null] },
  { label: "PPN", values: [707313736, null, null, null, null, null] },
  { label: "PPNBM", values: [608289799, 608289799, null, null, null, null] },
  { label: "PPH", values: [114054300, null, null, null, 347467800, null] },
  { label: "TOTAL", values: [1924778835, 608289799, null, null, 559662800, null], total: true },
];

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatReviewDate = (value?: string) => {
  if (!value) return "Tanggal belum diisi";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

const resolveResponsibleValue = (values: Array<string | undefined>, fallback: string) =>
  values.find((value) => value?.trim() && !/^test(?:ing)?$/i.test(value.trim()))?.trim() || fallback;

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
  "Berat Kotor",
  "Pernyataan Lartas",
  "Kondisi Barang",
  "Ukuran",
  "Spesifikasi Lain",
  "Kode Satuan",
  "Kode Kemasan",
  "Jumlah Kemasan",
  "Harga Invoice",
  "Biaya Penambahan",
  "Biaya Pengurangan",
  "Harga per Satuan",
  "Freight",
  "Asuransi",
  "Nilai VD",
  "Nilai CIF",
  "Nilai Pabean Rupiah",
  "Metode Nilai Pabean",
  "Alasan",
  "Perbedaan Harga",
  "FOB",
  "Tambahan - Diskon",
  "Volume",
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

type BarangMasterPresentationGroup = "identity" | "quantity" | "value";

const barangMasterPresentation: Record<BarangMasterPresentationGroup, { id: string; title: string; description: string; fields: string[] }> = {
  identity: {
    id: "barang-identitas",
    title: "Identitas Barang",
    description: "Identitas, klasifikasi, spesifikasi, negara asal, dan berat barang.",
    fields: ["Seri", "HS Code", "Kode Barang", "Merek", "Tipe", "Ukuran", "Kondisi Barang", "Spesifikasi Lain", "Uraian", "Negara Asal", "Berat Bersih", "Berat Kotor", "Pernyataan Lartas", "Status"],
  },
  quantity: {
    id: "barang-kuantitas-kemasan",
    title: "Kuantitas & Kemasan",
    description: "Satuan, jumlah, volume, serta informasi kemasan barang.",
    fields: ["Kode Kemasan", "Jumlah Kemasan", "Kode Satuan", "Jumlah Satuan", "Volume"],
  },
  value: {
    id: "barang-nilai-harga",
    title: "Nilai & Harga",
    description: "Harga invoice, komponen biaya, dan perhitungan nilai pabean barang.",
    fields: ["Harga Invoice", "Biaya Penambahan", "Biaya Pengurangan", "Freight", "Asuransi", "Nilai VD", "Nilai CIF", "Harga per Satuan", "Nilai Pabean Rupiah", "Metode Nilai Pabean", "Alasan", "Perbedaan Harga", "FOB", "Tambahan - Diskon"],
  },
};

const barangTocItems = [
  { ...barangMasterPresentation.identity, sourceSectionId: "barang-info" },
  { ...barangMasterPresentation.quantity, sourceSectionId: "barang-info" },
  { ...barangMasterPresentation.value, sourceSectionId: "barang-info" },
  { id: "barang-cukai", sourceSectionId: "barang-cukai", title: "Barang Cukai", description: "Rincian cukai per seri barang." },
  { id: "barang-spesifikasi", sourceSectionId: "barang-spesifikasi", title: "Spesifikasi Wajib", description: "Spesifikasi tambahan per seri." },
  { id: "barang-dokumen", sourceSectionId: "barang-dokumen", title: "Dokumen Barang", description: "Dokumen yang terhubung ke seri barang." },
  { id: "barang-vd", sourceSectionId: "barang-vd", title: "Barang VD", description: "Mock data barang VD." },
  { id: "barang-tarif", sourceSectionId: "barang-tarif", title: "Barang Tarif", description: "Pungutan dan tarif per seri." },
  { id: "karantina", sourceSectionId: "karantina", title: "Barang Karantina", description: "Data karantina yang melekat pada seri barang." },
];

const complianceTocItems = [
  { id: "compliance-lartas", title: "Lartas" },
  { id: "compliance-coo", title: "COO" },
  { id: "compliance-masterlist", title: "Masterlist" },
  { id: "compliance-trq", title: "TRQ" },
  { id: "compliance-transportasi", title: "Transportasi" },
  { id: "compliance-pendukung", title: "Dokumen Pendukung" },
];

const barangStepTocItems: Array<{
  id: string;
  label: string;
  description: string;
  icon: typeof DocumentsIcon;
  children?: Array<{ id: string; label: string; description: string; icon: typeof DocumentsIcon }>;
}> = [
  { id: "tabel-informasi-barang", label: "Tabel Informasi Barang", description: "Daftar seri barang dan aksi kelola detail.", icon: DocumentsIcon },
  {
    id: "karantina",
    label: "Header Karantina",
    description: "Data karantina untuk keseluruhan pengajuan.",
    icon: CheckReadIcon,
    children: [
      { id: "karantina-hewan", label: "Header Karantina Hewan", description: "Kantor, tujuan, dan pemeriksaan karantina hewan.", icon: CheckReadIcon },
      { id: "karantina-ikan", label: "Header Karantina Ikan", description: "Kantor, tujuan, dan pemeriksaan karantina ikan.", icon: CheckReadIcon },
      { id: "karantina-tumbuhan", label: "Header Karantina Tumbuhan", description: "Kantor, tujuan, dan pemeriksaan karantina tumbuhan.", icon: CheckReadIcon },
    ],
  },
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

type EntityKind =
  | "pengusahaImportir"
  | "npwpPemusatan"
  | "pemilikBarang"
  | "penjual"
  | "pengirim"
  | "pemasok"
  | "ppjk"
  | "penerima"
  | "pembeli"
  | "eksportirKek"
  | "vendorKek"
  | "penanggungJawab"
  | "barangEksporLcl";
type EntityFieldType = "input" | "select" | "textarea" | "identity";
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
  inputType?: string;
  required?: boolean;
  /** Key of the paired field in the row, used by the "identity" composite type (code select + value input). */
  pairKey?: string;
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
  /** Header button that copies field values from another entity's row into this one. */
  copyFrom?: { kind: EntityKind; label: string; map: Record<string, string> };
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
    kind: "npwpPemusatan",
    title: "NPWP Pemusatan",
    description: "NPWP lokasi pemusatan. Diisi bila importir mendapat fasilitas pemusatan.",
    icon: BuildingsIcon,
    requiredFields: ["Nomor Identitas", "NITKU", "Nama", "Alamat"],
    copyFrom: {
      kind: "pengusahaImportir",
      label: "Salin Importir",
      map: {
        "Nomor Identitas": "No Identitas (16 Digit)",
        NITKU: "6 Digit Terakhir NITKU",
        Nama: "Nama Perusahaan",
        Alamat: "Alamat",
      },
    },
    emptyState: "NPWP pemusatan belum diisi.",
    defaultValues: {
      "Jenis Entitas": "NPWP Pemusatan",
      "Jenis Identitas": "NPWP",
      "Nomor Identitas": "",
      NITKU: "",
      Nama: "",
      Alamat: "",
    },
    fields: [
      {
        key: "Nomor Identitas",
        label: "Nomor Identitas",
        type: "identity",
        pairKey: "Jenis Identitas",
        options: identityOptions,
        placeholder: "Nomor identitas...",
        span: 1,
        required: true,
      },
      { key: "NITKU", label: "NITKU", placeholder: "NITKU...", span: 1, lookup: true, required: true },
      { key: "Nama", label: "Nama", placeholder: "Masukkan nama...", span: 1, required: true },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Masukkan alamat...", span: 3, required: true },
    ],
  },
  {
    kind: "pemilikBarang",
    title: "Pemilik Barang",
    description: "Identitas pihak yang memiliki barang dalam transaksi.",
    icon: BuildingsIcon,
    requiredFields: ["Jenis Identitas", "Nama", "Alamat", "Kode Afiliasi", "NITKU", "Kode Negara"],
    emptyState: "Data pemilik barang belum diisi.",
    defaultValues: { "Jenis Entitas": "Pemilik Barang" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas pemilik barang", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama pemilik barang", span: 1 },
      { key: "Kode Afiliasi", label: "Kode Afiliasi", type: "select", span: 1 },
      { key: "NITKU", label: "NITKU", placeholder: "NITKU pemilik barang", span: 1 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pemilik barang", span: 3 },
    ],
  },
  {
    kind: "penjual",
    title: "Penjual",
    description: "Identitas pihak yang menjual barang dalam transaksi.",
    icon: BriefcaseIcon,
    requiredFields: ["Jenis Identitas", "Nama", "Alamat", "Kode Negara"],
    emptyState: "Data penjual belum diisi.",
    defaultValues: { "Jenis Entitas": "Penjual" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas penjual", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama penjual", span: 1 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat penjual", span: 3 },
    ],
  },
  {
    kind: "pengirim",
    title: "Pengirim",
    description: "Identitas pihak yang mengirim barang dalam transaksi.",
    icon: TruckIcon,
    requiredFields: ["Jenis Identitas", "Nama", "Alamat", "Kode Negara"],
    emptyState: "Data pengirim belum diisi.",
    defaultValues: { "Jenis Entitas": "Pengirim" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas pengirim", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama pengirim", span: 1 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pengirim", span: 3 },
    ],
  },
  {
    kind: "pemasok",
    title: "Pemasok",
    description: "Identitas pihak yang memasok barang dalam transaksi.",
    icon: BuildingsIcon,
    requiredFields: ["Jenis Identitas", "Nama", "Alamat", "Kode Negara"],
    emptyState: "Data pemasok belum diisi.",
    defaultValues: { "Jenis Entitas": "Pemasok" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas pemasok", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama pemasok", span: 1 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pemasok", span: 3 },
    ],
  },
  {
    kind: "ppjk",
    title: "PPJK",
    description: "Gunakan bila pengurusan dilakukan melalui perantara kepabeanan.",
    icon: BriefcaseIcon,
    toggle: { key: "Menggunakan PPJK", label: "Menggunakan PPJK" },
    requiredFields: ["Jenis Identitas", "NITKU", "Nama", "Alamat"],
    defaultValues: {
      "Jenis Entitas": "PPJK",
      "Menggunakan PPJK": "",
      "Jenis Identitas": "",
      NITKU: "",
      Nama: "",
      Alamat: "",
    },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas PPJK", span: 1 },
      { key: "NITKU", label: "NITKU", placeholder: "NITKU PPJK", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama PPJK", span: 1 },
      { key: "Tanggal NP", label: "Tanggal NP", inputType: "date", span: 1 },
      { key: "NP PPJK", label: "NP PPJK", placeholder: "Nomor NP PPJK", span: 1 },
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
    requiredFields: ["Nama", "Alamat", "Kode Negara"],
    defaultValues: {
      "Jenis Entitas": "Penerima",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama penerima", span: 2 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat penerima", span: 3 },
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas penerima", span: 1 },
      { key: "NITKU", label: "NITKU", placeholder: "NITKU penerima", span: 1 },
      { key: "Status", label: "Status", type: "select", options: statusOptions, span: 1 },
      { key: "Izin Badan Pengusaha", label: "Izin Badan Pengusaha", placeholder: "Nomor izin badan pengusaha", span: 1 },
    ],
    emptyState: "Data penerima belum diisi.",
  },
  {
    kind: "pembeli",
    title: "Pembeli",
    description: "Dapat disamakan dengan penerima jika datanya sama.",
    icon: DocumentsIcon,
    toggle: { key: "Sama dengan Penerima", label: "Sama dengan Penerima" },
    requiredFields: ["Nama", "Alamat", "Kode Negara"],
    defaultValues: {
      "Jenis Entitas": "Pembeli",
    },
    fields: [
      { key: "Nama", label: "Nama", placeholder: "Nama pembeli", span: 2 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat pembeli", span: 3 },
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas pembeli", span: 1 },
    ],
    emptyState: "Pembeli akan mengikuti data penerima.",
  },
  {
    kind: "eksportirKek",
    title: "Eksportir",
    description: "Identitas eksportir untuk dokumen KEK.",
    icon: PlainIcon,
    requiredFields: ["Jenis Identitas", "Nama", "Alamat", "Kode Negara"],
    emptyState: "Data eksportir belum diisi.",
    defaultValues: { "Jenis Entitas": "Eksportir" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas eksportir", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama eksportir", span: 1 },
      { key: "Kode Negara", label: "Kode Negara", type: "select", options: countryOptions, span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat eksportir", span: 3 },
    ],
  },
  {
    kind: "vendorKek",
    title: "Vendor",
    description: "Identitas vendor untuk dokumen KEK.",
    icon: DocumentsIcon,
    requiredFields: ["Jenis Identitas", "NITKU", "Nama", "Alamat"],
    emptyState: "Data vendor belum diisi.",
    defaultValues: { "Jenis Entitas": "Vendor" },
    fields: [
      { key: "Jenis Identitas", label: "Jenis Identitas", placeholder: "Jenis identitas vendor", span: 1 },
      { key: "NITKU", label: "NITKU", placeholder: "NITKU vendor", span: 1 },
      { key: "Nama", label: "Nama", placeholder: "Nama vendor", span: 1 },
      { key: "Telepon", label: "Telepon", placeholder: "Nomor telepon vendor", span: 1 },
      { key: "Email", label: "Email", placeholder: "email@domain.com", span: 1 },
      { key: "Alamat", label: "Alamat", type: "textarea", placeholder: "Alamat vendor", span: 3 },
    ],
  },
  {
    kind: "penanggungJawab",
    title: "Penanggung Jawab",
    description: "Kontak utama yang menangani pengajuan dan tindak lanjut.",
    icon: UserIcon,
    requiredFields: ["Nama", "Jabatan", "Kota", "Kode Pos", "Email"],
    defaultValues: {
      "Jenis Entitas": "Penanggung Jawab",
      Nama: "Andi Pratama",
      Jabatan: "Direktur Operasional",
      Kota: "Kota Jakarta Selatan",
      "Kode Pos": "12190",
      Email: "andi.pratama@contoh.co.id",
      Keterangan: "Penanggung jawab pengajuan kepabeanan.",
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

const entityOrder: EntityKind[] = ["pengusahaImportir", "npwpPemusatan", "ppjk", "penerima", "pembeli", "penanggungJawab", "barangEksporLcl"];

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

const dokumenColumns = ["Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin", "Kategori Dokumen", "Negara Asal"];
const mandatoryDokumenDefinitions = [
  { kode: "INV", placeholder: "surat_pengajuan_impor_v01.docx" },
  { kode: "PL", placeholder: "packing_list_mock.pdf" },
  { kode: "BL", placeholder: "bill_of_lading_mock.pdf" },
] as const;

const createDokumenLampiranRow = (definition: (typeof mandatoryDokumenDefinitions)[number], nomorDokumen?: string) =>
  createRow(dokumenColumns, {
    "Kode Dokumen": definition.kode,
    "Nomor Dokumen": nomorDokumen || definition.placeholder,
    Tanggal: "2026-06-30",
    "Kode Fasilitas": "-",
    "Kode Ijin": "-",
  });

const normalizeDokumenRows = (rows: Row[]) => {
  const mandatoryRows = mandatoryDokumenDefinitions.map((definition) => {
    const existing = rows.find((row) => row["Kode Dokumen"] === definition.kode);
    return existing ? createRow(dokumenColumns, { ...existing, "Kode Dokumen": definition.kode }) : createDokumenLampiranRow(definition);
  });
  const extraRows = rows.filter((row) => !mandatoryDokumenDefinitions.some((definition) => row["Kode Dokumen"] === definition.kode));
  return [...mandatoryRows, ...extraRows.map((row) => createRow(dokumenColumns, row))];
};

const kemasanColumns = ["Seri", "Jumlah", "Jenis Kemasan", "Merek", "Kemasan"];
const kontainerColumns = ["Seri", "Nomor Kontainer", "Ukuran", "Jenis Muatan", "Tipe", "Nomor Seal", "Stuffing"];
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
  "Biaya Penambahan",
  "Biaya Pengurangan",
  "Harga per Satuan",
  "Freight",
  "Asuransi",
  "Nilai VD",
  "Nilai CIF",
  "Nilai Pabean Rupiah",
  "Metode Nilai Pabean",
  "Alasan",
  "Perbedaan Harga",
  "FOB",
  "Tambahan - Diskon",
  "Volume",
  "Berat Kotor",
  "Pernyataan Lartas",
  "Status",
];
const barangCukaiColumns = ["Seri Barang", "Komoditi", "Jenis Tarif Cukai", "Tarif Cukai", "Kode Fasilitas Cukai", "Jumlah Satuan Cukai", "Jenis Satuan Cukai", "Nilai Cukai", "Jenis Tarif HJE", "HJE RP", "Total Kemasan Cukai", "Jenis Kemasan Cukai", "Isi Per Kemasan", "Jumlah Pita Cukai", "Saldo Awal", "Saldo Akhir"];
const spesifikasiColumns = ["Seri Barang", "Nama Spesifikasi", "Nilai", "Satuan"];
const barangDokumenColumns = ["Seri Barang", "Seri Dokumen", "Jenis Dokumen", "Nomor Dokumen", "Tanggal", "Fasilitas", "No Urut Izin"];
const barangVdColumns = ["Seri Barang", "Jenis VD", "Tanggal Jatuh Tempo", "Nilai", "Keterangan"];
const barangTarifColumns = ["Seri Barang", "Jenis Pungutan", "Jenis Tarif", "Kode Satuan", "Jumlah Satuan", "Nilai Tarif", "Kode Fasilitas Tarif", "Nilai Tarif Fasilitas", "Penerbit SKA"];
const karantinaColumns = ["Seri Barang", "Komoditi", "Klasifikasi", "Jumlah", "Satuan", "Nama Umum", "Nama Latin"];

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
  ...definition.fields.flatMap((field) => (field.pairKey ? [field.key, field.pairKey] : [field.key])),
];
const isSectionComplete = (definition: EntityDefinition, row: Row | null, rows: Row[]) => {
  if (!row) return false;
  if (definition.toggle && definition.kind !== "pembeli" && !isTruthyValue(row[definition.toggle.key])) {
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
    return { label: "Belum Diisi", tone: "warning" as const };
  }

  if (definition.toggle && !isTruthyValue(row[definition.toggle.key])) {
    return { label: "Tidak Digunakan", tone: "neutral" as const };
  }

  if (isSectionComplete(definition, row, rows)) {
    return { label: "Lengkap", tone: "success" as const };
  }

  if (isSectionStarted(definition, row)) {
    return { label: "Wajib Dilengkapi", tone: "error" as const };
  }

  return { label: "Belum Diisi", tone: "warning" as const };
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
        getSectionColumns(definition),
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
    kemasan: [createRow(kemasanColumns, { Seri: "1", Jumlah: "2", "Jenis Kemasan": "Pallet", Merek: "INSW" })],
    kontainer: [createRow(kontainerColumns, { Seri: "1", "Nomor Kontainer": "MSKU1234567", Ukuran: "40", "Jenis Muatan": "FCL", Tipe: "Dry", "Nomor Seal": "SEAL-001", Stuffing: "FCL" })],
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
    barangCukai: [
      createRow(barangCukaiColumns, { "Seri Barang": "1", Komoditi: "Hasil Tembakau", "Jenis Tarif Cukai": "Spesifik", "Tarif Cukai": "0", "Kode Fasilitas Cukai": "-", "Jumlah Satuan Cukai": "10", "Jenis Satuan Cukai": "PCE", "Nilai Cukai": "0", "Jenis Tarif HJE": "HJE", "HJE RP": "0", "Total Kemasan Cukai": "2", "Jenis Kemasan Cukai": "BOX", "Isi Per Kemasan": "5", "Jumlah Pita Cukai": "0", "Saldo Awal": "0", "Saldo Akhir": "0" }),
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
      createRow(karantinaColumns, { "Seri Barang": "1", Komoditi: "Hewan Hidup", Klasifikasi: "Mamalia", Jumlah: "10", Satuan: "Ekor", "Nama Umum": "Sapi", "Nama Latin": "Bos taurus" }),
      createRow(karantinaColumns, { "Seri Barang": "3", Komoditi: "Tumbuhan Hidup", Klasifikasi: "Tanaman Hias", Jumlah: "5", Satuan: "Pot", "Nama Umum": "Anggrek", "Nama Latin": "Orchidaceae" }),
    ],
    karantinaHewan: {},
    karantinaIkan: {},
    karantinaTumbuhan: {},
  };
};

const normalizeFormState = (state: FormState): FormState => ({
  ...state,
  dokumen: normalizeDokumenRows(state.dokumen),
  barangCukai: state.barangCukai ?? [],
  karantinaHewan: state.karantinaHewan ?? {},
  karantinaIkan: state.karantinaIkan ?? {},
  karantinaTumbuhan: state.karantinaTumbuhan ?? {},
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
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
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
        </button>
        <div className="flex shrink-0 items-center gap-3">
          {headerActions}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={open ? "Ciutkan section" : "Buka section"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-primary text-brand-primary-600"
          >
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>
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
  pairValue,
  onPairChange,
}: {
  field: EntityFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onLookup?: () => void;
  pairValue?: string;
  onPairChange?: (value: string) => void;
}) {
  const widthClass = field.span === 3 ? "md:col-span-2 xl:col-span-3" : field.span === 2 ? "md:col-span-2" : "";
  const wrapperClass = ["flex flex-col gap-1.5", widthClass].filter(Boolean).join(" ");
  const isDisabled = disabled || field.readOnly || field.disabled;

  if (field.type === "identity") {
    return (
      <label className={wrapperClass}>
        <span className="text-[12px] font-medium text-neutral-700">
          {field.label}
          {field.required ? <span className="ml-1 text-error-500">*</span> : null}
        </span>
        <div className="flex items-center gap-2">
          <Select
            className="w-32 shrink-0"
            value={pairValue ?? ""}
            onValueChange={(next) => onPairChange?.(next)}
            placeholder="Kode"
            options={field.options ?? []}
            disabled={isDisabled}
          />
          <Input
            className="flex-1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? field.label}
            readOnly={isDisabled}
            disabled={isDisabled}
          />
        </div>
      </label>
    );
  }

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
        options={field.options?.length ? field.options : [{ label: `Pilihan ${field.label} 1`, value: `${field.key}-1` }, { label: `Pilihan ${field.label} 2`, value: `${field.key}-2` }]}
        disabled={isDisabled}
        required={field.required}
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
      type={field.inputType}
      requiredMark={field.required}
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
          pairValue={field.pairKey ? row[field.pairKey] ?? "" : undefined}
          onPairChange={field.pairKey ? (value) => onChange(field.pairKey!, value) : undefined}
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

function normalizeSectionStatus(status: { label: string; tone: "brand" | "neutral" | "warning" | "success" | "error" | "info" }): SectionStatus {
  if (status.tone === "success") return { label: "Lengkap", tone: "success", detail: "Seluruh field mandatory pada section ini sudah terisi." };
  if (status.tone === "error") return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
  if (status.label === "Tidak Digunakan" || status.label === "Opsional") return { label: "Tidak Digunakan", tone: "secondary", detail: "Section kondisional tidak digunakan pada pengajuan ini." };
  return { label: "Belum Diisi", tone: "warning", detail: "Section ini belum mulai diisi." };
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mandatory = false,
  helperText,
  inputType,
  readOnly = false,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mandatory?: boolean;
  helperText?: string;
  inputType?: ResolvedFieldConfig["inputType"];
  readOnly?: boolean;
  options?: ResolvedFieldConfig["options"];
}) {
  if (inputType === "select") {
    const configuredOptions = options?.length
      ? options
      : [
          { label: `Pilihan ${label} 1`, value: `${label}-1` },
          { label: `Pilihan ${label} 2`, value: `${label}-2` },
        ];
    const selectOptions = value && !configuredOptions.some((option) => option.value === value)
      ? [{ label: value, value }, ...configuredOptions]
      : configuredOptions;
    return (
      <Select
        label={label}
        value={value}
        onValueChange={onChange}
        options={selectOptions}
        placeholder={placeholder ?? `Pilih ${label.toLowerCase()}`}
        required={mandatory}
        disabled={readOnly}
        searchable
        preserveOptions
      />
    );
  }

  if (inputType === "radio") {
    return (
      <fieldset>
        <legend className="text-[12px] font-medium text-neutral-700">{label}{mandatory ? <span className="text-error-500"> *</span> : null}</legend>
        <div className="mt-2 flex min-h-10 items-center gap-4 rounded-md border border-border-primary px-3">
          {(options?.length ? options : [{ label: "Ya", value: "Ya" }, { label: "Tidak", value: "Tidak" }]).map((option) => <label key={option.value} className="flex items-center gap-2 text-[12px]"><input type="radio" checked={value === option.value} onChange={() => onChange(option.value)} disabled={readOnly} className="accent-brand-primary-500" />{option.label}</label>)}
        </div>
      </fieldset>
    );
  }

  if (inputType === "alert") {
    return <div className="rounded-xl border border-warning-100 bg-warning-50 p-3 text-[12px] text-warning-800"><strong>{label}</strong><div className="mt-1">{value || helperText || "Hasil analisis akan tampil otomatis."}</div></div>;
  }

  if (inputType === "textarea") {
    return (
      <Textarea
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        requiredMark={mandatory}
        readOnly={readOnly}
        rows={3}
      />
    );
  }

  return (
    <div>
      <Input
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={inputType === "number" ? "number" : inputType === "date" ? "date" : type}
        requiredMark={mandatory}
        readOnly={readOnly}
      />
      {helperText ? <p className="mt-1.5 text-[11px] leading-5 text-neutral-500">{helperText}</p> : null}
    </div>
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
  columnLabels,
  fieldConfigs,
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
  columnLabels?: Record<string, string>;
  fieldConfigs?: ResolvedFieldConfig[];
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
                  {columnLabels?.[column] ?? column}
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
                          columnLabels={columnLabels}
                          fieldConfigs={fieldConfigs}
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

type BarangDetailSection = "cukai" | "spesifikasi" | "dokumen" | "vd" | "tarif" | "karantina";

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
  columnLabels,
  fieldConfigs,
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
  columnLabels?: Record<string, string>;
  fieldConfigs?: ResolvedFieldConfig[];
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
          columnLabels={columnLabels}
          fieldConfigs={fieldConfigs}
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
                    {columnLabels?.[column] ?? column}
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
                            columnLabels={columnLabels}
                            fieldConfigs={fieldConfigs}
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
  fields,
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
  fields?: ResolvedFieldConfig[];
}) {
  const [selectedFileName, setSelectedFileName] = useState(value["Nomor Dokumen"] ?? "");
  const fieldMap = new Map((fields ?? []).map((field) => [field.id, field]));
  const fieldConfig = (id: string) => fieldMap.get(id) ?? { id, label: id, enabled: true, required: false, order: 0 };

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

      {fieldConfig("Nomor Dokumen").enabled ? <div className={compact ? "mt-3 rounded-xl border border-dashed border-border-primary bg-white/80 p-3" : "mt-4 rounded-2xl border border-dashed border-border-primary bg-white/80 p-4"}>
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
      </div> : null}

      <div className={compact ? "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3" : "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
        {fieldConfig("Kode Dokumen").enabled ? <FormField
          label={fieldConfig("Kode Dokumen").label}
          value={value["Kode Dokumen"] ?? ""}
          onChange={(next) => onChange("Kode Dokumen", next)}
          placeholder={codeLocked ? "INV" : "INV / PL / BL"}
          readOnly={codeLocked}
          mandatory={fieldConfig("Kode Dokumen").required}
          inputType={fieldConfig("Kode Dokumen").inputType}
        /> : null}
        {fieldConfig("Nomor Dokumen").enabled ? <Input
          label={fieldConfig("Nomor Dokumen").label}
          value={value["Nomor Dokumen"] ?? selectedFileName ?? ""}
          onChange={() => void 0}
          placeholder="Nama file akan terisi otomatis"
          readOnly
          requiredMark={fieldConfig("Nomor Dokumen").required}
        /> : null}
        {fieldConfig("Tanggal").enabled ? <FormField
          label={fieldConfig("Tanggal").label}
          value={value.Tanggal ?? ""}
          onChange={(next) => onChange("Tanggal", next)} inputType="date" mandatory={fieldConfig("Tanggal").required}
        /> : null}
        {fieldConfig("Kode Fasilitas").enabled ? <FormField
          label={fieldConfig("Kode Fasilitas").label}
          value={value["Kode Fasilitas"] ?? ""}
          onChange={(next) => onChange("Kode Fasilitas", next)} inputType="select" mandatory={fieldConfig("Kode Fasilitas").required}
        /> : null}
        {fieldConfig("Kode Ijin").enabled ? <FormField
          label={fieldConfig("Kode Ijin").label}
          value={value["Kode Ijin"] ?? ""}
          onChange={(next) => onChange("Kode Ijin", next)} inputType="select" mandatory={fieldConfig("Kode Ijin").required}
        /> : null}
        {(fields ?? []).filter((field) => field.enabled && !["Kode Dokumen", "Nomor Dokumen", "Tanggal", "Kode Fasilitas", "Kode Ijin"].includes(field.id)).map((field) => (
          <FormField key={field.id} label={field.label} value={value[field.id] ?? field.defaultValue ?? ""} onChange={(next) => onChange(field.id, next)} inputType={field.inputType} mandatory={field.required} helperText={field.helperText} />
        ))}
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
  columnLabels,
  fieldConfigs,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  value: Row;
  onChange: (column: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  columnLabels?: Record<string, string>;
  fieldConfigs?: ResolvedFieldConfig[];
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
        {columns.map((column) => {
          const config = fieldConfigs?.find((field) => field.id === column);
          return <FormField key={column} label={columnLabels?.[column] ?? config?.label ?? column} value={value[column] ?? config?.defaultValue ?? ""} onChange={(next) => onChange(column, next)} inputType={config?.inputType} mandatory={config?.required} helperText={config?.helperText} readOnly={config?.readOnly} />;
        })}
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
  onExited,
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
  enabledSectionIds,
  requiresQuarantine,
  masterFields,
  detailFields,
  sectionLabels,
}: {
  open: boolean;
  item: Row | null;
  mode: BarangWorkspaceMode;
  activeTab: BarangWorkspaceTab;
  onTabChange: (tab: BarangWorkspaceTab) => void;
  onClose: () => void;
  onExited: () => void;
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
  enabledSectionIds: string[];
  requiresQuarantine: boolean;
  masterFields: ResolvedFieldConfig[];
  detailFields: Partial<Record<BarangDetailSection, ResolvedFieldConfig[]>>;
  sectionLabels: Record<string, string>;
}) {
  const [tocOpen, setTocOpen] = useState(true);
  const [cooSource, setCooSource] = useState<"service" | "upload" | "none">("service");
  const [cooSearch, setCooSearch] = useState("");
  const [supportFiles, setSupportFiles] = useState<string[]>([]);
  const [detailAddState, setDetailAddState] = useState<{ section: BarangDetailSection; row: Row } | null>(null);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setCooSource("service");
      setCooSearch("");
      setSupportFiles([]);
      setDetailAddState(null);
      onCancelDetailEdit();
    }, 380);
    return () => window.clearTimeout(timer);
  }, [open, item?.Seri]);

  if (!item) return null;

  const seri = item.Seri || "-";
  const drawerTitle = mode === "add" ? "Tambah Barang" : `Barang Seri ${seri} - ${item["Uraian"] || "Tanpa uraian"}`;
  const drawerSubtitle =
    mode === "add"
      ? "Isi data barang baru lalu simpan untuk menambah record ke tabel barang."
      : "Kelola detail barang per seri dari drawer kanan. Data inti dan detail turunannya tetap melekat pada barang yang sama.";
  const sourceItems = ["COO-001 - Certificate of Origin", "COO-002 - Preferential COO", "COO-003 - Origin Statement"];
  const filteredSourceItems = sourceItems.filter((entry) => entry.toLowerCase().includes(cooSearch.trim().toLowerCase()));
  const activeTocItems = activeTab === "data-barang"
    ? barangTocItems
        .filter((item) => enabledSectionIds.includes(item.sourceSectionId) && (item.id !== "karantina" || requiresQuarantine))
        .map((item) => ({ ...item, title: sectionLabels[item.id] ?? item.title }))
    : complianceTocItems;
  const hiddenSectionIds = [
    ...barangTocItems
      .filter((item) => !enabledSectionIds.includes(item.sourceSectionId) || (item.id === "karantina" && !requiresQuarantine))
      .map((item) => item.id),
  ];
  const configuredMasterFields = masterFields
    .filter((field) => field.enabled)
    .map<EntityFieldConfig>((field) => {
      const base = barangInfoFields.find((item) => item.key === field.id);
      return {
        ...base,
        key: field.id,
        label: field.label,
        note: field.helperText ?? base?.note,
        type: field.inputType === "select" ? "select" : "input",
        inputType: field.inputType === "number" ? "number" : field.inputType === "date" ? "date" : "text",
        readOnly: field.readOnly,
        required: field.required,
        span: base?.span ?? 1,
      };
    });
  const masterFieldsByPresentation = Object.fromEntries(
    Object.entries(barangMasterPresentation).map(([groupId, group]) => [groupId, group.fields.map((fieldKey) => configuredMasterFields.find((field) => field.key === fieldKey)).filter((field): field is EntityFieldConfig => Boolean(field))]),
  ) as Record<BarangMasterPresentationGroup, EntityFieldConfig[]>;
  const getDetailColumns = (section: BarangDetailSection, fallback: string[]) => {
    const configured = detailFields[section];
    return configured?.filter((field) => field.enabled).map((field) => field.id).filter((field) => fallback.includes(field)) ?? fallback;
  };
  const getDetailLabels = (section: BarangDetailSection) => Object.fromEntries((detailFields[section] ?? []).map((field) => [field.id, field.label]));
  const detailDraftColumns: Record<BarangDetailSection, string[]> = {
    cukai: barangCukaiColumns.slice(1),
    spesifikasi: spesifikasiColumns.slice(1),
    dokumen: barangDokumenColumns.slice(1),
    vd: barangVdColumns.slice(1),
    tarif: barangTarifColumns.slice(1),
    karantina: karantinaColumns.slice(1),
  };
  const detailAddLabels: Record<BarangDetailSection, string> = {
    cukai: "Tambah Barang Cukai",
    spesifikasi: "Tambah Spesifikasi",
    dokumen: "Tambah Dokumen",
    vd: "Tambah VD",
    tarif: "Tambah Tarif",
    karantina: "Tambah Karantina",
  };
  const detailAddTitles: Record<BarangDetailSection, string> = {
    cukai: "Tambah Barang Cukai",
    spesifikasi: "Tambah Spesifikasi",
    dokumen: "Tambah Dokumen Barang",
    vd: "Tambah Barang VD",
    tarif: "Tambah Barang Tarif",
    karantina: "Tambah Karantina",
  };
  const detailAddSubtitles: Record<BarangDetailSection, string> = {
    cukai: "Isi data cukai baru lalu simpan untuk menambah record ke tabel.",
    spesifikasi: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    dokumen: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    vd: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    tarif: "Isi data baru lalu simpan untuk menambah record ke tabel.",
    karantina: "Isi data baru lalu simpan untuk menambah record ke tabel.",
  };

  const hasFieldValue = (value: unknown) => String(value ?? "").trim().length > 0;
  const fieldStatus = (fields: EntityFieldConfig[], row: Row, sectionName: string): SectionStatus => {
    const hasAnyValue = fields.some((field) => hasFieldValue(row[field.key]));
    if (!hasAnyValue) {
      return { label: "Belum Diisi", tone: "warning", detail: `${sectionName} belum mulai diisi.` };
    }
    const missingRequired = fields.filter((field) => field.required && !hasFieldValue(row[field.key]));
    if (missingRequired.length > 0) {
      return { label: "Wajib Dilengkapi", tone: "error", detail: `${missingRequired.length} field wajib pada ${sectionName} belum diisi.` };
    }
    const allFilled = fields.every((field) => hasFieldValue(row[field.key]));
    return allFilled
      ? { label: "Lengkap", tone: "success", detail: `Seluruh field ${sectionName} sudah diisi.` }
      : { label: "Belum Lengkap", tone: "warning", detail: `Field wajib sudah terisi, tetapi masih ada field opsional yang kosong pada ${sectionName}.` };
  };
  const detailStatus = (section: BarangDetailSection, sectionName: string): SectionStatus => {
    const rows = detailRows[section];
    const fields = (detailFields[section] ?? []).filter((field) => field.enabled);
    if (rows.length === 0) {
      return { label: "Belum Diisi", tone: "warning", detail: `Belum ada record ${sectionName}.` };
    }
    const missingRequired = rows.some(({ row }) => fields.some((field) => field.required && !hasFieldValue(row[field.id])));
    if (missingRequired) {
      return { label: "Wajib Dilengkapi", tone: "error", detail: `Masih ada field wajib yang kosong pada record ${sectionName}.` };
    }
    const allFilled = fields.length === 0 || rows.every(({ row }) => fields.every((field) => hasFieldValue(row[field.id])));
    return allFilled
      ? { label: "Lengkap", tone: "success", detail: `${rows.length} record ${sectionName} sudah lengkap.` }
      : { label: "Belum Lengkap", tone: "warning", detail: `Field wajib sudah terisi, tetapi masih ada field opsional yang kosong pada ${sectionName}.` };
  };
  const drawerSectionStatus = (sectionId: string): SectionStatus => {
    const masterGroup = sectionId === "barang-identitas" ? "identity" : sectionId === "barang-kuantitas-kemasan" ? "quantity" : sectionId === "barang-nilai-harga" ? "value" : null;
    if (masterGroup) {
      const group = barangMasterPresentation[masterGroup];
      return fieldStatus(masterFieldsByPresentation[masterGroup], item, group.title);
    }
    const detailSection = sectionId === "barang-cukai" ? "cukai" : sectionId === "barang-spesifikasi" ? "spesifikasi" : sectionId === "barang-dokumen" ? "dokumen" : sectionId === "barang-vd" ? "vd" : sectionId === "barang-tarif" ? "tarif" : sectionId === "karantina" ? "karantina" : null;
    if (detailSection) {
      const sectionName = activeTocItems.find((section) => section.id === sectionId)?.title ?? sectionId;
      return detailStatus(detailSection, sectionName);
    }
    if (sectionId === "compliance-transportasi") {
      return { label: "Lengkap", tone: "success", detail: "Data transportasi contoh sudah tersedia." };
    }
    if (sectionId === "compliance-pendukung") {
      return supportFiles.length > 0
        ? { label: "Lengkap", tone: "success", detail: `${supportFiles.length} dokumen pendukung tersedia.` }
        : { label: "Belum Diisi", tone: "warning", detail: "Belum ada dokumen pendukung yang dipilih." };
    }
    if (sectionId === "compliance-coo" && cooSource === "none") {
      return { label: "Tidak Digunakan", tone: "secondary", detail: "COO tidak digunakan untuk barang ini." };
    }
    if (sectionId === "compliance-lartas") {
      return { label: "Wajib Dilengkapi", tone: "error", detail: "Hasil cek lartas masih memerlukan dokumen tambahan." };
    }
    return { label: "Belum Diisi", tone: "warning", detail: `${activeTocItems.find((section) => section.id === sectionId)?.title ?? "Section"} belum dilengkapi.` };
  };

  const createDetailDraftRow = (section: BarangDetailSection, seriBarang: string) =>
    createRow(
      section === "cukai"
        ? barangCukaiColumns
        : section === "spesifikasi"
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
    <AnimatedDrawer
      open={open}
      onClose={onClose}
      onExited={onExited}
      ariaLabel="Workspace Barang"
      panelClassName="!w-[min(calc(58vw+280px),calc(100vw-0.5rem))] !max-w-none !overflow-visible !border-0 !bg-transparent !shadow-none"
      overflowVisible
      deferContent={false}
      renderContent={() => (
        <>
          {hiddenSectionIds.length ? <style>{hiddenSectionIds.map((id) => `#${id}{display:none!important}`).join("")}</style> : null}
          <DrawerTocLayout
            open={tocOpen}
            onOpenChange={setTocOpen}
            compactItems={activeTocItems.map((section) => ({
              id: section.id,
              label: section.title,
              icon: <DrawerTocIcon kind={section.id} />,
              status: drawerSectionStatus(section.id),
              onClick: () => jumpToSection(section.id),
            }))}
            toc={(
              <>
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-primary pb-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">TOC</div>
                    <div className="text-[11px] text-neutral-700">Lompat cepat</div>
                  </div>
                  <IconButton aria-label="Sembunyikan TOC" size="sm" variant="outline" onClick={() => setTocOpen(false)} className="h-8 w-8">
                    <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
                  </IconButton>
                </div>
                <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                  {activeTocItems.map((section) => {
                    const sectionDescription = "description" in section ? (section as { description?: string }).description ?? "" : "";
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => jumpToSection(section.id)}
                        className="relative flex w-full items-start gap-2.5 rounded-xl border border-border-primary bg-white px-2.5 py-2.5 pr-9 text-left transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-50/60"
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary-50 text-brand-primary-600">
                          <DrawerTocIcon kind={section.id} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold text-neutral-800">{section.title}</span>
                          {sectionDescription ? <span className="mt-0.5 block text-[10px] leading-4 text-neutral-600">{sectionDescription}</span> : null}
                        </span>
                        <span className="absolute right-2 top-2"><SectionStatusIconBadge status={drawerSectionStatus(section.id)} /></span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          >
        <div className="relative flex h-full min-h-0 flex-col bg-white">
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
                    {(["identity", "quantity", "value"] as const).map((groupId) => {
                      const group = barangMasterPresentation[groupId];
                      const fields = masterFieldsByPresentation[groupId];
                      if (!fields.length) return null;
                      return (
                        <section key={group.id} id={group.id} className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 border-b border-border-primary pb-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{group.title}</div>
                              <p className="mt-1 text-[12px] text-neutral-600">{group.description}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <SectionStatusTextBadge status={drawerSectionStatus(group.id)} />
                              {groupId === "identity" ? <span className="inline-flex rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">{item["Negara Asal"] || "-"}</span> : null}
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map((field) => (
                              <EntityFieldRenderer key={field.key} field={field} value={item[field.key] ?? ""} onChange={(value) => onUpdateMasterField(field.key, value)} />
                            ))}
                          </div>
                        </section>
                      );
                    })}

                    <section id="barang-cukai" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels["barang-cukai"] ?? "Barang Cukai"}</div><p className="mt-1 text-[12px] text-neutral-600">Rincian cukai yang melekat pada seri barang.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("barang-cukai")} />
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={getDetailColumns("cukai", barangCukaiColumns.slice(1))}
                          columnLabels={getDetailLabels("cukai")}
                          fieldConfigs={detailFields.cukai}
                          rows={detailRows.cukai}
                          onAdd={() => void 0}
                          onRemove={(rowIndex) => onRemoveDetailRow("cukai", rowIndex)}
                          emptyState="Belum ada rincian cukai untuk barang ini."
                          addLabel={detailAddLabels.cukai}
                          addFormOpen={detailAddState?.section === "cukai"}
                          addFormRow={detailAddState?.section === "cukai" ? detailAddState.row : null}
                          onAddStart={() => startAddDetailRow("cukai")}
                          onAddChange={updateAddDetailField}
                          onAddSave={saveAddDetailRow}
                          onAddCancel={cancelAddDetailRow}
                          editingRowIndex={detailEditState?.section === "cukai" ? detailEditState.rowIndex : null}
                          editingRow={detailEditState?.section === "cukai" ? detailEditState.row : null}
                          onEditStart={(rowIndex) => { setDetailAddState(null); const target = detailRows.cukai.find((entry) => entry.index === rowIndex); if (target) onStartDetailEdit("cukai", rowIndex, target.row); }}
                          onEditChange={onUpdateDetailEdit}
                          onEditSave={onSaveDetailEdit}
                          onEditCancel={onCancelDetailEdit}
                          editTitle="Edit Barang Cukai"
                        />
                      </div>
                    </section>

                    <section id="barang-spesifikasi" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels["barang-spesifikasi"] ?? "Spesifikasi Wajib"}</div><p className="mt-1 text-[12px] text-neutral-600">Editable mini table per seri. Jika kosong tampilkan empty state.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("barang-spesifikasi")} />
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={getDetailColumns("spesifikasi", spesifikasiColumns.slice(1))}
                          columnLabels={getDetailLabels("spesifikasi")}
                          fieldConfigs={detailFields.spesifikasi}
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
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels["barang-dokumen"] ?? "Dokumen Barang"}</div><p className="mt-1 text-[12px] text-neutral-600">Dokumen yang terhubung ke seri ini.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("barang-dokumen")} />
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={getDetailColumns("dokumen", barangDokumenColumns.slice(1))}
                          columnLabels={getDetailLabels("dokumen")}
                          fieldConfigs={detailFields.dokumen}
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
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels["barang-vd"] ?? "Barang VD"}</div><p className="mt-1 text-[12px] text-neutral-600">Mock data barang VD untuk seri ini.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("barang-vd")} />
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={getDetailColumns("vd", barangVdColumns.slice(1))}
                          columnLabels={getDetailLabels("vd")}
                          fieldConfigs={detailFields.vd}
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
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels["barang-tarif"] ?? "Barang Tarif"}</div><p className="mt-1 text-[12px] text-neutral-600">Pungutan dan tarif per seri barang.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("barang-tarif")} />
                      </div>
                      <div className="mt-4">
                        <CompactEditableTable
                          columns={getDetailColumns("tarif", barangTarifColumns.slice(1))}
                          columnLabels={getDetailLabels("tarif")}
                          fieldConfigs={detailFields.tarif}
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

                    {requiresQuarantine ? (
                      <section id="karantina" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-border-primary pb-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{sectionLabels.karantina ?? "Barang Karantina"}</div>
                            <p className="mt-1 text-[12px] text-neutral-600">Data karantina yang melekat pada seri barang ini.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <SectionStatusTextBadge status={drawerSectionStatus("karantina")} />
                            <Button variant="outline" size="sm" onClick={() => void 0}>
                              Cek Relasi Importir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => void 0}>
                              Pilih Komoditas
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {(detailFields.karantina ?? [])
                            .filter((field) => field.enabled)
                            .map((field) => (
                              <FormField
                                key={field.id}
                                label={field.label}
                                value={detailRows.karantina[0]?.row[field.id] ?? ""}
                                onChange={(value) => {
                                  const existing = detailRows.karantina[0];
                                  if (existing) {
                                    onUpdateDetailRow("karantina", existing.index, field.id, value);
                                  } else {
                                    onAddDetailRow("karantina", { "Seri Barang": item.Seri || "1", [field.id]: value });
                                  }
                                }}
                                placeholder={field.label}
                                mandatory={field.required}
                                helperText={field.helperText}
                                inputType={field.inputType}
                                readOnly={field.readOnly}
                                options={field.options}
                              />
                            ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <section id="compliance-lartas" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Lartas</div><p className="mt-1 text-[12px] text-neutral-600">Ringkasan hasil cek lartas dan rekomendasi dokumen.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("compliance-lartas")} />
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
                      <div className="flex items-start justify-between gap-3 border-b border-border-primary pb-4">
                        <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">COO</div><p className="mt-1 text-[12px] text-neutral-600">Pilih sumber COO secara inline tanpa modal.</p></div>
                        <SectionStatusTextBadge status={drawerSectionStatus("compliance-coo")} />
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
                      <div className="flex items-start justify-between gap-3"><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Masterlist</div><SectionStatusTextBadge status={drawerSectionStatus("compliance-masterlist")} /></div>
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
                      <div className="flex items-start justify-between gap-3"><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">TRQ</div><SectionStatusTextBadge status={drawerSectionStatus("compliance-trq")} /></div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Input label="Nomor TRQ" value="TRQ-001" onChange={() => void 0} />
                        <Input label="Tanggal" value="2026-07-04" onChange={() => void 0} />
                        <Input label="Status" value="Belum Dicek" onChange={() => void 0} />
                      </div>
                    </section>

                    <section id="compliance-transportasi" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3"><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Transportasi</div><SectionStatusTextBadge status={drawerSectionStatus("compliance-transportasi")} /></div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Input label="Moda Transportasi" value="Laut" onChange={() => void 0} />
                        <Input label="Nama Sarana Angkut" value="MV Contoh Nusantara" onChange={() => void 0} />
                        <Input label="Nomor Voyage / Flight / Trip" value="VY-0626" onChange={() => void 0} />
                        <Input label="Pelabuhan Muat" value="SGSIN" onChange={() => void 0} />
                        <Input label="Pelabuhan Tujuan" value="IDTPP" onChange={() => void 0} />
                      </div>
                    </section>

                    <section id="compliance-pendukung" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3"><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Dokumen Pendukung</div><SectionStatusTextBadge status={drawerSectionStatus("compliance-pendukung")} /></div>
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
          </DrawerTocLayout>
        </>
      )}
    />
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

function PungutanSummaryCard() {
  return (
    <section className={`${sectionTone} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-neutral-800">Ringkasan Pungutan</h3>
          <p className="mt-1 text-[12px] leading-5 text-neutral-600">
            Ringkasan nilai pungutan berdasarkan data tarif dan fasilitas yang telah diisi.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 px-3 py-1.5 font-semibold">
          Mata Uang: IDR
        </Badge>
      </div>

      <div className="mt-5 border-t border-border-primary pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">Rincian Pungutan</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-neutral-600">
                <th scope="col" className="px-3 py-3 text-left font-semibold">Jenis Pungutan</th>
                {pungutanMatrixColumns.map((column) => (
                  <th key={column} scope="col" className="px-3 py-3 text-right font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pungutanMatrixRows.map((row) => (
                <tr
                  key={row.label}
                  className={row.total
                    ? "border-t-2 border-brand-primary-200 bg-brand-primary-50/25 font-semibold text-neutral-900"
                    : "border-b border-neutral-100 text-neutral-700 last:border-b-0"}
                >
                  <th scope="row" className="whitespace-nowrap px-3 py-3.5 text-left font-semibold">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={pungutanMatrixColumns[index]} className="whitespace-nowrap px-3 py-3.5 text-right tabular-nums">
                      {value === null ? <span className="text-neutral-400">—</span> : rupiahFormatter.format(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
    <FormStepFooterActions
      stepLabel={stepLabelMap[step]}
      onPrevious={onPrevious}
      onCheck={onCheck}
      onSaveDraft={onSaveDraft}
      onNext={showNext ? onNext : undefined}
      showPrevious={showPrevious}
      showNext={showNext}
      saveDraftLabel={saveDraftLabel}
      primaryLabel={primaryLabel}
      submit={Boolean(primaryStartIcon) && primaryEndIcon === null}
    />
  );
}

export function ImportFormWorkspace({ onDomainChange }: { onDomainChange: (domain: FormDomain) => void }) {
  const localConfiguratorEnabled = isLocalConfiguratorHost();
  const [intranetConfiguratorEnabled, setIntranetConfiguratorEnabled] = useState(false);
  const configuratorEnabled = localConfiguratorEnabled || intranetConfiguratorEnabled;
  const [localConfigDraft] = useState<DocumentConfigFile | null>(() => readImportConfigDraft());
  const [configFile, setConfigFile] = useState<DocumentConfigFile>(() => localConfigDraft ?? cloneConfigFile(initialImportConfigFile));
  const [documentType, setDocumentType] = useState<string>("BC20");
  const [requiresQuarantine, setRequiresQuarantine] = useState(false);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costDraft, setCostDraft] = useState<Row>({});
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
  const [activeBarangSection, setActiveBarangSection] = useState<string>("tabel-informasi-barang");
  const [isBarangTocExpanded, setIsBarangTocExpanded] = useState(true);
  const pengajuanSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pengajuanScrollLockRef = useRef(false);
  const pengajuanScrollUnlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const entitasSectionRefs = useRef<Partial<Record<EntityKind, HTMLDivElement | null>>>({});
  const entitasScrollLockRef = useRef(false);
  const entitasScrollUnlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const barangSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (localConfiguratorEnabled) return;
    let active = true;
    const refreshAccess = () => {
      void hasIntranetConfiguratorSession().then((unlocked) => {
        if (active) setIntranetConfiguratorEnabled(unlocked);
      });
    };
    refreshAccess();
    window.addEventListener(FORM_CONFIG_ACCESS_EVENT, refreshAccess);
    return () => {
      active = false;
      window.removeEventListener(FORM_CONFIG_ACCESS_EVENT, refreshAccess);
    };
  }, [localConfiguratorEnabled]);

  useEffect(() => {
    if (localConfigDraft) {
      setStatusMessage("Draft konfigurasi Impor dari browser sedang digunakan.");
      return;
    }
    let active = true;
    void loadPublishedFormConfig("IMPORT", initialImportConfigFile).then((result) => {
      if (!active) return;
      assertValidFormOverrides(result.config, importFormCatalog);
      setConfigFile(result.config);
      if (result.source === "remote") setStatusMessage(`Konfigurasi Impor revision ${result.revision} berhasil dimuat.`);
      else if (result.source === "cache") setStatusMessage(`Konfigurasi Impor cache revision ${result.revision} digunakan karena endpoint tidak tersedia.`);
      else setStatusMessage("Konfigurasi Impor repository digunakan sebagai fallback.");
    }).catch((error) => {
      if (active) setStatusMessage(error instanceof Error ? error.message : "Konfigurasi Impor gagal dimuat.");
    });
    return () => { active = false; };
  }, [localConfigDraft]);

  const activeDocumentConfig = useMemo(() => getDocumentConfig(configFile, documentType), [configFile, documentType]);
  const documentSelectOptions = useMemo(
    () => configFile.documents
      .filter((item) => !item.archived && (configuratorEnabled || item.id !== "ALL"))
      .map((item) => ({ label: item.label, value: item.id })),
    [configFile, configuratorEnabled],
  );
  const resolvedSteps = useMemo(() => resolveDocumentSteps(activeDocumentConfig, importFormCatalog), [activeDocumentConfig]);
  const visibleWizardSteps = useMemo(() => resolvedSteps.filter((step) => step.enabled), [resolvedSteps]);
  const totalVisibleImportFields = resolvedSteps.reduce((total, step) => total + step.sections.reduce((sectionTotal, section) => sectionTotal + (section.enabled ? section.fields.filter((field) => field.enabled).length : 0), 0), 0);
  const isStepVisible = (stepId: WizardStepId) => visibleWizardSteps.some((step) => step.id === stepId);
  const getResolvedSection = (stepId: string, sectionId: string) =>
    resolvedSteps.find((step) => step.id === stepId)?.sections.find((section) => section.id === sectionId);
  const getConfiguredFieldLabel = (stepId: string, sectionId: string, fieldId: string) =>
    getResolvedSection(stepId, sectionId)?.fields.find((field) => field.id === fieldId)?.label ?? fieldId;
  const visiblePengajuanGroups = useMemo(() => {
    const sections = resolvedSteps.find((step) => step.id === "pengajuan")?.sections ?? [];
    return sections
      .filter((section) => section.enabled && section.presentation !== "modal")
      .map((section) => ({
        ...section,
        icon: stepFieldGroups.find((group) => group.id === section.id)?.icon ?? DocumentsIcon,
        fields: section.fields.filter((field) => field.enabled),
      }));
  }, [resolvedSteps]);
  const getPengajuanGroupStatus = (group: (typeof visiblePengajuanGroups)[number]): SectionStatus => {
    const fieldValue = (field: (typeof group.fields)[number]) =>
      String(formState.pengajuan[field.id] ?? field.defaultValue ?? "").trim();
    const editableFields = group.fields.filter((field) => !field.readOnly);
    const hasStarted = editableFields.some((field) => Boolean(fieldValue(field)));
    const hasMissingRequired = editableFields.some((field) => field.required && !fieldValue(field));
    const hasMissingOptional = editableFields.some((field) => !field.required && !fieldValue(field));

    if (!hasStarted) {
      return { label: "Belum Diisi", tone: "warning", detail: "Section ini belum mulai diisi." };
    }
    if (hasMissingRequired) {
      return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
    }
    if (hasMissingOptional) {
      return { label: "Belum Lengkap", tone: "warning", detail: "Field mandatory sudah terisi, tetapi masih ada informasi opsional yang kosong." };
    }
    return { label: "Lengkap", tone: "success", detail: "Seluruh field pada section ini sudah terisi." };
  };
  const costModalConfig = useMemo(
    () => resolvedSteps.find((step) => step.id === "pengajuan")?.sections.find((section) => section.id === "informasi-komponen-biaya"),
    [resolvedSteps],
  );
  const visibleEntityDefinitions = useMemo(() => {
    const sections = resolvedSteps.find((step) => step.id === "entitas")?.sections ?? [];
    return sections
      .filter((section) => section.enabled)
      .map((section) => ({ definition: entityDefinitionMap[section.id as EntityKind], config: section }))
      .filter((item): item is { definition: EntityDefinition; config: ResolvedSectionConfig } => Boolean(item.definition));
  }, [resolvedSteps]);
  const barangSectionConfig = useMemo(
    () => resolvedSteps.find((step) => step.id === "barang")?.sections.filter((section) => section.enabled) ?? [],
    [resolvedSteps],
  );
  const enabledBarangSectionIds = barangSectionConfig.map((section) => section.id);
  const karantinaHeaderSectionIds = ["karantina-hewan", "karantina-ikan", "karantina-tumbuhan"] as const;
  const visibleKarantinaHeaderSections = karantinaHeaderSectionIds
    .map((id) => barangSectionConfig.find((section) => section.id === id))
    .filter((section): section is ResolvedSectionConfig => Boolean(section));
  const karantinaHeaderRowByKind: Record<string, Row> = {
    "karantina-hewan": formState.karantinaHewan,
    "karantina-ikan": formState.karantinaIkan,
    "karantina-tumbuhan": formState.karantinaTumbuhan,
  };
  const activeBarangColumns = (getResolvedSection("barang", "barang-info")?.fields ?? [])
    .filter((field) => field.enabled)
    .map((field) => field.id)
    .filter((field) => barangMasterColumns.includes(field));
  const activeDokumenColumns = (getResolvedSection("dokumen", "dokumen-lampiran")?.fields ?? []).filter((field) => field.enabled).map((field) => field.id).filter((field) => dokumenColumns.includes(field));
  const activeKemasanColumns = (getResolvedSection("kemasan", "kemasan")?.fields ?? []).filter((field) => field.enabled).map((field) => field.id).filter((field) => kemasanColumns.includes(field));
  const activeKontainerColumns = (getResolvedSection("kemasan", "kontainer")?.fields ?? []).filter((field) => field.enabled).map((field) => field.id).filter((field) => kontainerColumns.includes(field));
  const kemasanColumnLabels = Object.fromEntries(activeKemasanColumns.map((column) => [column, getConfiguredFieldLabel("kemasan", "kemasan", column)]));
  const kontainerColumnLabels = Object.fromEntries(activeKontainerColumns.map((column) => [column, getConfiguredFieldLabel("kemasan", "kontainer", column)]));

  useEffect(() => {
    setRequiresQuarantine(documentType === "ALL" ? true : activeDocumentConfig.defaultRequiresQuarantine);
  }, [activeDocumentConfig.defaultRequiresQuarantine, documentType]);

  useEffect(() => {
    if (visibleWizardSteps.some((step) => step.id === activeStep)) return;
    setActiveStep((visibleWizardSteps[0]?.id as WizardStepId | undefined) ?? "pengajuan");
  }, [activeStep, visibleWizardSteps]);

  useEffect(() => {
    if (!statusMessage) return;
    setStatusToastVisible(true);
  }, [statusMessage]);

  useEffect(() => {
    const savedForm = sessionStorage.getItem(BC20_FORM_STORAGE_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as StoredFormState;
        setDraft(parsed.draft ?? null);
        setFormState(normalizeFormState(parsed.formState ?? createInitialFormState(parsed.draft ?? null)));
        if (parsed.documentType) setDocumentType(parsed.documentType);
        if (typeof parsed.requiresQuarantine === "boolean") setRequiresQuarantine(parsed.requiresQuarantine);
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
    const observedSections = visiblePengajuanGroups
      .map((group) => ({ group, element: pengajuanSectionRefs.current[group.id] }))
      .filter((item): item is { group: (typeof visiblePengajuanGroups)[number]; element: HTMLDivElement } => Boolean(item.element));

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
  }, [activePengajuanSection, activeStep, visiblePengajuanGroups]);

  useEffect(() => {
    if (activeStep !== "entitas") return;
    const observedSections = visibleEntityDefinitions
      .map(({ definition }) => ({ definition, element: entitasSectionRefs.current[definition.kind] }))
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
  }, [activeEntitasSection, activeStep, visibleEntityDefinitions]);

  const entitasRowsByKind = useMemo(
    () =>
      Object.fromEntries(entityDefinitions.map((definition) => [definition.kind, getSectionRow(formState.entitas, definition.title)])) as Record<EntityKind, Row | null>,
    [formState.entitas],
  );

  const entitasSectionStatus = useMemo(
    () =>
      Object.fromEntries(
        visibleEntityDefinitions.map(({ definition, config }) => {
          const row = entitasRowsByKind[definition.kind];
          const optionalInactive = definition.toggle && !isTruthyValue(row?.[definition.toggle.key]);
          const complete = !optionalInactive && config.fields.filter((field) => field.enabled && field.required).every((field) => isMandatoryFilled(row?.[field.id] ?? ""));
          const started = Boolean(row && hasAnyValue(row));
          return [definition.kind, optionalInactive ? { label: "Tidak Digunakan", tone: "neutral" } : complete ? { label: "Lengkap", tone: "success" } : started ? { label: "Wajib Dilengkapi", tone: "error" } : { label: "Belum Diisi", tone: "warning" }];
        }),
      ) as Record<EntityKind, { label: string; tone: "brand" | "neutral" | "warning" | "success" | "error" | "info" }>,
    [entitasRowsByKind, formState.entitas, visibleEntityDefinitions],
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
      "Kode Negara": penerimaRow["Kode Negara"] ?? "",
    };
    return rows;
  };

  const stepComplete = useMemo(
    () => {
      const pengajuanRequired = [
        ...visiblePengajuanGroups.flatMap((section) => section.fields.filter((field) => field.required)),
        ...(costModalConfig?.enabled ? costModalConfig.fields.filter((field) => field.enabled && field.required) : []),
      ];
      const dokumenConfig = getResolvedSection("dokumen", "dokumen-lampiran");
      const kemasanConfig = getResolvedSection("kemasan", "kemasan");
      const kontainerConfig = getResolvedSection("kemasan", "kontainer");
      const barangConfig = getResolvedSection("barang", "barang-info");
      const karantinaConfig = getResolvedSection("barang", "karantina");
      const requiredColumns = (section?: ResolvedSectionConfig) => section?.fields.filter((field) => field.enabled && field.required).map((field) => field.id) ?? [];

      return {
        pengajuan: pengajuanRequired.every((field) => isMandatoryFilled(formState.pengajuan[field.id] ?? field.defaultValue ?? "")),
        entitas: visibleEntityDefinitions.every(({ definition, config }) => {
          const row = entitasRowsByKind[definition.kind];
          if (definition.toggle && !isTruthyValue(row?.[definition.toggle.key])) return true;
          return requiredColumns(config).every((field) => isMandatoryFilled(row?.[field] ?? ""));
        }),
        dokumen:
          dokumenConfig?.enabled === false ||
          (formState.dokumen.length >= mandatoryDokumenDefinitions.length &&
            mandatoryDokumenDefinitions.every((definition, index) =>
              formState.dokumen[index]?.["Kode Dokumen"] === definition.kode &&
              requiredColumns(dokumenConfig).every((column) => isMandatoryFilled(formState.dokumen[index]?.[column] ?? "")))),
        kemasan:
          (kemasanConfig?.enabled === false || (hasAnyRows(formState.kemasan) && requiredColumns(kemasanConfig).every((column) => isMandatoryFilled(formState.kemasan[0]?.[column] ?? "")))) &&
          (kontainerConfig?.enabled === false || (hasAnyRows(formState.kontainer) && requiredColumns(kontainerConfig).every((column) => isMandatoryFilled(formState.kontainer[0]?.[column] ?? "")))),
        barang:
          (barangConfig?.enabled === false || (hasAnyRows(formState.barang) && requiredColumns(barangConfig).every((column) => isMandatoryFilled(formState.barang[0]?.[column] ?? "")))) &&
          (!requiresQuarantine || karantinaConfig?.enabled === false || (hasAnyRows(formState.karantina) && requiredColumns(karantinaConfig).every((column) => isMandatoryFilled(formState.karantina[0]?.[column] ?? "")))),
      };
    },
    [formState, entitasRowsByKind, visibleEntityDefinitions, visiblePengajuanGroups, resolvedSteps, requiresQuarantine, costModalConfig],
  );

  const reviewStatus = useMemo(() => {
    const sections = visibleWizardSteps.map((step) => step.id).filter((id): id is Exclude<WizardStepId, "review"> => id !== "review");
    return sections.every((section) => stepComplete[section]);
  }, [stepComplete, visibleWizardSteps]);

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
      cukai: formState.barangCukai.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      spesifikasi: formState.spesifikasi.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      dokumen: formState.barangDokumen.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      vd: formState.barangVd.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      tarif: formState.barangTarif.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
      karantina: formState.karantina.map((row, index) => ({ row, index })).filter(({ row }) => row["Seri Barang"] === workspaceBarang?.Seri),
    }),
    [formState, workspaceBarang],
  );

  const updateRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, rowIndex: number, column: string, value: string) => {
    setFormState((current) => {
      const rows = [...current[section]];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };
      return { ...current, [section]: rows };
    });
  };

  const addRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, columns: string[], template?: Row) => {
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
    const map: Record<BarangDetailSection, keyof Pick<FormState, "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      cukai: "barangCukai",
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
    const map: Record<BarangDetailSection, { section: keyof Pick<FormState, "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">; columns: string[]; template: Row }> = {
      cukai: { section: "barangCukai", columns: barangCukaiColumns, template: { "Seri Barang": seri } },
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
        template: { "Seri Barang": seri, Komoditi: "", Klasifikasi: "", Jumlah: "", Satuan: "", "Nama Umum": "", "Nama Latin": "" },
      },
    };
    const config = map[section];
    addRow(config.section, config.columns, template ?? config.template);
  };

  const removeBarangDetailRow = (section: BarangDetailSection, rowIndex: number) => {
    const map: Record<BarangDetailSection, keyof Pick<FormState, "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      cukai: "barangCukai",
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
      barangCukai: [],
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
      barangCukai: [],
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

  const createDokumenDraftRow = (base?: Row) =>
    createRow(dokumenColumns, {
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
    setDokumenEditRow(createRow(dokumenColumns, formState.dokumen[rowIndex] ?? createDokumenDraftRow()));
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
      ? createRow(kemasanColumns, { "Jenis Kemasan": "", Merek: "", ...base })
      : createRow(kontainerColumns, { "Nomor Kontainer": "", Ukuran: "", "Jenis Muatan": "", Tipe: "", ...base });

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
      cukai: barangCukaiColumns.slice(1),
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
    const map: Record<BarangDetailSection, keyof Pick<FormState, "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">> = {
      cukai: "barangCukai",
      spesifikasi: "spesifikasi",
      dokumen: "barangDokumen",
      vd: "barangVd",
      tarif: "barangTarif",
      karantina: "karantina",
    };
    const columnsMap: Record<BarangDetailSection, string[]> = {
      cukai: barangCukaiColumns,
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

  const removeRow = (section: keyof Pick<FormState, "entitas" | "dokumen" | "kemasan" | "kontainer" | "barang" | "barangCukai" | "spesifikasi" | "barangDokumen" | "barangVd" | "barangTarif" | "karantina">, columns: string[]) => {
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

  const karantinaHeaderStateKey: Record<string, "karantinaHewan" | "karantinaIkan" | "karantinaTumbuhan"> = {
    "karantina-hewan": "karantinaHewan",
    "karantina-ikan": "karantinaIkan",
    "karantina-tumbuhan": "karantinaTumbuhan",
  };

  const updateKarantinaHeaderField = (sectionId: string, key: string, value: string) => {
    const stateKey = karantinaHeaderStateKey[sectionId];
    if (!stateKey) return;
    setFormState((current) => ({
      ...current,
      [stateKey]: {
        ...current[stateKey],
        [key]: value,
      },
    }));
  };

  const costValue = (key: string) => Number.parseFloat(costDraft[key] || "0") || 0;
  const costA = costValue("ikbHargaInvoice") + costValue("ikbPembayaranTidakLangsung");
  const costC = costA - costValue("ikbDiskon");
  const costD = ["ikbKomisiPenjualan", "ikbBiayaPengemasan", "ikbBiayaPengepakan", "ikbAssist", "ikbRoyaltiLisensi", "ikbProceeds", "ikbFreight", "ikbPemuatan", "ikbGaransi"].reduce((total, key) => total + costValue(key), 0);
  const costE = costC + costD;
  const costF = ["ikbKepentinganSendiri", "ikbPascaImpor", "ikbPajakInternal", "ikbBunga", "ikbDividen"].reduce((total, key) => total + costValue(key), 0);
  const costG = costE - costF;
  const resetCostDraft = () => setCostDraft(Object.fromEntries((costModalConfig?.fields ?? []).filter((field) => field.enabled).map((field) => [field.id, field.inputType === "number" ? "0.00" : ""])));
  const saveCostDraft = () => {
    setFormState((current) => ({ ...current, pengajuan: { ...current.pengajuan, ...costDraft } }));
    setCostModalOpen(false);
    setStatusMessage("Informasi Komponen Biaya berhasil disimpan.");
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
            "Kode Negara": penerimaRow["Kode Negara"] ?? "",
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
      documentType,
      requiresQuarantine,
    };
    sessionStorage.setItem(BC20_FORM_STORAGE_KEY, JSON.stringify(snapshot));
    setStatusMessage("Draft form disimpan lokal di browser.");
  };

  const submitForm = () => {
    saveSnapshot();
    setStatusMessage("Pengajuan mock berhasil disubmit. Silakan lanjut integrasi backend.");
  };

  const rowHasValue = (row: Row | undefined) => Boolean(row && Object.values(row).some((value) => String(value ?? "").trim()));
  const importDataStepStarted = {
    pengajuan: rowHasValue(formState.pengajuan),
    entitas: formState.entitas.some(rowHasValue),
    dokumen: formState.dokumen.some(rowHasValue),
    kemasan: formState.kemasan.some(rowHasValue) || formState.kontainer.some(rowHasValue),
    barang: formState.barang.some(rowHasValue) || formState.barangCukai.some(rowHasValue) || formState.spesifikasi.some(rowHasValue) || formState.barangDokumen.some(rowHasValue) || formState.barangVd.some(rowHasValue) || formState.barangTarif.some(rowHasValue) || formState.karantina.some(rowHasValue),
  };
  const importStepStarted: Record<WizardStepId, boolean> = { ...importDataStepStarted, review: Object.values(importDataStepStarted).some(Boolean) };
  const importStepStatus = (stepId: WizardStepId): FormStepStatus => {
    const complete = stepId === "review" ? reviewStatus : Boolean(stepComplete[stepId]);
    if (complete) return "success";
    return importStepStarted[stepId] ? "error" : "warning";
  };
  const navigateStep = (current: WizardStepId, delta: number) => {
    const order = visibleWizardSteps.map((step) => step.id as WizardStepId);
    const index = order.indexOf(current);
    const nextIndex = Math.min(order.length - 1, Math.max(0, index + delta));
    return order[nextIndex] ?? current;
  };
  const handleCheckCompleteness = () => {
    const stepKey = activeStep;
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

  const scrollToBarangSection = (id: string) => {
    setActiveBarangSection(id);
    const target = barangSectionRefs.current[id];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reviewStatusCards: Array<{
    id: Exclude<WizardStepId, "review">;
    label: string;
    description: string;
    actionLabel: string;
    icon: ReactNode;
  }> = [
    {
      id: "pengajuan",
      label: "Pengajuan",
      description: stepComplete.pengajuan ? "Semua section pengajuan sudah lengkap" : "2 section perlu diperiksa",
      actionLabel: "Periksa Pengajuan",
      icon: <BriefcaseIcon className="h-4 w-4" />,
    },
    {
      id: "entitas",
      label: "Entitas",
      description: stepComplete.entitas ? "Data entitas utama sudah lengkap" : "Data PPJK belum lengkap",
      actionLabel: "Periksa Entitas",
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      id: "dokumen",
      label: "Dokumen Lampiran",
      description: `${summaryCounts.dokumen} dokumen tersedia`,
      actionLabel: stepComplete.dokumen ? "Lihat Dokumen" : "Periksa Dokumen",
      icon: <DocumentsIcon className="h-4 w-4" />,
    },
    {
      id: "kemasan",
      label: "Kemasan & Kontainer",
      description: `${summaryCounts.kemasan} kemasan dan ${summaryCounts.kontainer} kontainer`,
      actionLabel: stepComplete.kemasan ? "Lihat Data" : "Periksa Data",
      icon: <TruckIcon className="h-4 w-4" />,
    },
    {
      id: "barang",
      label: "Barang",
      description: stepComplete.barang ? `${summaryCounts.barang} barang telah lengkap` : "2 dari 3 barang perlu dilengkapi",
      actionLabel: "Periksa Barang",
      icon: <HamburgerMenuIcon className="h-4 w-4" />,
    },
  ];
  const visibleReviewStatusCards = reviewStatusCards.filter((item) => isStepVisible(item.id));
  const completeReviewStatusCount = visibleReviewStatusCards.filter((item) => stepComplete[item.id]).length;
  const reviewCompletionPercentage = visibleReviewStatusCards.length > 0
    ? Math.round((completeReviewStatusCount / visibleReviewStatusCards.length) * 100)
    : 0;

  const navigateFromReview = (stepId: Exclude<WizardStepId, "review">) => {
    setActiveStep(stepId);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const legacyResponsiblePerson = entitasRowsByKind.penanggungJawab;
  const responsiblePerson = {
    name: resolveResponsibleValue([formState.pengajuan.penanggungJawabNama, legacyResponsiblePerson?.Nama], "Andi Pratama"),
    position: resolveResponsibleValue([formState.pengajuan.penanggungJawabJabatan, legacyResponsiblePerson?.Jabatan], "Direktur Operasional"),
    city: resolveResponsibleValue([formState.pengajuan.penanggungJawabKota, legacyResponsiblePerson?.Kota], "Kota Jakarta Selatan"),
    date: formatReviewDate(formState.pengajuan.penanggungJawabTanggal),
  };

  const navigateToResponsiblePerson = () => {
    setActiveStep("pengajuan");
    window.setTimeout(() => scrollToPengajuanSection("penanggung-jawab"), 0);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-3 py-4 sm:px-4 sm:py-5">
      <Toast
        open={statusToastVisible && Boolean(statusMessage)}
        message={statusMessage}
        tone={inferToastTone(statusMessage)}
        onClose={() => setStatusToastVisible(false)}
      />
      <SmartDraftBanner />

      <DemoFormSelector
        domain="IMPORT"
        onDomainChange={onDomainChange}
        documentId={documentType}
        onDocumentChange={setDocumentType}
        documentOptions={documentSelectOptions}
        requiresQuarantine={requiresQuarantine}
        onRequiresQuarantineChange={setRequiresQuarantine}
        quarantineDisabled={documentType === "ALL"}
        technicalBadges={["Domain: Impor", `${visibleWizardSteps.length} step`, `${totalVisibleImportFields} field aktif`, `Mapping ${activeDocumentConfig.label}`]}
      />

      {configuratorEnabled ? (
        <section className="hidden" aria-hidden="true">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary-600">Development tool · localhost only</div>
              <h2 className="mt-1 text-[18px] font-semibold text-neutral-800">Konfigurasi Form Pengajuan</h2>
              <p className="mt-1 text-[12px] leading-5 text-neutral-600">Area internal untuk mapping jenis dokumen. Area ini tidak tersedia melalui IP atau build GitHub Pages.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[260px_auto_auto] sm:items-end">
              <Select
                label="Jenis Dokumen"
                value={documentType}
                onValueChange={setDocumentType}
                options={configFile.documents.filter((item) => !item.archived).map((item) => ({ label: item.label, value: item.id }))}
              />
              <label className="flex h-10 items-center gap-2 rounded-md border border-border-primary bg-white px-3 text-[12px] font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={requiresQuarantine}
                  disabled={documentType === "ALL"}
                  onChange={(event) => setRequiresQuarantine(event.target.checked)}
                  className="h-4 w-4 accent-brand-primary-500"
                />
                Memerlukan Karantina
              </label>
              <Button variant="primary" size="sm" className="h-10 whitespace-nowrap" onClick={() => setConfiguratorOpen(true)}>Kelola Konfigurasi Form</Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${sectionTone} p-4 pb-6 sm:p-5 sm:pb-7`}>
        <FormDocumentHeader
          eyebrow={`Form ${activeDocumentConfig.label}`}
          title={`Form Pengajuan ${activeDocumentConfig.label}`}
          description={activeDocumentConfig.description ?? `Form ${activeDocumentConfig.label} digunakan untuk melengkapi data pemberitahuan impor barang.`}
        />

        <FormStepper
          items={visibleWizardSteps.map((step) => ({ ...step, icon: wizardStepIcons[step.id as WizardStepId], status: importStepStatus(step.id as WizardStepId) }))}
          activeId={activeStep}
          onChange={(stepId) => setActiveStep(stepId as WizardStepId)}
        />

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
                  {visiblePengajuanGroups.map((group) => {
                    const active = activePengajuanSection === group.id;
                    const Icon = group.icon;
                    const description = group.description ?? "Edit field secara langsung di bawah ini.";
                    const sectionStatus = getPengajuanGroupStatus(group);
                    if (isPengajuanTocExpanded) {
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => scrollToPengajuanSection(group.id)}
                          aria-label={group.label}
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
                          <span className="min-w-0 flex-1 pr-7">
                            <span className="block text-[12px] font-semibold text-neutral-800">{group.label}</span>
                            <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{description}</span>
                          </span>
                          <span className="absolute right-2.5 top-2.5"><SectionStatusIconBadge status={sectionStatus} /></span>
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
                            <div className="text-[12px] font-semibold text-neutral-800">{group.label}</div>
                            <div className="mt-1 text-[11px] leading-5 text-neutral-600">{description}</div>
                            <div className="mt-2 text-[11px] font-semibold text-neutral-700">Status: {sectionStatus.label}</div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => scrollToPengajuanSection(group.id)}
                          aria-label={group.label}
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
                          <span className="absolute -right-1 -top-1"><SectionStatusIconBadge status={sectionStatus} /></span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex flex-col gap-4">
              {visiblePengajuanGroups.map((group) => (
                <div
                  key={group.id}
                  ref={(node) => {
                    pengajuanSectionRefs.current[group.id] = node;
                  }}
                  id={group.id}
                  className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]"
                >
                  <AccordionCard
                    title={group.label}
                    subtitle={group.description ?? "Edit field secara langsung di bawah ini."}
                    leadingIcon={group.icon({ className: "h-5 w-5" })}
                    headerActions={(() => {
                      const status = getPengajuanGroupStatus(group);
                      return <SectionStatusTextBadge status={status} />;
                    })()}
                    defaultOpen
                  >
                    {group.groups?.length ? (() => {
                      const visibleFieldGroups = group.groups.filter((fieldGroup) => group.fields.some((field) => field.groupId === fieldGroup.id));
                      const columnsClass = visibleFieldGroups.length === 2 ? "xl:grid-cols-2" : visibleFieldGroups.length === 1 ? "xl:grid-cols-1" : "xl:grid-cols-3";
                      return (
                      <div className={["grid gap-4", columnsClass].join(" ")}>
                        {visibleFieldGroups.map((fieldGroup) => (
                          <div key={fieldGroup.id} className="rounded-2xl border border-border-primary bg-background-primary/15 p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-[14px] font-semibold text-neutral-800">{fieldGroup.label}</h3>
                              {group.id === "transaksi" && fieldGroup.id === "harga" && costModalConfig?.enabled ? (
                                <Button variant="primary" size="sm" onClick={() => {
                                  setCostDraft(Object.fromEntries(costModalConfig.fields.filter((field) => field.enabled).map((field) => [field.id, formState.pengajuan[field.id] ?? field.defaultValue ?? ""])));
                                  setCostModalOpen(true);
                                }}>Informasi Komponen Biaya</Button>
                              ) : null}
                            </div>
                            <div className="grid gap-4">
                              {group.fields.filter((field) => field.groupId === fieldGroup.id).map((field) => (
                                <FormField key={field.id} label={field.label} value={formState.pengajuan[field.id] ?? field.defaultValue ?? ""} onChange={(value) => updatePengajuanField(field.id, value)} placeholder={field.label} mandatory={field.required} helperText={field.helperText} inputType={field.inputType} readOnly={field.readOnly} options={field.options} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      );
                    })() : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {group.fields.map((field) => (
                          <FormField key={field.id} label={field.label} value={formState.pengajuan[field.id] ?? field.defaultValue ?? ""} onChange={(value) => updatePengajuanField(field.id, value)} placeholder={field.label} mandatory={field.required} helperText={field.helperText} inputType={field.inputType} readOnly={field.readOnly} options={field.options} />
                        ))}
                      </div>
                    )}
                  </AccordionCard>
                </div>
              ))}
            </div>
          </div>
          <StepFooterActions
            step="pengajuan"
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(navigateStep("pengajuan", 1))}
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
                  {visibleEntityDefinitions.map(({ definition, config }) => {
                    const status = entitasSectionStatus[definition.kind];
                    const tocStatusLabel: SectionStatus["label"] = status.label === "Lengkap" || status.label === "Wajib Dilengkapi" || status.label === "Tidak Digunakan" || status.label === "Belum Lengkap" ? status.label : "Belum Diisi";
                    const tocStatusTone: SectionStatus["tone"] = status.tone === "success" || status.tone === "error" || status.tone === "warning" ? status.tone : "secondary";
                    const tocStatus: SectionStatus = {
                      label: tocStatusLabel,
                      tone: tocStatusTone,
                      detail: tocStatusLabel === "Lengkap"
                        ? "Seluruh field mandatory pada section ini sudah terisi."
                        : tocStatusLabel === "Wajib Dilengkapi"
                          ? "Masih ada field mandatory yang belum diisi."
                          : tocStatusLabel === "Tidak Digunakan"
                            ? "Section kondisional tidak digunakan pada pengajuan ini."
                            : "Section ini belum mulai diisi.",
                    };
                    const active = activeEntitasSection === definition.kind;
                    const Icon = definition.icon;

                    if (isEntitasTocExpanded) {
                      return (
                        <button
                          key={definition.kind}
                          type="button"
                          onClick={() => scrollToEntitasSection(definition.kind)}
                          aria-label={config.label}
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
                          <span className="min-w-0 flex-1 pr-7">
                            <span className="text-[12px] font-semibold text-neutral-800">{config.label}</span>
                            <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{config.description ?? definition.description}</span>
                          </span>
                          <span className="absolute right-2.5 top-2.5"><SectionStatusIconBadge status={tocStatus} /></span>
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
                            <div className="text-[12px] font-semibold text-neutral-800">{config.label}</div>
                            <div className="mt-1 text-[11px] leading-5 text-neutral-600">{config.description ?? definition.description}</div>
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
                          aria-label={config.label}
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
                          <span className={[
                            "absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-1",
                            tocStatus.tone === "success"
                              ? "bg-success-50 text-success-600 ring-success-100"
                              : tocStatus.tone === "error"
                                ? "bg-error-50 text-error-600 ring-error-100"
                                : tocStatus.tone === "warning"
                                  ? "bg-warning-50 text-warning-700 ring-warning-100"
                                  : "bg-neutral-100 text-neutral-600 ring-neutral-200",
                          ].join(" ")}>{tocStatus.tone === "success" ? "✓" : tocStatus.tone === "secondary" ? "–" : "!"}</span>
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
                {visibleEntityDefinitions.map(({ definition, config }) => {
                  const baseFields = [...(definition.headerFields ?? []), ...definition.fields];
                  const configuredDefinition: EntityDefinition = {
                    ...definition,
                    headerFields: undefined,
                    fields: config.fields.filter((field) => field.enabled).map((field) => {
                      const base = baseFields.find((item) => item.key === field.id);
                      return {
                        ...base,
                        key: field.id,
                        label: field.label,
                        type: base?.type === "textarea" || base?.type === "identity" ? base.type : field.inputType === "select" ? "select" : "input",
                        inputType: field.inputType === "date" ? "date" : field.inputType === "number" ? "number" : "text",
                        readOnly: field.readOnly || field.id === "Jenis Entitas",
                        required: field.required,
                        note: field.helperText ?? base?.note,
                        span: base?.span ?? 1,
                      } satisfies EntityFieldConfig;
                    }),
                    requiredFields: config.fields.filter((field) => field.enabled && field.required).map((field) => field.id),
                  };
                  const entityRow = entitasRowsByKind[definition.kind] ?? getSectionRow(formState.entitas, definition.title);
                  const status = getSectionStatus(configuredDefinition, entityRow, formState.entitas);
                  const Icon = definition.icon;
                  const isToggleActive = configuredDefinition.toggle ? isTruthyValue(entityRow?.[configuredDefinition.toggle.key]) : true;
                  const isPembeliSame = definition.kind === "pembeli" && isTruthyValue(entityRow?.["Sama dengan Penerima"]);
                  const isOptionalCollapsed = definition.kind !== "pembeli" && Boolean(configuredDefinition.toggle) && !isToggleActive;

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
                        title={config.label}
                        subtitle={config.description ?? definition.description}
                        defaultOpen={definition.defaultOpen ?? true}
                        leadingIcon={<Icon className="h-5 w-5" />}
                        headerActions={
                          <div className="flex items-center gap-2">
                            {definition.copyFrom ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  const sourceRow = entitasRowsByKind[definition.copyFrom!.kind];
                                  if (!sourceRow) return;
                                  Object.entries(definition.copyFrom!.map).forEach(([targetKey, sourceKey]) => {
                                    updateEntityField(definition.kind, targetKey, sourceRow[sourceKey] ?? "");
                                  });
                                }}
                              >
                                {definition.copyFrom.label}
                              </Button>
                            ) : null}
                            <SectionStatusTextBadge status={normalizeSectionStatus(status)} />
                          </div>
                        }
                      >
                        <div className="flex flex-col gap-4">
                          {configuredDefinition.headerFields?.length ? (
                            <div className="flex flex-col gap-4">
                              <div className="grid grid-cols-1 gap-4 md:max-w-md">
                                {configuredDefinition.headerFields.map((field) => (
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

                          {configuredDefinition.toggle ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-background-primary/25 px-4 py-3">
                              <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{configuredDefinition.toggle.label}</div>
                                <div className="mt-1 text-[12px] leading-5 text-neutral-600">
                                  {definition.kind === "pembeli"
                                    ? (isToggleActive ? definition.emptyState : "Section aktif dan siap diisi.")
                                    : (isToggleActive ? "Section aktif dan siap diisi." : definition.emptyState)}
                                </div>
                              </div>
                              <EntitasCheckbox
                                  label={configuredDefinition.toggle.label}
                                checked={isToggleActive}
                                onChange={(checked) => {
                                    updateEntityField(definition.kind, configuredDefinition.toggle!.key, checked ? "Ya" : "");
                                }}
                              />
                            </div>
                          ) : null}

                          {isOptionalCollapsed ? <SectionEmptyState text={definition.emptyState} /> : null}

                          {(!configuredDefinition.toggle || isToggleActive || definition.kind === "pembeli") && !isOptionalCollapsed ? (
                            <>
                              {definition.kind === "pembeli" && isPembeliSame ? (
                                <EntitasSectionNote text="Data pembeli disamakan dengan penerima. Ubah ceklis bila ingin mengisi manual." />
                              ) : null}
                              <EntityCardContent
                                entity={configuredDefinition}
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
            onPrevious={() => setActiveStep(navigateStep("entitas", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(navigateStep("entitas", 1))}
          />
        </div>
      )}

      {activeStep === "dokumen" && (
        <div className="flex flex-col gap-4">
          <AccordionCard
            title={getResolvedSection("dokumen", "dokumen-lampiran")?.label ?? "Dokumen Lampiran"}
            subtitle={getResolvedSection("dokumen", "dokumen-lampiran")?.description ?? "Tiga dokumen awal INV, PL, dan BL wajib tersedia. Record tambahan boleh ditambah dan dihapus."}
            leadingIcon={<DocumentsIcon className="h-5 w-5" />}
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
                  fields={getResolvedSection("dokumen", "dokumen-lampiran")?.fields}
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
                      {activeDokumenColumns.map((column) => (
                        <th key={column} className="px-3 py-2 font-semibold whitespace-nowrap">
                          {getConfiguredFieldLabel("dokumen", "dokumen-lampiran", column)}
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
                        <Fragment key={`${rowIndex}-${row["Kode Dokumen"] ?? rowIndex}`}>
                          <tr
                            className={[
                              "border-t border-border-primary align-top",
                              isMandatoryRow ? "bg-brand-primary-50/10" : "hover:bg-brand-primary-50/20",
                            ].join(" ")}
                          >
                            <td className="px-3 py-3 font-medium text-neutral-600">{rowIndex + 1}</td>
                            {activeDokumenColumns.map((column) => (
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
                              <td colSpan={activeDokumenColumns.length + 2} className="border-t border-border-primary bg-background-primary/30 px-3 py-3">
                                <DokumenLampiranEditor
                                  fields={getResolvedSection("dokumen", "dokumen-lampiran")?.fields}
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
            onPrevious={() => setActiveStep(navigateStep("dokumen", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(navigateStep("dokumen", 1))}
          />
        </div>
      )}

      {activeStep === "kemasan" && (
        <div className="flex flex-col gap-4">
          {getResolvedSection("kemasan", "kemasan")?.enabled !== false ? (
          <AccordionCard
            title={getResolvedSection("kemasan", "kemasan")?.label ?? "Kemasan"}
            subtitle={getResolvedSection("kemasan", "kemasan")?.description ?? "Data kemasan bisa ditambah lewat form collapsible agar area tabel tetap rapi."}
            leadingIcon={<TruckIcon className="h-5 w-5" />}
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
                  columns={activeKemasanColumns}
                  columnLabels={kemasanColumnLabels}
                  fieldConfigs={getResolvedSection("kemasan", "kemasan")?.fields}
                  value={kemasanDraftRow}
                  onChange={updateKemasanDraftField}
                  onSave={saveKemasanDraftRow}
                  onCancel={closeKemasanAddForm}
                  saveLabel="Simpan"
                />
              ) : null}

              <EditableTable
                columns={activeKemasanColumns}
                columnLabels={kemasanColumnLabels}
                fieldConfigs={getResolvedSection("kemasan", "kemasan")?.fields}
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
          ) : null}
          {getResolvedSection("kemasan", "kontainer")?.enabled !== false ? (
          <AccordionCard
            title={getResolvedSection("kemasan", "kontainer")?.label ?? "Kontainer"}
            subtitle={getResolvedSection("kemasan", "kontainer")?.description ?? "Tambah record kontainer lewat toolbar, record lama tetap bisa diedit inline."}
            leadingIcon={<TruckIcon className="h-5 w-5" />}
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
                  columns={activeKontainerColumns}
                  columnLabels={kontainerColumnLabels}
                  fieldConfigs={getResolvedSection("kemasan", "kontainer")?.fields}
                  value={kontainerDraftRow}
                  onChange={updateKontainerDraftField}
                  onSave={saveKontainerDraftRow}
                  onCancel={closeKontainerAddForm}
                  saveLabel="Simpan"
                />
              ) : null}

              <EditableTable
                columns={activeKontainerColumns}
                columnLabels={kontainerColumnLabels}
                fieldConfigs={getResolvedSection("kemasan", "kontainer")?.fields}
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
          ) : null}
          <StepFooterActions
            step="kemasan"
            onPrevious={() => setActiveStep(navigateStep("kemasan", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(navigateStep("kemasan", 1))}
          />
        </div>
      )}

      {activeStep === "barang" && (
        <div className="flex flex-col gap-4">
          <div
            className={[
              "grid gap-4",
              isBarangTocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]",
            ].join(" ")}
          >
            <aside className={tocStickyClass}>
              <div className={[tocShellClass, isBarangTocExpanded ? "p-4" : "p-2"].join(" ")}>
                <div className={["flex items-start gap-3", isBarangTocExpanded ? "justify-between" : "justify-center"].join(" ")}>
                  {isBarangTocExpanded ? (
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div>
                      <div className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section barang yang ingin ditinjau.</div>
                    </div>
                  ) : (
                    <div className="sr-only">
                      <div>Table of Content</div>
                      <div>Lompat ke section barang yang ingin ditinjau.</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBarangTocExpanded((value) => !value)}
                    aria-expanded={isBarangTocExpanded}
                    aria-label={isBarangTocExpanded ? "Ciutkan TOC barang" : "Buka TOC barang"}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50"
                    title={isBarangTocExpanded ? "Ciutkan TOC" : "Buka TOC"}
                  >
                    {isBarangTocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className={[tocScrollClass, "mt-4 flex flex-col gap-2", isBarangTocExpanded ? "" : "mt-3"].join(" ")}>
                  {barangStepTocItems
                    .filter((item) => item.id !== "karantina" || requiresQuarantine)
                    .map((item) => {
                      const Icon = item.icon;
                      const active = activeBarangSection === item.id || (item.children?.some((child) => child.id === activeBarangSection) ?? false);

                      return (
                        <div key={item.id} className="space-y-2">
                          {isBarangTocExpanded ? (
                            <button
                              type="button"
                              onClick={() => scrollToBarangSection(item.id)}
                              aria-label={item.label}
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
                                <span className="text-[12px] font-semibold text-neutral-800">{item.label}</span>
                                <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{item.description}</span>
                              </span>
                            </button>
                          ) : (
                            <Tooltip
                              placement="right"
                              offset={14}
                              className="block w-full"
                              content={
                                <div>
                                  <div className="text-[12px] font-semibold text-neutral-800">{item.label}</div>
                                  <div className="mt-1 text-[11px] leading-5 text-neutral-600">{item.description}</div>
                                </div>
                              }
                            >
                              <button
                                type="button"
                                onClick={() => scrollToBarangSection(item.children?.length ? item.children[0].id : item.id)}
                                aria-label={item.label}
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
                          )}

                          {item.children && isBarangTocExpanded ? (
                            <div className="ml-4 space-y-2 border-l border-border-primary pl-3">
                              {item.children.map((child) => {
                                const childActive = activeBarangSection === child.id;
                                const ChildIcon = child.icon;
                                return (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => scrollToBarangSection(child.id)}
                                    className={[
                                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                                      childActive
                                        ? "border-brand-primary-400 bg-brand-primary-50/70"
                                        : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/30",
                                    ].join(" ")}
                                  >
                                    <span
                                      className={[
                                        "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                        childActive ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
                                      ].join(" ")}
                                    >
                                      <ChildIcon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block text-[11px] font-semibold text-neutral-800">{child.label}</span>
                                      <span className="mt-0.5 block text-[10px] leading-4 text-neutral-600">{child.description}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>
            </aside>

            <div className="flex flex-col gap-4">
              <div
                ref={(node) => {
                  barangSectionRefs.current["tabel-informasi-barang"] = node;
                }}
                id="tabel-informasi-barang"
                className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]"
              >
                <section className={`${sectionTone} p-4 sm:p-5`}>
                  <div className="flex flex-col gap-4 border-b border-border-primary pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600"><DocumentsIcon className="h-5 w-5" /></span>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Step Barang</div>
                        <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Daftar Barang</h2>
                        <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
                          Step ini hanya menampilkan tabel utama. Detail turunan tiap seri dikelola lewat drawer kanan melalui tombol Kelola Detail.
                        </p>
                      </div>
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
                    <Button variant="error" size="sm" onClick={() => setClearBarangOpen(true)}>
                      Clear Data
                    </Button>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-border-primary">
                    <table className="min-w-max table-fixed border-collapse text-left text-[12px]">
                      <thead className="bg-brand-primary-500 text-white">
                        <tr>
                          {activeBarangColumns.map((column) => (
                            <th key={column} className="px-3 py-3 font-semibold whitespace-nowrap">
                              {getConfiguredFieldLabel("barang", "barang-info", column)}
                            </th>
                          ))}
                          <th className="w-[140px] px-3 py-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formState.barang.map((row, rowIndex) => (
                          <tr key={row.Seri || rowIndex} className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                            {activeBarangColumns.map((column) => {
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
              </div>

              {requiresQuarantine
                ? visibleKarantinaHeaderSections.map((section) => (
                    <div
                      key={section.id}
                      ref={(node) => {
                        barangSectionRefs.current[section.id] = node;
                      }}
                      id={section.id}
                      className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]"
                    >
                      <AccordionCard title={section.label} subtitle={section.description ?? "Edit field secara langsung di bawah ini."} leadingIcon={<CheckReadIcon className="h-5 w-5" />} defaultOpen={false}>
                        <div className="mb-4 grid grid-cols-1 gap-4 border-b border-border-primary pb-4 sm:grid-cols-3">
                          {[
                            { label: "Nomor Pengajuan", value: formState.pengajuan.nomorPengajuan || "-", required: true },
                            { label: "Nomor Pendaftaran", value: formState.pengajuan.nomorPendaftaran || "-" },
                            { label: "Tanggal Pendaftaran", value: formState.pengajuan.tanggalPendaftaran || "-" },
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="text-[12px] font-medium text-neutral-700">
                                {item.label}
                                {item.required ? <span className="ml-1 text-error-500">*</span> : null}
                              </div>
                              <div className="mt-1.5 text-[13px] font-semibold text-neutral-800">{item.value}</div>
                            </div>
                          ))}
                        </div>
                        {section.groups?.length
                          ? (() => {
                              const visibleFieldGroups = section.groups.filter((fieldGroup) => section.fields.some((field) => field.groupId === fieldGroup.id));
                              const fieldColumnsClass: Record<string, string> = {
                                "kantor-karantina": "sm:grid-cols-2",
                                "informasi-tujuan": "sm:grid-cols-2",
                                "informasi-impor": "sm:grid-cols-2",
                                pengangkut: "sm:grid-cols-2",
                                "pemeriksaan-karantina": "sm:grid-cols-3",
                                "instalasi-karantina": "sm:grid-cols-3",
                              };
                              return (
                                <div className="flex flex-col gap-5">
                                  {visibleFieldGroups.map((fieldGroup) => (
                                    <div key={fieldGroup.id} className="flex flex-col gap-4">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-primary pb-2">
                                        <h3 className="text-[13px] font-semibold text-neutral-800">{fieldGroup.label}</h3>
                                        {fieldGroup.id === "kantor-karantina" ? (
                                          <Button variant="outline" size="sm" onClick={() => void 0}>
                                            Cek Relasi Importir
                                          </Button>
                                        ) : null}
                                        {fieldGroup.id === "pengangkut" ? (
                                          <Button variant="outline" size="sm" onClick={() => void 0}>
                                            Salin dari Data Pengangkutan
                                          </Button>
                                        ) : null}
                                      </div>
                                      <div className={["grid grid-cols-1 gap-4", fieldColumnsClass[fieldGroup.id] ?? "sm:grid-cols-2"].join(" ")}>
                                        {section.fields
                                          .filter((field) => field.groupId === fieldGroup.id)
                                          .map((field) => (
                                            <div key={field.id} className={field.inputType === "textarea" ? "sm:col-span-2" : undefined}>
                                              <FormField
                                                label={field.label}
                                                value={karantinaHeaderRowByKind[section.id]?.[field.id] ?? field.defaultValue ?? ""}
                                                onChange={(value) => updateKarantinaHeaderField(section.id, field.id, value)}
                                                placeholder={field.label}
                                                mandatory={field.required}
                                                helperText={field.helperText}
                                                inputType={field.inputType}
                                                readOnly={field.readOnly}
                                                options={field.options}
                                              />
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          : null}
                      </AccordionCard>
                    </div>
                  ))
                : null}
            </div>
          </div>

          <StepFooterActions
            step="barang"
            onPrevious={() => setActiveStep(navigateStep("barang", -1))}
            onCheck={handleCheckCompleteness}
            onSaveDraft={saveSnapshot}
            onNext={() => setActiveStep(navigateStep("barang", 1))}
          />

          <BarangWorkspaceDrawer
            open={barangWorkspaceOpen}
            item={workspaceBarang}
            mode={barangWorkspaceMode}
            activeTab={barangWorkspaceTab}
            onTabChange={setBarangWorkspaceTab}
            onClose={() => setBarangWorkspaceOpen(false)}
            onExited={() => {
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
            enabledSectionIds={enabledBarangSectionIds}
            requiresQuarantine={requiresQuarantine}
            masterFields={getResolvedSection("barang", "barang-info")?.fields ?? []}
            detailFields={{
              cukai: getResolvedSection("barang", "barang-cukai")?.fields,
              spesifikasi: getResolvedSection("barang", "barang-spesifikasi")?.fields,
              dokumen: getResolvedSection("barang", "barang-dokumen")?.fields,
              vd: getResolvedSection("barang", "barang-vd")?.fields,
              tarif: getResolvedSection("barang", "barang-tarif")?.fields,
              karantina: getResolvedSection("barang", "karantina")?.fields,
            }}
            sectionLabels={Object.fromEntries(barangSectionConfig.map((section) => [section.id, section.label]))}
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

          </div>

          <div className={`${sectionTone} bg-background-primary/20 p-4 sm:p-5`}>
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

          <PungutanSummaryCard />

          <section className={`${sectionTone} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Status Data</div>
                <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                  Pilih bagian yang perlu diperiksa kembali sebelum pengajuan dikirim.
                </p>
              </div>
              <div className="w-full max-w-[320px]">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-medium text-neutral-700">Kelengkapan Form</span>
                  <span className="font-semibold text-brand-primary-700">{reviewCompletionPercentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-success-500 transition-[width] duration-300"
                    style={{ width: `${reviewCompletionPercentage}%` }}
                  />
                </div>
                <div className="mt-1.5 text-right text-[11px] text-neutral-600">
                  {completeReviewStatusCount} dari {visibleReviewStatusCards.length} bagian sudah lengkap
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleReviewStatusCards.map((item) => {
                const complete = stepComplete[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`group relative flex min-h-[168px] flex-col overflow-hidden rounded-xl border border-border-primary bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300 ${complete ? "before:bg-success-500" : "before:bg-warning-500"} before:absolute before:inset-y-0 before:left-0 before:w-1`}
                    onClick={() => navigateFromReview(item.id)}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${complete ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-700"}`}>
                        {item.icon}
                      </span>
                      <Badge variant={complete ? "success" : "warning"}>
                        {complete ? "Lengkap" : "Belum Lengkap"}
                      </Badge>
                    </div>
                    <div className="mt-3 text-[14px] font-semibold text-neutral-900">{item.label}</div>
                    <div className="mt-1 text-[12px] leading-5 text-neutral-600">{item.description}</div>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[12px] font-semibold text-brand-primary-600 group-hover:text-brand-primary-700">
                      {item.actionLabel}
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${sectionTone} p-4 sm:p-5`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Pernyataan Akhir</div>
                    <h3 className="mt-0.5 text-[16px] font-semibold text-neutral-900">Penanggung Jawab Pengajuan</h3>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-[12px] leading-6 text-neutral-600">
                  Dengan mengirim pengajuan ini, penanggung jawab menyatakan bahwa seluruh data dan dokumen yang dicantumkan telah diperiksa dan dapat dipertanggungjawabkan.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-brand-primary-600 hover:text-brand-primary-700"
                  onClick={navigateToResponsiblePerson}
                >
                  Periksa data Penanggung Jawab
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-border-primary bg-background-primary/15 px-5 py-4 text-center">
                <div className="text-[12px] text-neutral-700">
                  {responsiblePerson.city}, {responsiblePerson.date}
                </div>
                <div className="mt-1 text-[12px] font-medium text-neutral-700">{responsiblePerson.position}</div>
                <div className="h-20" aria-label="Area tanda tangan" />
                <div className="border-t border-neutral-400 pt-2">
                  <div className="text-[13px] font-semibold text-neutral-900">{responsiblePerson.name}</div>
                </div>
              </div>
            </div>
          </section>

          <StepFooterActions
            step="review"
            onPrevious={() => setActiveStep(navigateStep("review", -1))}
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
                <>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-primary bg-white p-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Template Excel</div>
                      <p className="mt-1 text-[12px] leading-6 text-neutral-600">
                        Belum punya file? Unduh template terlebih dahulu agar kolom dan format data sesuai, supaya proses parsing tidak gagal.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStatusMessage("Template Excel Barang siap diunduh (placeholder).")}>
                      Download Template
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-dashed border-border-primary bg-white p-4">
                      <h4 className="mt-1 text-[18px] font-semibold text-neutral-800">Upload Excel</h4>
                      <p className="mt-2 text-[12px] leading-6 text-neutral-600">Support file XLSX. Gunakan template barang yang sudah disiapkan.</p>
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
                      {!importExcelFileName ? (
                        <span className="mt-2 block text-[12px] text-neutral-500">Belum ada file dipilih.</span>
                      ) : null}
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
                </>
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
      {configuratorEnabled ? (
        <>
          <button
            type="button"
            onClick={() => setConfiguratorOpen(true)}
            aria-label="Buka Konfigurasi Form"
            aria-expanded={configuratorOpen}
            className="fixed right-0 top-1/2 z-40 flex h-44 w-11 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-brand-primary-600 bg-brand-primary-600 text-white shadow-lg transition-colors hover:bg-brand-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-200"
          >
            <span className="flex -rotate-90 items-center gap-2 whitespace-nowrap text-[12px] font-semibold tracking-wide">
              <PencilIcon className="h-4 w-4" />
              Konfigurasi Form
            </span>
          </button>
          <ImportConfigurationDrawer
            open={configuratorOpen}
            configFile={configFile}
            documentId={documentType}
            onChange={setConfigFile}
            onDocumentChange={setDocumentType}
            onClose={() => setConfiguratorOpen(false)}
            onMessage={setStatusMessage}
            allowLocalDraft={localConfiguratorEnabled}
          />
        </>
      ) : null}
      <Modal
        open={costModalOpen}
        title="Informasi Komponen Biaya"
        description="Rincian pembentuk nilai transaksi berdasarkan konfigurasi jenis dokumen."
        onClose={() => setCostModalOpen(false)}
        widthClassName="w-[min(96vw,1240px)]"
        panelClassName="max-h-[92vh] flex flex-col"
        bodyClassName="min-h-0 flex-1 overflow-y-auto"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="error" size="sm" onClick={resetCostDraft}>Hapus</Button>
            <Button variant="primary" size="sm" onClick={saveCostDraft}>Simpan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-border-primary bg-background-primary/20 p-4 md:grid-cols-2">
            {costModalConfig?.fields.filter((field) => field.enabled && ["jenisNilai", "incoterm"].includes(field.id)).map((field) => (
              <FormField key={field.id} label={field.label} value={costDraft[field.id] ?? ""} onChange={(value) => setCostDraft((current) => ({ ...current, [field.id]: value }))} inputType="select" mandatory={field.required} />
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border-primary">
            <table className="min-w-[900px] w-full border-collapse text-left text-[12px]">
              <thead className="bg-brand-primary-600 text-white">
                <tr><th className="px-4 py-3">Keterangan</th><th className="w-[220px] px-4 py-3 text-right">Nilai Pasti</th><th className="w-[220px] px-4 py-3 text-right">Nilai Perkiraan (VD)</th></tr>
              </thead>
              <tbody>
                {(costModalConfig?.groups ?? []).map((costGroup) => {
                  const fields = (costModalConfig?.fields ?? []).filter((field) => field.enabled && field.groupId === costGroup.id && !["jenisNilai", "incoterm"].includes(field.id));
                  const summaryRows = costGroup.id === "harga-dibayar"
                    ? [{ label: "A. Jumlah Harga yang Sebenarnya atau Seharusnya Dibayar", value: costA }, { label: "C. Jumlah A Dikurangi Diskon", value: costC }]
                    : costGroup.id === "biaya-penambah"
                      ? [{ label: "D. Jumlah Biaya Penambah", value: costD }, { label: "E. Jumlah C Ditambah D", value: costE }]
                      : [{ label: "F. Jumlah Biaya yang Tidak Ditambahkan", value: costF }, { label: "G. Jumlah E Dikurangi F", value: costG }];
                  return (
                    <Fragment key={costGroup.id}>
                      <tr className="border-t border-border-primary bg-neutral-100"><th colSpan={3} className="px-4 py-3 text-[13px] font-semibold text-neutral-800">{costGroup.label}</th></tr>
                      {fields.map((field, index) => (
                        <tr key={field.id} className="border-t border-border-primary bg-white">
                          <td className="px-4 py-3 text-neutral-700">{index + 1}. {field.label}{field.required ? <span className="text-error-500"> *</span> : null}</td>
                          <td className="px-4 py-2">
                            {field.inputType === "select" ? (
                              <select value={costDraft[field.id] ?? ""} onChange={(event) => setCostDraft((current) => ({ ...current, [field.id]: event.target.value }))} className={fieldTone}><option value="">-- Pilih --</option><option value="0">Tidak Ada</option><option value="1">Ada</option></select>
                            ) : (
                              <input type="number" step="0.01" value={costDraft[field.id] ?? field.defaultValue ?? "0.00"} onChange={(event) => setCostDraft((current) => ({ ...current, [field.id]: event.target.value }))} className={`${fieldTone} text-right font-semibold text-brand-primary-600`} />
                            )}
                          </td>
                          <td className="bg-neutral-50 px-4 py-3 text-right text-neutral-500">0.00</td>
                        </tr>
                      ))}
                      {summaryRows.map((row) => <tr key={row.label} className="border-t border-border-primary bg-neutral-100 font-semibold"><td className="px-4 py-3">{row.label}</td><td className="px-4 py-3 text-right text-brand-primary-600">{row.value.toFixed(2)}</td><td className="px-4 py-3 text-right text-brand-primary-600">0.00</td></tr>)}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
