import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Tooltip } from "../components/Tooltip";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CalendarIcon,
  BriefcaseIcon,
  CopyIcon,
  DocumentsIcon,
  EyeIcon,
  FileTextIcon,
  PlainIcon,
  TruckIcon,
  UserIcon,
} from "../components/Icons";
import { proposalRows } from "./dashboard/dashboardData";

type DetailField = { label: string; value: string; span?: 1 | 2 | 3 };
type DetailBarangRow = {
  seri: string;
  hsCode: string;
  kodeBarang: string;
  uraian: string;
  merek: string;
  tipe: string;
  negaraAsal: string;
  beratBersih: string;
  status: string;
};
type DetailBarangDrawer = DetailBarangRow & {
  spesifikasi: Array<{ nama: string; nilai: string; satuan: string }>;
  dokumen: Array<{ seri: string; jenis: string; nomor: string; tanggal: string }>;
  vd: Array<{ jenis: string; nilai: string; keterangan: string }>;
  tarif: Array<{ jenisPungutan: string; jenisTarif: string; jumlah: string; nilai: string; fasilitas: string }>;
  karantina: Array<{ komoditas: string; jenis: string; nomor: string; status: string }>;
};
type TocItem = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children?: Array<{ id: string; title: string; description: string; icon: ComponentType<{ className?: string }> }>;
};

const sectionTone = "rounded-2xl border border-border-primary bg-white shadow-sm";

const tocItems: TocItem[] = [
  { id: "pengajuan-header", title: "Header Pengajuan", description: "Nomor, jenis, dan identitas utama.", icon: DocumentsIcon },
  { id: "pengajuan-transaksi", title: "Transaksi", description: "Nilai, valuta, dan komponen transaksi.", icon: CopyIcon },
  { id: "pengajuan-pengangkutan", title: "Pengangkutan", description: "Sarana angkut dan jadwal kedatangan.", icon: TruckIcon },
  { id: "pengajuan-pelabuhan", title: "Pelabuhan & Tempat Timbun", description: "Pelabuhan muat, tujuan, dan timbun.", icon: CalendarIcon },
  {
    id: "entitas",
    title: "Entitas",
    description: "Data pelaku usaha yang terlibat.",
    icon: BuildingsIcon,
    children: [
      { id: "entitas-pengusaha", title: "Pengusaha", description: "Identitas pengaju utama.", icon: BuildingsIcon },
      { id: "entitas-ppjk", title: "PPJK", description: "Perantara kepabeanan.", icon: BriefcaseIcon },
      { id: "entitas-pembeli", title: "Pembeli", description: "Pihak pembeli barang.", icon: UserIcon },
      { id: "entitas-penerima", title: "Penerima", description: "Penerima barang atau shipment.", icon: UserIcon },
      { id: "entitas-penanggung-jawab", title: "Penanggung Jawab", description: "Kontak pengajuan.", icon: UserIcon },
      { id: "entitas-konsolidator", title: "Konsolidator", description: "Jika pengajuan memakai konsolidasi.", icon: TruckIcon },
    ],
  },
  { id: "dokumen-lampiran", title: "Dokumen Lampiran", description: "Daftar dokumen yang menyertai.", icon: FileTextIcon },
  { id: "kemasan-kontainer", title: "Kemasan & Kontainer", description: "Data packaging dan kontainer.", icon: TruckIcon },
  { id: "barang", title: "Barang", description: "Daftar barang dan turunannya.", icon: PlainIcon },
  { id: "review", title: "Review", description: "Ringkasan akhir pembacaan data.", icon: EyeIcon },
];

