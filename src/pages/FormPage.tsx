import { useEffect, useMemo, useState, type ReactNode } from "react";

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

const entitasColumns = ["Jenis Entitas", "Jenis Identitas", "NITKU", "Nama", "Alamat", "NIB", "Jenis API", "Status", "Kode Negara", "Kode Afiliasi"];
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
const spesifikasiColumns = ["Seri", "Nama Spesifikasi", "Nilai", "Satuan"];
const barangDokumenColumns = ["Seri Barang", "Seri Dokumen"];
const barangVdColumns = ["Seri", "Kode VD", "Uraian VD", "Nilai VD"];
const barangTarifColumns = ["Seri Barang", "Jenis Pungutan", "Jenis Tarif", "Kode Satuan", "Jumlah Satuan", "Nilai Tarif", "Kode Fasilitas Tarif", "Nilai Tarif Fasilitas"];
const karantinaColumns = ["Seri", "Jenis Karantina", "Hasil Pemeriksaan", "Keterangan"];

const createRow = (columns: string[], values: Row = {}) =>
  columns.reduce<Row>((acc, column) => {
    acc[column] = values[column] ?? "";
    return acc;
  }, {});

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
      createRow(["Jenis Entitas", "Jenis Identitas", "NITKU", "Nama", "Alamat", "NIB", "Jenis API", "Status", "Kode Negara", "Kode Afiliasi"], {
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
      }),
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
      createRow(barangColumns, {
        Seri: "1",
        "HS Code": "8471.30.10",
        "Kode Barang": "BRG-001",
        Uraian: "Barang contoh impor untuk mockup BC 2.0",
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
      }),
    ],
    spesifikasi: [createRow(spesifikasiColumns, { Seri: "1", "Nama Spesifikasi": "Warna", Nilai: "Hitam", Satuan: "-" })],
    barangDokumen: [createRow(barangDokumenColumns, { "Seri Barang": "1", "Seri Dokumen": "1" })],
    barangVd: [createRow(barangVdColumns, { Seri: "1", "Kode VD": "VD001", "Uraian VD": "Volume data mock", "Nilai VD": "1" })],
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
    ],
    karantina: [createRow(karantinaColumns, { Seri: "1", "Jenis Karantina": "Hewan", "Hasil Pemeriksaan": "Lulus", Keterangan: "-" })],
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
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-border-primary bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">{title}</div>
          {subtitle && <div className="mt-1 text-[12px] text-neutral-600">{subtitle}</div>}
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && <div className="border-t border-border-primary px-4 py-4">{children}</div>}
    </section>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-neutral-700">
        {label}
        {mandatory ? <span className="ml-1 text-error-500">*</span> : null}
      </span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={fieldTone} />
    </label>
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
                  <button
                    type="button"
                    onClick={() => onRemove(rowIndex)}
                    className="inline-flex h-9 items-center gap-1 rounded-md border border-error-500 px-3 text-[12px] font-semibold text-error-600 transition-colors hover:bg-error-500/10"
                  >
                    <TrashIcon />
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-primary-500 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-primary-600"
        >
          <PlusIcon />
          Tambah Baris
        </button>
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
      <button
        type="button"
        onClick={onPrevious}
        disabled={!onPrevious}
        className="inline-flex h-10 items-center rounded-md border border-border-primary px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {"< sebelumnya"}
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCheck}
          className="inline-flex h-10 items-center rounded-md border border-brand-primary-500 px-4 text-[12px] font-semibold text-brand-primary-700 transition-colors hover:bg-brand-primary-50"
        >
          Cek Kelengkapan
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          className="inline-flex h-10 items-center rounded-md bg-brand-primary-500 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-primary-600 disabled:cursor-not-allowed disabled:bg-brand-primary-300"
        >
          selanjutnya {">"}
        </button>
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

  const stepComplete = useMemo(
    () => ({
      pengajuan: mandatoryPengajuanFields.every((key) => isMandatoryFilled(formState.pengajuan[key] ?? "")),
      entitas:
        hasAnyRows(formState.entitas) &&
        ["Jenis Entitas", "Jenis Identitas", "Nama", "NIB"].every((column) => isMandatoryFilled(formState.entitas[0]?.[column] ?? "")),
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
    [formState],
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
        <AccordionCard title="Data Entitas" subtitle="Editable table data pelaku usaha dan identitas entitas." defaultOpen>
          <EditableTable
            columns={entitasColumns}
            rows={formState.entitas}
            onChange={(rowIndex, column, value) => updateRow("entitas", rowIndex, column, value)}
            onAdd={() => addRow("entitas", entitasColumns)}
            onRemove={() => removeRow("entitas", entitasColumns)}
            minWidth={1400}
          />
        </AccordionCard>
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
          <AccordionCard title="Detail Barang" subtitle="Rincian lengkap barang pengajuan." defaultOpen>
            <EditableTable
              columns={barangColumns}
              rows={formState.barang}
              onChange={(rowIndex, column, value) => updateRow("barang", rowIndex, column, value)}
              onAdd={() => addRow("barang", barangColumns)}
              onRemove={() => removeRow("barang", barangColumns)}
              minWidth={2200}
            />
          </AccordionCard>

          <AccordionCard title="Spesifikasi Wajib" subtitle="Mock field spesifikasi yang tersedia." defaultOpen>
            <EditableTable
              columns={spesifikasiColumns}
              rows={formState.spesifikasi}
              onChange={(rowIndex, column, value) => updateRow("spesifikasi", rowIndex, column, value)}
              onAdd={() => addRow("spesifikasi", spesifikasiColumns)}
              onRemove={() => removeRow("spesifikasi", spesifikasiColumns)}
              minWidth={900}
            />
          </AccordionCard>

          <AccordionCard title="Dokumen Barang" subtitle="Relasi barang dan seri dokumen." defaultOpen>
            <EditableTable
              columns={barangDokumenColumns}
              rows={formState.barangDokumen}
              onChange={(rowIndex, column, value) => updateRow("barangDokumen", rowIndex, column, value)}
              onAdd={() => addRow("barangDokumen", barangDokumenColumns)}
              onRemove={() => removeRow("barangDokumen", barangDokumenColumns)}
              minWidth={700}
            />
          </AccordionCard>

          <AccordionCard title="Barang VD" subtitle="Mock field untuk data barang VD." defaultOpen>
            <EditableTable
              columns={barangVdColumns}
              rows={formState.barangVd}
              onChange={(rowIndex, column, value) => updateRow("barangVd", rowIndex, column, value)}
              onAdd={() => addRow("barangVd", barangVdColumns)}
              onRemove={() => removeRow("barangVd", barangVdColumns)}
              minWidth={900}
            />
          </AccordionCard>

          <AccordionCard title="Barang Tarif" subtitle="Data pungutan dan tarif mockup." defaultOpen>
            <EditableTable
              columns={barangTarifColumns}
              rows={formState.barangTarif}
              onChange={(rowIndex, column, value) => updateRow("barangTarif", rowIndex, column, value)}
              onAdd={() => addRow("barangTarif", barangTarifColumns)}
              onRemove={() => removeRow("barangTarif", barangTarifColumns)}
              minWidth={1700}
            />
          </AccordionCard>

          <AccordionCard title="Karantina" subtitle="Data karantina mockup." defaultOpen>
            <EditableTable
              columns={karantinaColumns}
              rows={formState.karantina}
              onChange={(rowIndex, column, value) => updateRow("karantina", rowIndex, column, value)}
              onAdd={() => addRow("karantina", karantinaColumns)}
              onRemove={() => removeRow("karantina", karantinaColumns)}
              minWidth={900}
            />
          </AccordionCard>
          <StepFooterActions
            step="barang"
            onPrevious={() => setActiveStep(goToStep("barang", -1))}
            onCheck={handleCheckCompleteness}
            onNext={() => setActiveStep(goToStep("barang", 1))}
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
                    {draft?.namaPerusahaan || formState.entitas[0]?.Nama || "PT Contoh Nusantara"}
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
              <button
                type="button"
                onClick={() => setActiveStep(goToStep("review", -1))}
                className="inline-flex h-11 items-center rounded-md border border-border-primary px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                {"< sebelumnya"}
              </button>
              <button
                type="button"
                onClick={saveSnapshot}
                className="inline-flex h-11 items-center rounded-md border border-brand-primary-500 px-4 text-[12px] font-semibold text-brand-primary-700 transition-colors hover:bg-brand-primary-50"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={handleCheckCompleteness}
                className="inline-flex h-11 items-center rounded-md border border-brand-primary-500 px-4 text-[12px] font-semibold text-brand-primary-700 transition-colors hover:bg-brand-primary-50"
              >
                Cek Kelengkapan
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="inline-flex h-11 items-center rounded-md bg-brand-primary-500 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-primary-600"
              >
                Submit Pengajuan
              </button>
              <button
                type="button"
                onClick={() => setActiveStep("review")}
                className="inline-flex h-11 items-center rounded-md border border-border-primary px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                selanjutnya {">"}
              </button>
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
            <label className="inline-flex items-center gap-2 text-[12px] text-neutral-700">
              <input type="checkbox" checked={notif} onChange={(event) => setNotif(event.target.checked)} />
              Kirim notifikasi email
            </label>
            <button
              type="button"
              onClick={saveSnapshot}
              className="inline-flex h-11 items-center rounded-md border border-border-primary px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Simpan Draft
            </button>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
