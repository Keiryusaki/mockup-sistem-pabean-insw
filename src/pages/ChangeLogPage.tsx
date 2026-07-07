import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/Button";
import { ArrowRightIcon, DocumentsIcon, HamburgerMenuIcon, MagniferIcon } from "../components/Icons";
import { Card, CardBody, CardHeader } from "../components/Surface";

type ChangeSection = {
  title: string;
  summary: string;
  bullets: string[];
};

type ChangeLogEntry = {
  id: string;
  commit: string;
  date: string;
  label: string;
  title: string;
  summary: string;
  scope: string[];
  sections: ChangeSection[];
};

const entries: ChangeLogEntry[] = [
  {
    id: "commit-001",
    commit: "Checkpoint 01",
    date: "4 Juli 2026",
    label: "Perubahan pertama",
    title: "Dashboard, flow pengajuan, progress, entitas, dan live docs dirapikan",
    summary:
      "Checkpoint awal ini berisi perubahan paling besar di tampilan dan alur kerja. Fokusnya bukan cuma visual, tapi juga pemisahan flow pengajuan, penambahan progress pengajuan, penyesuaian label, perapihan komponen lokal, dan pembentukan pola UI yang bisa dipakai lagi ke halaman berikutnya.",
    scope: ["UI/UX", "Flow", "Text Copy", "Komponen Lokal", "Bugfix"],
    sections: [
      {
        title: "1. Dashboard dan data pengajuan",
        summary: "Aksi utama, statistik, tabel, dan navigasi dashboard dibuat lebih operasional dan lebih dekat dengan kebutuhan kerja harian.",
        bullets: [
          "Tombol pengajuan di dashboard dijadikan CTA yang lebih tegas, dengan visual yang lebih kontras dan arah aksi yang jelas.",
          "Stat card dashboard diubah jadi shortcut filter ke halaman data pengajuan, lengkap dengan state aktif saat sedang difilter.",
          "Halaman data pengajuan diperbarui dengan statistik yang lebih simpel, kolom status, jenis dokumen, dan kolom aksi di sisi kanan.",
          "Kolom seleksi paling kiri di tabel data pengajuan dihapus agar tampilan lebih ringkas dan fokus ke informasi inti.",
          "Header tabel dan warna tombol diselaraskan ke token warna brand yang dipakai di mockup utama.",
          "Icon aksi tabel dibagi per state supaya lebih mudah dibaca: detail, progress, edit, copy, dan delete.",
          "Aksi baru `Progress` ditambahkan ke setiap baris pengajuan untuk membuka halaman progress bisnis, bukan halaman detail readonly.",
        ],
      },
      {
        title: "2. Flow pengajuan tanpa assistant",
        summary: "Alur manual dipisah jelas antara upload data, parsing data, dan masuk ke form, supaya status data lebih transparan buat user.",
        bullets: [
          "Step upload dibagi tegas menjadi upload data barang dan upload OCR, lalu step parsing berdiri sendiri sebagai tahap validasi hasil baca data.",
          "Upload template dan upload dokumen disederhanakan agar tiap dokumen yang dipilih punya status jelas: ter-upload, pending, atau gagal.",
          "Button `Lewati Upload Dokumen` ditambahkan agar user bisa langsung lanjut ke form tanpa wajib upload dokumen tambahan.",
          "Button `Lanjut ke Data Parsing` hanya aktif saat file sudah dipilih dan status upload sudah aman, supaya alur tidak ambigu.",
          "Step parsing menampilkan confidence global, bukan per field, dengan label seperti aman, perlu dicek, dan wajib review.",
          "Preview mapping diubah ke bentuk tabel agar lebih gampang dibaca dan lebih dekat dengan kebutuhan pengecekan data barang.",
          "Modal detail di parsing menampilkan source OCR/image atau PDF yang benar sesuai sumber data tiap baris barang.",
        ],
      },
      {
        title: "3. Progress pengajuan",
        summary: "Halaman baru dipakai buat melihat perjalanan proses pengajuan tanpa mencampuradukkan dengan detail isi form.",
        bullets: [
          "Ditambahkan aksi `Progress` di tabel data pengajuan untuk membuka halaman progress per nomor pengajuan.",
          "Halaman progress menampilkan ringkasan status, jenis dokumen, nama perusahaan, dan last updated di header atas.",
          "Timeline progres dibuat sebagai daftar tahapan utama yang bisa diklik, dengan indikator cepat untuk dokumen, catatan, dan warning.",
          "Panel kanan progress menampilkan status tahapan, catatan reviewer, dokumen yang dihasilkan, dan aktivitas pada tahap terpilih.",
          "Progress page dibedakan tegas dari halaman detail pengajuan yang sifatnya readonly isi form.",
        ],
      },
      {
        title: "4. Flow pengajuan dengan assistant",
        summary: "Alur assistant disederhanakan supaya tidak ada step yang terasa berulang dan tidak menambah beban user saat sudah ada identifikasi otomatis.",
        bullets: [
          "Step awal assistant langsung fokus ke identifikasi kebutuhan pengajuan, tanpa pertanyaan tambahan yang tidak memberi nilai keputusan.",
          "Step smart draft yang sebelumnya ada dipangkas, dan alurnya dibuat lebih dekat ke flow upload lalu parsing seperti non-assistant.",
          "Step konfirmasi dihapus karena tidak lagi dibutuhkan setelah hasil identifikasi sudah jelas.",
          "Flow upload dokumen dan parsing data tetap konsisten dengan versi tanpa assistant, supaya user tidak belajar pola berbeda.",
          "Tombol batal di step parsing dibedakan perilakunya dari step lain: ada konfirmasi saat data sudah terlanjur diproses.",
          "Konsistensi copy pada tombol action juga dirapikan, misalnya `Ok, Lanjut ke Form` dan `Lewati Upload Dokumen`.",
        ],
      },
      {
        title: "5. Entitas di form pengajuan",
        summary: "Step entitas diubah total dari editable table menjadi profil pelaku usaha berbasis card dan accordion.",
        bullets: [
          "`Jenis Entitas` tidak lagi ditampilkan ke user, karena istilah itu hanya dipakai sebagai mapping backend.",
          "Importir dibuat selalu tampil dan menjadi entitas utama yang wajib diisi.",
          "PPJK, Penjual, Pemilik Barang, dan Pengangkut tampil sebagai card profil yang terpisah dan lebih mudah dipahami.",
          "Struktur input entitas dibuat seperti mengisi profil actor bisnis, bukan seperti mengedit struktur database atau baris Excel.",
          "Badge `Wajib` dan `Opsional` dipakai untuk membedakan prioritas pengisian tiap entitas.",
          "Icon tiap entitas dibuat berbeda supaya user cepat membedakan peran bisnisnya.",
        ],
      },
      {
        title: "6. Header, notifikasi, dan akses cepat",
        summary: "Header atas diperluas supaya jadi pusat navigasi ringan yang juga memuat update dan akses akun.",
        bullets: [
          "Badge merah di dekat lonceng sekarang jadi live counter notifikasi dan ditempel pada tombol lonceng itu sendiri.",
          "Ditambahkan tombol icon baru untuk akses changelog dengan dropdown preview dan tombol `View all`.",
          "Avatar diberi dropdown menu yang berisi akses ke komponen lokal dan tombol logout.",
          "Logout membersihkan session passkey lokal supaya akses bisa ditutup dan dibuka ulang dari awal.",
          "Warna header dan breadcrumb tetap mengikuti ketentuan brand yang sudah disepakati dari awal.",
        ],
      },
      {
        title: "7. Live docs komponen dan icon",
        summary: "Halaman referensi lokal diperkuat supaya tim bisa cek komponen dan icon sebelum dipakai ke flow utama.",
        bullets: [
          "`/component` tetap menjadi sample untuk komponen lokal seperti button, form control, modal, dan badge.",
          "`/icon` dijadikan halaman penuh untuk browsing icon, search, dan copy nama icon tanpa iframe.",
          "Search icon diperbaiki supaya hasil filtering sesuai nama icon yang benar, bukan hanya title visual.",
          "Kartu icon dibuat lebih rapat, tooltip dibersihkan, dan copy nama icon dibuat klik-to-copy.",
          "Halaman icon kini lebih cocok dipakai sebagai referensi integrasi visual dan validasi aset dari DS client.",
        ],
      },
      {
        title: "8. Perubahan text, label, dan microcopy",
        summary: "Banyak wording kecil dibenerin supaya alur terasa lebih jelas, lebih konsisten, dan lebih pas buat laporan TW.",
        bullets: [
          "Beberapa tombol diganti agar lebih jelas secara intent, misalnya `Ok, Lanjut ke Form`, `Lewati Upload Dokumen`, dan `Lanjut ke Data Parsing`.",
          "Label dan helper text di step upload dan parsing disederhanakan supaya tidak terlalu panjang, tapi tetap informatif.",
          "Beberapa istilah yang terlalu teknis diganti ke bahasa yang lebih dekat dengan istilah bisnis atau pelaku usaha.",
          "Copy pada halaman changelog sekarang mengarah ke laporan semi-teknis, bukan bahasa end-user biasa.",
        ],
      },
      {
        title: "9. Bugfix dan state behavior",
        summary: "Perubahan kecil tapi penting buat kestabilan interaksi, terutama di modal, tombol, dan state confirm/dismiss.",
        bullets: [
          "Masalah tombol batal / dismiss pada beberapa step dibetulkan agar perilakunya sesuai konteks: kadang langsung close, kadang muncul konfirmasi.",
          "State tombol diubah agar bisa menampilkan warning, info, brand, dan error sesuai kebutuhan dialog.",
          "Beberapa modal ditata ulang supaya alur keluar tidak bikin user kehilangan data tanpa sengaja.",
          "Hubungan antara pilihan file, status upload, dan lanjut ke parsing dibuat lebih eksplisit supaya tidak ada aksi yang diam-diam lompat step.",
        ],
      },
      {
        title: "10. Feedback mirror untuk TW",
        summary: "Feedback widget tetap mengirim ke Discord, tapi sekarang ada inbox halaman mockup supaya tim TW bisa baca isi masukan tanpa buka Discord.",
        bullets: [
          "Ditambahkan halaman `/feedback` sebagai mirror inbox dari feedback widget agar TW bisa membaca masukan, perbaikan, dan lampiran dari mockup.",
          "Header mendapat tombol icon baru yang membuka dropdown preview feedback serta shortcut ke halaman inbox lengkap.",
          "Struktur data feedback disiapkan agar nanti bisa diisi dari mirror endpoint atau feed Discord yang diekspor oleh service internal.",
          "TW bisa melihat reporter, jenis feedback, pesan, lampiran, raw payload JSON, dan sumber halaman dari satu tempat yang sama.",
        ],
      },
    ],
  },
];