const detailPengajuanFields: Record<string, DetailField[]> = {
  header: [
    { label: "Nomor Pengajuan", value: "BC2006260001", span: 2 },
    { label: "Jenis PIB", value: "Pengajuan Barang Masuk / Impor" },
    { label: "Kantor Pabean", value: "KPU Tanjung Priok" },
    { label: "Jenis Impor", value: "Biasa" },
    { label: "Cara Bayar", value: "Biasa" },
  ],
  transaksi: [
    { label: "Valuta", value: "USD" },
    { label: "NDPBM", value: "15.800,00" },
    { label: "Jenis Transaksi", value: "Beli Putus" },
    { label: "Harga", value: "25.000,00", span: 2 },
    { label: "Freight", value: "1.200,00" },
    { label: "Asuransi", value: "250,00" },
    { label: "Diskon", value: "0,00" },
    { label: "Berat Kotor", value: "1.520,00 KGM" },
  ],
  pengangkutan: [
    { label: "Cara Pengangkutan", value: "Laut" },
    { label: "Nama Sarana Angkut", value: "MV. INS WIDYA" },
    { label: "Nomor Voyage", value: "VY-0826" },
    { label: "Bendera", value: "Indonesia" },
    { label: "Perkiraan Tanggal Tiba", value: "20/06/2026" },
  ],
  pelabuhan: [
    { label: "Pelabuhan Muat", value: "Shanghai" },
    { label: "Pelabuhan Transit", value: "Singapura" },
    { label: "Pelabuhan Tujuan", value: "Tanjung Priok" },
    { label: "Tempat Timbun", value: "Gudang IPC" },
  ],
  review: [
    { label: "Ringkasan", value: "Seluruh data inti dapat dibaca dengan lengkap sebelum submit." },
    { label: "Catatan Sistem", value: "Data pengajuan telah tersinkron dari hasil copy data dan penyesuaian operator." },
  ],
};

const detailEntities: Array<{ id: string; title: string; icon: ComponentType<{ className?: string }>; fields: DetailField[] }> = [
  {
    id: "entitas-pengusaha",
    title: "Pengusaha",
    icon: BuildingsIcon,
    fields: [
      { label: "Nama", value: "PT Maju Jaya", span: 2 },
      { label: "NPWP / NITKU", value: "01.234.567.8-999.000" },
      { label: "Nomor", value: "01.234.567.8-999.000" },
      { label: "Alamat", value: "Jl. Sudirman No. 10, Jakarta" },
      { label: "Negara", value: "Indonesia" },
    ],
  },
  {
    id: "entitas-ppjk",
    title: "PPJK",
    icon: BriefcaseIcon,
    fields: [
      { label: "Nama PPJK", value: "PT PPJK Bersama" },
      { label: "Nomor PPJK", value: "PPJK-2026-001" },
      { label: "NPWP / NITKU", value: "02.123.456.7-888.000" },
      { label: "Alamat", value: "Jl. Pelabuhan Raya No. 2, Jakarta" },
    ],
  },
  {
    id: "entitas-pembeli",
    title: "Pembeli",
    icon: UserIcon,
    fields: [
      { label: "Nama", value: "PT Global Trade", span: 2 },
      { label: "Negara", value: "Singapore" },
      { label: "Alamat", value: "10 Marina Boulevard, Singapore" },
    ],
  },
  {
    id: "entitas-penerima",
    title: "Penerima",
    icon: UserIcon,
    fields: [
      { label: "Nama", value: "PT Global Logistic", span: 2 },
      { label: "Negara", value: "Singapore" },
      { label: "Alamat", value: "88 Pasir Panjang, Singapore" },
    ],
  },
  {
    id: "entitas-penanggung-jawab",
    title: "Penanggung Jawab",
    icon: UserIcon,
    fields: [
      { label: "Nama", value: "Andi Saputra" },
      { label: "Jabatan", value: "Manager Operasional" },
      { label: "Email", value: "andi@majujaya.co.id" },
      { label: "Kota", value: "Jakarta" },
    ],
  },
  {
    id: "entitas-konsolidator",
    title: "Konsolidator",
    icon: TruckIcon,
    fields: [
      { label: "Nama", value: "PT Konsolidasi Nusantara", span: 2 },
      { label: "Negara", value: "Indonesia" },
      { label: "Keterangan", value: "Digunakan bila shipment memakai konsolidasi / LCL." },
    ],
  },
];