function AccordionIcon({ open }: { open: boolean }) {
  return <ArrowRightIcon className={open ? "h-4 w-4 rotate-90" : "h-4 w-4 -rotate-90"} />;
}

function TocItem({
  active,
  entry,
  onClick,
}: {
  active: boolean;
  entry: ChangeLogEntry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
          : "border-border-primary bg-white hover:border-brand-primary-300 hover:bg-brand-primary-50/60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <DocumentsIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-neutral-800">{entry.commit}</span>
        <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{entry.title}</span>
        <span className="mt-2 inline-flex rounded-full bg-brand-primary-50 px-2.5 py-1 text-[10px] font-semibold text-brand-primary-700">
          {entry.date}
        </span>
      </span>
    </button>
  );
}

function TocPanel({
  dockLeft,
  tocCollapsed,
  mobileOpen,
  search,
  setSearch,
  filteredEntries,
  onToggleCollapse,
  onMobileToggle,
  onMobileClose,
  onDockLeft,
  onDockRight,
  onJump,
  orderClass,
}: {
  dockLeft: boolean;
  tocCollapsed: boolean;
  mobileOpen: boolean;
  search: string;
  setSearch: (value: string) => void;
  filteredEntries: ChangeLogEntry[];
  onToggleCollapse: () => void;
  onMobileToggle: () => void;
  onMobileClose: () => void;
  onDockLeft: () => void;
  onDockRight: () => void;
  onJump: (id: string) => void;
  orderClass: string;
}) {
  const sideClass = dockLeft ? "left-3" : "right-3";
  const hiddenClass = dockLeft ? "-translate-x-[110%]" : "translate-x-[110%]";
  const collapseIconClass = [
    "h-4 w-4 transition-transform",
    tocCollapsed ? (dockLeft ? "" : "rotate-180") : dockLeft ? "rotate-180" : "",
  ].join(" ");

  return (
    <>
      <div className={["fixed bottom-4 z-[65] lg:hidden", sideClass].join(" ")}>
        <button
          type="button"
          onClick={onMobileToggle}
          aria-label={mobileOpen ? "Tutup TOC" : "Buka TOC"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
        >
          <HamburgerMenuIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onMobileClose}
        aria-label="Close TOC overlay"
        className={[
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed top-[calc(var(--shell-sticky-top)+56px)] z-[70] w-[min(92vw,360px)] lg:hidden",
          sideClass,
          "transition-all duration-200",
          mobileOpen ? "translate-x-0 opacity-100" : `${hiddenClass} opacity-0`,
        ].join(" ")}
      >
        <Card className="flex h-full flex-col rounded-2xl border border-border-primary bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
          <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Table of Content</div>
              <div className="mt-1 text-[12px] text-neutral-700">Cari checkpoint dan lompat cepat</div>
            </div>
            <Button variant="ghost" size="sm" onClick={onMobileClose} aria-label="Dismiss drawer TOC">
              ×
            </Button>
          </div>

          {!tocCollapsed ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <div className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-md bg-background-primary text-neutral-500">
                  <MagniferIcon className="h-4 w-4" />
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder="Search toc..."
                  className="h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onDockLeft} className={dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}>
                  Kiri
                </Button>
                <Button size="sm" variant="outline" onClick={onDockRight} className={!dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}>
                  Kanan
                </Button>
              </div>

              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <TocItem
                      key={entry.id}
                      active
                      entry={entry}
                      onClick={() => {
                        onJump(entry.id);
                        onMobileClose();
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-4 text-[12px] text-neutral-600">
                    Tidak ada checkpoint yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end pt-3">
              <Button variant="ghost" size="sm" onClick={onToggleCollapse} aria-label="Expand TOC">
                <ArrowRightIcon className={collapseIconClass} />
              </Button>
            </div>
          )}
        </Card>
      </aside>

      <aside className={["hidden min-w-0 lg:block", orderClass].join(" ")}>
        <Card
          className={[
            "sticky top-[104px] overflow-hidden rounded-2xl border border-border-primary bg-white p-3 shadow-sm",
            tocCollapsed ? "lg:w-[72px]" : "lg:w-[320px]",
          ].join(" ")}
        >
          {tocCollapsed ? (
            <div>
              <div className="flex items-center justify-end gap-2 border-b border-border-primary pb-3">
                <Button variant="ghost" size="sm" onClick={onToggleCollapse} aria-label="Expand TOC">
                  <ArrowRightIcon className={collapseIconClass} />
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onJump(entry.id)}
                      aria-label={`${entry.commit} - ${entry.title}`}
                      className="flex h-14 w-full items-center justify-center rounded-xl border border-border-primary bg-background-primary/40 text-brand-primary-700 transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-50"
                    >
                      <DocumentsIcon className="h-5 w-5" />
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-3 text-center text-[11px] text-neutral-600">
                    Kosong
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Table of Content</div>
                  <div className="mt-1 text-[12px] text-neutral-700">Cari checkpoint dan lompat cepat</div>
                </div>
                <Button variant="ghost" size="sm" onClick={onToggleCollapse} aria-label="Collapse TOC">
                  <ArrowRightIcon className={collapseIconClass} />
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-md bg-background-primary text-neutral-500">
                  <MagniferIcon className="h-4 w-4" />
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder="Search toc..."
                  className="h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onDockLeft} className={dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}>
                  Kiri
                </Button>
                <Button size="sm" variant="outline" onClick={onDockRight} className={!dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}>
                  Kanan
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <TocItem
                      key={entry.id}
                      active
                      entry={entry}
                      onClick={() => onJump(entry.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-4 text-[12px] text-neutral-600">
                    Tidak ada checkpoint yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </aside>
    </>
  );
}

export function ChangeLogPage() {
  const [search, setSearch] = useState("");
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [tocSide, setTocSide] = useState<"left" | "right">("left");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([entries[0]?.id ?? ""]);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.commit,
        entry.date,
        entry.label,
        entry.title,
        entry.summary,
        ...entry.scope,
        ...entry.sections.flatMap((section) => [section.title, section.summary, ...section.bullets]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search]);

  const scrollToEntry = (id: string) => {
    const node = entryRefs.current[id];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleEntry = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
      <section className="rounded-2xl bg-gradient-to-br from-brand-primary-500 via-[#03306f] to-[#0756a7] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">Checkpoint changes</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90">Semi-technical log</span>
        </div>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[34px]">Change log implementasi mockup INSW</h1>
        <p className="mt-3 max-w-4xl text-[13px] leading-6 text-white/90">
          Halaman ini dipakai sebagai daftar perubahan yang bisa terus bertambah. Isinya dibikin cukup rinci untuk laporan client dan technical
          writer, termasuk perubahan UI, UX, flow, text, komponen lokal, dan bugfix yang terasa di penggunaan.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="border-white/30 bg-white text-brand-primary-700 hover:bg-white/90">
            <Link to="/">Kembali ke Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-white/30 bg-white text-brand-primary-700 hover:bg-white/90">
            <Link to="/component">Buka Komponen Lokal</Link>
          </Button>
        </div>
      </section>

        <div className="flex flex-col gap-4 lg:flex-row">
        {tocSide === "left" ? (
          <>
            <TocPanel
              dockLeft
              tocCollapsed={tocCollapsed}
              mobileOpen={mobileTocOpen}
              search={search}
              setSearch={setSearch}
              filteredEntries={filteredEntries}
              onToggleCollapse={() => setTocCollapsed((current) => !current)}
              onMobileToggle={() => setMobileTocOpen((current) => !current)}
              onMobileClose={() => setMobileTocOpen(false)}
              onDockLeft={() => setTocSide("left")}
              onDockRight={() => setTocSide("right")}
              onJump={(id) => {
                setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
                scrollToEntry(id);
              }}
              orderClass="lg:order-1"
            />
            <main className="min-w-0 flex-1 space-y-4 lg:order-2">
              <Card>
                <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Ringkasan checkpoint</div>
                    <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Perubahan pertama</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                    {entries.length} checkpoint
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="max-w-4xl text-[13px] leading-6 text-neutral-700">
                    Saat ini changelog masih berisi checkpoint pertama, tapi strukturnya sudah dibuat supaya ke depan tinggal tambah entry baru tanpa
                    mengubah pola baca. List di kiri dipakai sebagai TOC, sedangkan detail utama dibuka per accordion di sini.
                  </p>
                </CardBody>
              </Card>

              <div className="space-y-4">
                {filteredEntries.map((entry) => {
                  const open = openIds.includes(entry.id);

                  return (
                    <div
                      key={entry.id}
                      id={entry.id}
                      ref={(node) => {
                        entryRefs.current[entry.id] = node;
                      }}
                      className="scroll-mt-4"
                    >
                      <Card>
                        <button
                          type="button"
                          onClick={() => toggleEntry(entry.id)}
                          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">{entry.label}</div>
                              <span className="rounded-full bg-brand-primary-50 px-2.5 py-1 text-[10px] font-semibold text-brand-primary-700">
                                {entry.commit}
                              </span>
                            </div>
                            <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-neutral-800">{entry.title}</h3>
                            <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{entry.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entry.scope.map((scope) => (
                                <span
                                  key={scope}
                                  className="rounded-full bg-background-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-primary-700"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
                            <AccordionIcon open={open} />
                          </span>
                        </button>

                        {open ? (
                          <CardBody className="border-t border-border-primary">
                            <div className="grid gap-4">
                              {entry.sections.map((section) => (
                                <section key={section.title} className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
                                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">{section.title}</div>
                                  <p className="mt-2 text-[12px] leading-6 text-neutral-700">{section.summary}</p>
                                  <ul className="mt-3 space-y-2">
                                    {section.bullets.map((bullet) => (
                                      <li key={bullet} className="flex items-start gap-2 text-[12px] leading-6 text-neutral-700">
                                        <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-brand-primary-500" />
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              ))}
                            </div>
                          </CardBody>
                        ) : null}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        ) : (
          <>
            <main className="min-w-0 flex-1 space-y-4 lg:order-1">
              <Card>
                <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Ringkasan checkpoint</div>
                    <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Perubahan pertama</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                    {entries.length} checkpoint
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="max-w-4xl text-[13px] leading-6 text-neutral-700">
                    Saat ini changelog masih berisi checkpoint pertama, tapi strukturnya sudah dibuat supaya ke depan tinggal tambah entry baru tanpa
                    mengubah pola baca. List di kiri dipakai sebagai TOC, sedangkan detail utama dibuka per accordion di sini.
                  </p>
                </CardBody>
              </Card>

              <div className="space-y-4">
                {filteredEntries.map((entry) => {
                  const open = openIds.includes(entry.id);

                  return (
                    <div
                      key={entry.id}
                      id={entry.id}
                      ref={(node) => {
                        entryRefs.current[entry.id] = node;
                      }}
                      className="scroll-mt-4"
                    >
                      <Card>
                        <button
                          type="button"
                          onClick={() => toggleEntry(entry.id)}
                          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">{entry.label}</div>
                              <span className="rounded-full bg-brand-primary-50 px-2.5 py-1 text-[10px] font-semibold text-brand-primary-700">
                                {entry.commit}
                              </span>
                            </div>
                            <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-neutral-800">{entry.title}</h3>
                            <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{entry.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entry.scope.map((scope) => (
                                <span
                                  key={scope}
                                  className="rounded-full bg-background-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-primary-700"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
                            <AccordionIcon open={open} />
                          </span>
                        </button>

                        {open ? (
                          <CardBody className="border-t border-border-primary">
                            <div className="grid gap-4">
                              {entry.sections.map((section) => (
                                <section key={section.title} className="rounded-2xl border border-border-primary bg-background-primary/20 p-4">
                                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">{section.title}</div>
                                  <p className="mt-2 text-[12px] leading-6 text-neutral-700">{section.summary}</p>
                                  <ul className="mt-3 space-y-2">
                                    {section.bullets.map((bullet) => (
                                      <li key={bullet} className="flex items-start gap-2 text-[12px] leading-6 text-neutral-700">
                                        <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-brand-primary-500" />
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              ))}
                            </div>
                          </CardBody>
                        ) : null}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </main>

            <TocPanel
              dockLeft={false}
              tocCollapsed={tocCollapsed}
              mobileOpen={mobileTocOpen}
              search={search}
              setSearch={setSearch}
              filteredEntries={filteredEntries}
              onToggleCollapse={() => setTocCollapsed((current) => !current)}
              onMobileToggle={() => setMobileTocOpen((current) => !current)}
              onMobileClose={() => setMobileTocOpen(false)}
              onDockLeft={() => setTocSide("left")}
              onDockRight={() => setTocSide("right")}
              onJump={(id) => {
                setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
                scrollToEntry(id);
              }}
              orderClass="lg:order-2"
            />
          </>
        )}
      </div>
    </div>
  );
}