const dokumenRows = [
  { seri: "1", kode: "INV", nomor: "invoice_001.pdf", tanggal: "20/06/2026" },
  { seri: "2", kode: "PL", nomor: "packing_list.pdf", tanggal: "20/06/2026" },
  { seri: "3", kode: "BL", nomor: "bill_of_lading.pdf", tanggal: "20/06/2026" },
  { seri: "4", kode: "COO", nomor: "certificate_of_origin.pdf", tanggal: "20/06/2026" },
];

const kemasanFields: DetailField[] = [
  { label: "Seri", value: "1" },
  { label: "Jenis Kemasan", value: "Pallet" },
  { label: "Merek", value: "INSW" },
];

const kontainerFields: DetailField[] = [
  { label: "Seri", value: "1" },
  { label: "Nomor Kontainer", value: "MSKU1234567" },
  { label: "Ukuran", value: "40" },
  { label: "Jenis Muatan", value: "FCL" },
  { label: "Tipe", value: "Dry" },
];

const barangRows: DetailBarangDrawer[] = [
  {
    seri: "1",
    hsCode: "8471.30.10",
    kodeBarang: "BRG-001",
    uraian: "Laptop Lenovo ThinkPad",
    merek: "Lenovo",
    tipe: "Notebook",
    negaraAsal: "China",
    beratBersih: "1.320 KGM",
    status: "Perlu Validasi",
    spesifikasi: [
      { nama: "CPU", nilai: "Intel Core i7", satuan: "-" },
      { nama: "RAM", nilai: "16", satuan: "GB" },
    ],
    dokumen: [
      { seri: "1", jenis: "Invoice", nomor: "INV-001", tanggal: "20/06/2026" },
      { seri: "2", jenis: "Packing List", nomor: "PL-001", tanggal: "20/06/2026" },
    ],
    vd: [{ jenis: "VD", nilai: "0", keterangan: "Tidak ada VD terpisah" }],
    tarif: [
      { jenisPungutan: "BM", jenisTarif: "Ad Valorem", jumlah: "10", nilai: "5", fasilitas: "-" },
      { jenisPungutan: "PPN", jenisTarif: "Ad Valorem", jumlah: "10", nilai: "11", fasilitas: "-" },
    ],
    karantina: [{ komoditas: "Barang Elektronik", jenis: "Non-Karantina", nomor: "-", status: "Bebas" }],
  },
  {
    seri: "2",
    hsCode: "8504.40.90",
    kodeBarang: "BRG-002",
    uraian: "Power Supply 350W",
    merek: "Delta",
    tipe: "PSU",
    negaraAsal: "Vietnam",
    beratBersih: "320 KGM",
    status: "Sesuai",
    spesifikasi: [
      { nama: "Daya", nilai: "350", satuan: "W" },
      { nama: "Efficiency", nilai: "80+", satuan: "-" },
    ],
    dokumen: [{ seri: "1", jenis: "Invoice", nomor: "INV-002", tanggal: "20/06/2026" }],
    vd: [{ jenis: "VD", nilai: "0", keterangan: "Tidak ada VD terpisah" }],
    tarif: [{ jenisPungutan: "BM", jenisTarif: "Ad Valorem", jumlah: "5", nilai: "0", fasilitas: "MITA" }],
    karantina: [{ komoditas: "Barang Elektronik", jenis: "Non-Karantina", nomor: "-", status: "Bebas" }],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 fill-current transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="m7 10 5 5 5-5H7Z" />
    </svg>
  );
}

function ReadOnlyField({ label, value, span = 1 }: { label: string; value: string; span?: 1 | 2 | 3 }) {
  return (
    <div className={span === 3 ? "md:col-span-2 xl:col-span-3" : span === 2 ? "md:col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-1 text-[13px] font-semibold leading-5 text-neutral-800">{value || "-"}</div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  subtitle,
  children,
  defaultOpen = true,
  icon,
  headerActions,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  headerActions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-[calc(var(--shell-sticky-top)+24px)] rounded-2xl border border-border-primary bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 border-b border-border-primary px-4 py-3 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {icon ? <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background-primary text-brand-primary-600">{icon}</span> : null}
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{title}</div>
            {subtitle ? <div className="mt-1 text-[12px] leading-5 text-neutral-600">{subtitle}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700">
            <ChevronIcon open={open} />
          </span>
        </div>
      </button>
      {open ? <div className="p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

function LabelValueGrid({ fields }: { fields: DetailField[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <ReadOnlyField key={field.label} label={field.label} value={field.value} span={field.span} />
      ))}
    </div>
  );
}

function BarangDrawer({
  open,
  row,
  onClose,
}: {
  open: boolean;
  row: DetailBarangDrawer | null;
  onClose: () => void;
}) {
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" aria-label="Tutup detail barang" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex h-full w-[min(58vw,860px)] max-w-[calc(100vw-0.5rem)] flex-col border-l border-border-primary bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
        <div className="shrink-0 border-b border-border-primary px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">Detail Barang</div>
              <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-neutral-800">{row.uraian}</h3>
              <p className="mt-2 text-[12px] leading-6 text-neutral-600">Drawer ini hanya menampilkan data baca, tanpa field editable maupun tombol simpan.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-sm"
              aria-label="Tutup drawer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-4">
            <section className={sectionTone}>
              <div className="border-b border-border-primary px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Data Barang</div>
                <div className="mt-1 text-[12px] text-neutral-600">Informasi inti per seri barang.</div>
              </div>
              <div className="p-4">
                <LabelValueGrid
                  fields={[
                    { label: "Seri", value: row.seri },
                    { label: "HS Code", value: row.hsCode },
                    { label: "Kode Barang", value: row.kodeBarang },
                    { label: "Uraian", value: row.uraian, span: 2 },
                    { label: "Merek", value: row.merek },
                    { label: "Tipe", value: row.tipe },
                    { label: "Negara Asal", value: row.negaraAsal },
                    { label: "Berat Bersih", value: row.beratBersih },
                    { label: "Status", value: row.status },
                  ]}
                />
              </div>
            </section>

            <SectionCard id={`drawer-spesifikasi-${row.seri}`} title="Spesifikasi Wajib" subtitle="Data spesifikasi per seri barang." icon={<DocumentsIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nama Spesifikasi</th>
                      <th className="px-3 py-2 font-semibold">Nilai</th>
                      <th className="px-3 py-2 font-semibold">Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.spesifikasi.map((item) => (
                      <tr key={`${item.nama}-${item.nilai}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{item.nama}</td>
                        <td className="px-3 py-2">{item.nilai}</td>
                        <td className="px-3 py-2">{item.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id={`drawer-dokumen-${row.seri}`} title="Dokumen Barang" subtitle="Dokumen yang terhubung ke seri ini." icon={<FileTextIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Seri</th>
                      <th className="px-3 py-2 font-semibold">Jenis</th>
                      <th className="px-3 py-2 font-semibold">Nomor</th>
                      <th className="px-3 py-2 font-semibold">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.dokumen.map((item) => (
                      <tr key={`${item.seri}-${item.nomor}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{item.seri}</td>
                        <td className="px-3 py-2">{item.jenis}</td>
                        <td className="px-3 py-2">{item.nomor}</td>
                        <td className="px-3 py-2">{item.tanggal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id={`drawer-vd-${row.seri}`} title="Barang VD" subtitle="Referensi barang VD yang terkait." icon={<CopyIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Jenis VD</th>
                      <th className="px-3 py-2 font-semibold">Nilai</th>
                      <th className="px-3 py-2 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.vd.map((item) => (
                      <tr key={`${item.jenis}-${item.nilai}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{item.jenis}</td>
                        <td className="px-3 py-2">{item.nilai}</td>
                        <td className="px-3 py-2">{item.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id={`drawer-tarif-${row.seri}`} title="Barang Tarif" subtitle="Pungutan dan fasilitas tarif." icon={<PlainIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Jenis Pungutan</th>
                      <th className="px-3 py-2 font-semibold">Jenis Tarif</th>
                      <th className="px-3 py-2 font-semibold">Jumlah</th>
                      <th className="px-3 py-2 font-semibold">Nilai</th>
                      <th className="px-3 py-2 font-semibold">Fasilitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.tarif.map((item) => (
                      <tr key={`${item.jenisPungutan}-${item.jenisTarif}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{item.jenisPungutan}</td>
                        <td className="px-3 py-2">{item.jenisTarif}</td>
                        <td className="px-3 py-2">{item.jumlah}</td>
                        <td className="px-3 py-2">{item.nilai}</td>
                        <td className="px-3 py-2">{item.fasilitas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id={`drawer-karantina-${row.seri}`} title="Karantina" subtitle="Keterangan karantina per seri barang." icon={<TruckIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Komoditas</th>
                      <th className="px-3 py-2 font-semibold">Jenis</th>
                      <th className="px-3 py-2 font-semibold">Nomor</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.karantina.map((item) => (
                      <tr key={`${item.komoditas}-${item.jenis}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{item.komoditas}</td>
                        <td className="px-3 py-2">{item.jenis}</td>
                        <td className="px-3 py-2">{item.nomor}</td>
                        <td className="px-3 py-2">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailPage() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [tocExpanded, setTocExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("pengajuan-header");
  const [activeEntity, setActiveEntity] = useState("entitas-pengusaha");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<DetailBarangDrawer | null>(null);
  const scrollLockRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const query = new URLSearchParams(location.search);
  const selectedPengajuan = query.get("pengajuan") ?? proposalRows[0]?.pengajuan ?? "-";
  const proposal = proposalRows.find((row) => row.pengajuan === selectedPengajuan) ?? proposalRows[0] ?? null;

  useEffect(() => {
    const sectionIds = tocItems.flatMap((item) => (item.children ? [item.id, ...item.children.map((child) => child.id)] : [item.id]));
    const observed = sectionIds
      .map((id) => ({ id, element: document.getElementById(id) }))
      .filter((item): item is { id: string; element: HTMLElement } => Boolean(item.element));

    if (!observed.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;

        const next = visible.find((entry) => entry.target.id === activeSection) ?? visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!next) return;

        if (next.target.id.startsWith("entitas-")) {
          setActiveSection("entitas");
          setActiveEntity(next.target.id);
        } else {
          setActiveSection(next.target.id);
          if (next.target.id === "entitas") {
            const firstEntity = detailEntities[0]?.id;
            if (firstEntity) setActiveEntity(firstEntity);
          }
        }
      },
      { root: null, rootMargin: "-22% 0px -62% 0px", threshold: 0.01 },
    );

    observed.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeSection]);

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    scrollLockRef.current = true;
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    setActiveSection(id.startsWith("entitas-") ? "entitas" : id);
    if (id.startsWith("entitas-")) setActiveEntity(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    unlockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false;
    }, 650);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-3 py-4 sm:px-4 sm:py-5">
      <section className={`${sectionTone} bg-gradient-to-br from-brand-primary-500 via-[#03306f] to-[#0756a7] p-5 text-white shadow-sm sm:p-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">Detail Pengajuan</span>
        </div>
        <div className="mt-3 max-w-5xl text-[13px] leading-6 text-white/92">
          Halaman ini read-only, one page scroll, dan tetap terasa familiar dengan struktur Form Pengajuan.
        </div>
      </section>

      <section className={sectionTone + " p-4 pb-6 sm:p-5 sm:pb-7"}>
        <div className="flex flex-col gap-3 border-b border-border-primary pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Data Pengajuan</div>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-neutral-800">Detail Pengajuan</h1>
            <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">
              Dibuka dari tabel data pengajuan. Semua isi ditampilkan dalam mode baca untuk memudahkan peninjauan cepat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">No. {proposal?.pengajuan ?? "-"}</Badge>
            <Badge variant={proposal?.status === "Selesai" ? "success" : proposal?.status === "Proses" ? "warning" : proposal?.status === "Ditolak" ? "error" : "secondary"}>
              {proposal?.status ?? "-"}
            </Badge>
            <Badge variant="secondary">{proposal?.dokumen ?? "-"}</Badge>
          </div>
        </div>

        <div
          className={[
            "mt-4 grid gap-4",
            tocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]",
          ].join(" ")}
        >
          <aside className="lg:sticky lg:top-[calc(var(--shell-sticky-top)+12px)] lg:self-start">
            <div
              className={[
                "flex flex-col rounded-2xl border border-border-primary bg-white shadow-sm lg:h-[calc(100vh-var(--shell-sticky-top)-36px)] lg:max-h-[calc(100vh-var(--shell-sticky-top)-36px)]",
                tocExpanded ? "lg:w-[280px]" : "lg:w-[84px]",
                tocExpanded ? "p-4" : "p-2",
              ].join(" ")}
            >
              <div className={["shrink-0 flex items-start gap-3", tocExpanded ? "justify-between" : "justify-center"].join(" ")}>
                {tocExpanded ? (
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div>
                    <div className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section detail yang ingin ditinjau.</div>
                  </div>
                ) : (
                  <div className="sr-only">
                    <div>Table of Content</div>
                    <div>Lompat ke section detail yang ingin ditinjau.</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTocExpanded((value) => !value)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50"
                  aria-label={tocExpanded ? "Ciutkan TOC detail" : "Buka TOC detail"}
                >
                  {tocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                </button>
              </div>

              <div className={["min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1", tocExpanded ? "mt-4" : "mt-3"].join(" ")}>
                <div className="flex flex-col gap-2">
                {tocItems.map((item) => {
                  const active = activeSection === item.id || (item.id === "entitas" && activeSection === "entitas");
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="space-y-2">
                      {tocExpanded ? (
                        <button
                          type="button"
                          onClick={() => scrollTo(item.id)}
                          aria-label={item.title}
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
                            <span className="text-[12px] font-semibold text-neutral-800">{item.title}</span>
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
                              <div className="text-[12px] font-semibold text-neutral-800">{item.title}</div>
                              <div className="mt-1 text-[11px] leading-5 text-neutral-600">{item.description}</div>
                            </div>
                          }
                        >
                          <button
                            type="button"
                            onClick={() => scrollTo(item.id)}
                            aria-label={item.title}
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

                      {item.children && tocExpanded ? (
                        <div className="ml-4 space-y-2 border-l border-border-primary pl-3">
                          {item.children.map((child) => {
                            const childActive = activeSection === "entitas" && activeEntity === child.id;
                            const ChildIcon = child.icon;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => scrollTo(child.id)}
                                className={[
                                  "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                                  childActive
                                    ? "border-brand-primary-400 bg-brand-primary-50/70"
                                    : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/30",
                                ].join(" ")}
                                >
                                  <span className={["mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md", childActive ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600"].join(" ")}>
                                    <ChildIcon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-semibold text-neutral-800">{child.title}</span>
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
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard id="pengajuan-header" title="Header Pengajuan" subtitle="Data inti pengajuan." icon={<DocumentsIcon className="h-5 w-5" />}>
              <LabelValueGrid fields={detailPengajuanFields.header} />
            </SectionCard>

            <SectionCard id="pengajuan-transaksi" title="Transaksi" subtitle="Nilai dan komponen transaksi." icon={<CopyIcon className="h-5 w-5" />}>
              <LabelValueGrid fields={detailPengajuanFields.transaksi} />
            </SectionCard>

            <SectionCard id="pengajuan-pengangkutan" title="Pengangkutan" subtitle="Sarana angkut dan jadwal perjalanan." icon={<TruckIcon className="h-5 w-5" />}>
              <LabelValueGrid fields={detailPengajuanFields.pengangkutan} />
            </SectionCard>

            <SectionCard id="pengajuan-pelabuhan" title="Pelabuhan & Tempat Timbun" subtitle="Pelabuhan muat, transit, tujuan, dan timbun." icon={<CalendarIcon className="h-5 w-5" />}>
              <LabelValueGrid fields={detailPengajuanFields.pelabuhan} />
            </SectionCard>

            <section id="entitas" className="scroll-mt-[calc(var(--shell-sticky-top)+24px)] rounded-2xl border border-border-primary bg-white shadow-sm">
              <div className="border-b border-border-primary px-4 py-3 sm:px-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Entitas</div>
                <div className="mt-1 text-[12px] text-neutral-600">Pecahan card berdasarkan jenis entitas yang tersedia.</div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  {detailEntities.map((entity) => {
                    const EntityIcon = entity.icon;
                    return (
                      <SectionCard
                        key={entity.id}
                        id={entity.id}
                        title={entity.title}
                        subtitle="Data entitas ditampilkan sebagai ringkasan baca."
                        icon={<EntityIcon className="h-5 w-5" />}
                      >
                        <LabelValueGrid fields={entity.fields} />
                      </SectionCard>
                    );
                  })}
                </div>
              </div>
            </section>

            <SectionCard id="dokumen-lampiran" title="Dokumen Lampiran" subtitle="Daftar dokumen yang ikut dalam pengajuan." icon={<FileTextIcon className="h-5 w-5" />}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[12px]">
                  <thead className="bg-brand-primary-500 text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Seri</th>
                      <th className="px-3 py-2 font-semibold">Kode Dokumen</th>
                      <th className="px-3 py-2 font-semibold">Nomor Dokumen</th>
                      <th className="px-3 py-2 font-semibold">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dokumenRows.map((row) => (
                      <tr key={`${row.seri}-${row.kode}`} className="border-t border-border-primary">
                        <td className="px-3 py-2">{row.seri}</td>
                        <td className="px-3 py-2">
                          <Badge variant={row.kode === "INV" || row.kode === "PL" || row.kode === "BL" ? "brand" : "secondary"}>{row.kode}</Badge>
                        </td>
                        <td className="px-3 py-2">{row.nomor}</td>
                        <td className="px-3 py-2">{row.tanggal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard id="kemasan-kontainer" title="Kemasan & Kontainer" subtitle="Data packaging dan kontainer." icon={<TruckIcon className="h-5 w-5" />}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Kemasan</div>
                  <div className="mt-4">
                    <LabelValueGrid fields={kemasanFields} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Kontainer</div>
                  <div className="mt-4">
                    <LabelValueGrid fields={kontainerFields} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="barang" title="Barang" subtitle="Daftar barang utama." icon={<PlainIcon className="h-5 w-5" />}>
              <div className="overflow-hidden rounded-2xl border border-border-primary">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-[12px]">
                    <thead className="bg-brand-primary-500 text-white">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Seri</th>
                        <th className="px-3 py-2 font-semibold">HS Code</th>
                        <th className="px-3 py-2 font-semibold">Kode Barang</th>
                        <th className="px-3 py-2 font-semibold">Uraian</th>
                        <th className="px-3 py-2 font-semibold">Negara Asal</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {barangRows.map((row) => (
                        <tr key={row.seri} className="border-t border-border-primary">
                          <td className="px-3 py-2">{row.seri}</td>
                          <td className="px-3 py-2">{row.hsCode}</td>
                          <td className="px-3 py-2">{row.kodeBarang}</td>
                          <td className="px-3 py-2">{row.uraian}</td>
                          <td className="px-3 py-2">{row.negaraAsal}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.status === "Sesuai" ? "success" : "warning"}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              size="sm"
                              variant="info"
                              startIcon={<EyeIcon className="h-4 w-4" />}
                              onClick={() => {
                                setSelectedBarang(row);
                                setDrawerOpen(true);
                              }}
                            >
                              Lihat Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="review" title="Review" subtitle="Ringkasan akhir baca data." icon={<EyeIcon className="h-5 w-5" />}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
                  <LabelValueGrid fields={detailPengajuanFields.review} />
                </div>
                <div className="rounded-2xl border border-border-primary bg-white p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Catatan</div>
                  <div className="mt-3 rounded-xl border border-border-primary bg-background-primary/25 p-4 text-[12px] leading-6 text-neutral-700">
                    Detail halaman ini dibaca untuk audit dan peninjauan. Jika ada koreksi, pengguna kembali ke Form Pengajuan.
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </section>

      <BarangDrawer open={drawerOpen} row={selectedBarang} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
