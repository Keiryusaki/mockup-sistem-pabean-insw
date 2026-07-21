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
  {
    id: "commit-002",
    commit: "Checkpoint 02",
    date: "6 Juli 2026",
    label: "Perubahan kedua",
    title: "Feedback widget, avatar shortcut, dan mirror inbox disiapkan",
    summary:
      "Checkpoint kedua mulai masuk setelah 6 Juli 2026 pukul 12.00. Fokusnya pindah ke jalur feedback: tombol Lapor Pak dipindah ke avatar menu, changelog shortcut tetap tersedia di dropdown, feedback bisa dikirim ke Discord, dan inbox mirror disiapkan supaya TW bisa baca thread tanpa buka Discord.",
    scope: ["Feedback", "Discord", "Mirror Inbox", "Header", "Bugfix"],
    sections: [
      {
        title: "1. Avatar menu dan akses cepat",
        summary: "Akses ke feedback dan changelog dipusatkan di dropdown avatar supaya header lebih rapi tapi tetap punya shortcut penting.",
        bullets: [
          "Item `Lapor Pak !!` dipindah ke dropdown avatar agar akses feedback lebih dekat ke kontrol akun.",
          "Shortcut `Change Log` ditambahkan lagi di bawah `Lapor Pak !!` supaya catatan perubahan tetap gampang dibuka.",
          "Avatar menu tetap menyimpan akses ke komponen lokal dan logout, jadi semua action akun ngumpul di satu tempat.",
          "Copy menu dirapikan supaya user langsung paham tiap shortcut tanpa harus baca terlalu panjang.",
        ],
      },
      {
        title: "2. Feedback widget dan submit flow",
        summary: "Widget feedback dibuat lebih siap dipakai, dengan input yang mendukung lampiran, paste gambar, dan verifikasi sederhana sebelum submit.",
        bullets: [
          "Feedback widget mengirim payload ke endpoint Discord service dengan nama, pesan, halaman, url, phase, dan lampiran.",
          "Pasting gambar dari clipboard didukung langsung supaya laporan cepat dikirim tanpa proses upload tambahan.",
          "Lampiran file dan image dipreview sebelum dikirim, termasuk penghapusan item per file.",
          "Challenge matematika ditambahkan sebagai gate ringan supaya submit tidak kebanjiran spam.",
        ],
      },
      {
        title: "3. Discord service dan mirror feed",
        summary: "Data feedback disiapkan untuk bisa diproses service Discord, lalu dimirror ke feed lokal yang bisa dibaca ulang oleh UI mockup.",
        bullets: [
          "Service Discord menormalisasi payload feedback ke format yang bisa dipakai ulang oleh inbox mirror.",
          "Feed lokal mendukung record root dan reply sehingga thread bisa dibaca sebagai percakapan, bukan satu pesan tunggal.",
          "Phase `Perubahan Kedua` disematkan ke data feedback supaya laporan TW konsisten dengan batas phase baru.",
          "Label lampiran dan isi pesan dijaga agar line break serta tipe embed tetap terbaca konsisten di hasil mirror.",
        ],
      },
      {
        title: "4. Feedback inbox dan baca thread",
        summary: "Halaman inbox dirombak jadi mirror panel yang bisa filter, refresh otomatis, buka thread, dan preview lampiran tanpa keluar dari app.",
        bullets: [
          "`/feedback` sekarang menampilkan daftar root feedback, reply di dalam thread, status, tag, dan raw JSON payload.",
          "Filter ditambah untuk jenis feedback, status, dan item yang punya lampiran.",
          "Refresh otomatis dipasang supaya mirror tetap sinkron saat feed berubah.",
          "Preview lampiran gambar dibuat bisa dibuka fullscreen dengan zoom, cocok untuk cek screenshot atau bukti visual.",
        ],
      },
      {
        title: "5. Penyesuaian data dan microcopy",
        summary: "Beberapa penyesuaian kecil dilakukan supaya phase kedua rapi di UI dan data yang tampil tidak campur dengan phase pertama.",
        bullets: [
          "Record demo dan storage lokal sekarang memakai phase `Perubahan Kedua` untuk membedakan masukan phase baru.",
          "Label dan copy pada feedback mirror disesuaikan agar cocok untuk pembacaan TW, bukan hanya untuk testing internal.",
          "Kolom `Jenis Dokumen` di tabel data pengajuan kini menampilkan kode dokumen saja, dan opsi filternya diseragamkan ke kode yang sama.",
          "Format line break pada pesan dijaga supaya isi feedback tetap enak dibaca di inbox dan payload mentah.",
          "Perubahan ini jadi batas resmi sesudah checkpoint pertama selesai.",
        ],
      },
      {
        title: "6. Text, badge, dan state visual",
        summary: "Selain alur dan struktur data, checkpoint kedua juga merapikan copy, label badge, dan state visual supaya semua titik masuk terasa konsisten.",
        bullets: [
          "Dropdown avatar sekarang menampilkan item `Lapor Pak !!`, `Change Log`, `Komponen Lokal`, dan `Logout` dengan label yang lebih tegas dan urutan yang lebih masuk akal.",
          "Badge phase di data feedback memakai `Perubahan Kedua`, jadi root record, reply, dan preview mirror langsung terbaca berada di checkpoint yang sama.",
          "Di feedback mirror, status badge dipakai untuk membedakan `Baru`, `Dibaca`, `Ditindaklanjuti`, dan `Selesai` tanpa harus buka detail thread.",
          "Badge tipe `Masukan` dan `Perbaikan` dirapikan supaya filter dan kartu ringkasan lebih gampang dipindai.",
          "Header feedback menampilkan badge `Feedback mirror`, `Thread ready`, dan badge source agar user tahu data yang dilihat itu dari mana.",
          "Badge kecil pada lampiran dan preview juga disesuaikan supaya file image, file biasa, dan state preview terbaca lebih cepat.",
          "Copy ringkas di halaman changelog, inbox feedback, dan widget submit disamakan nadanya supaya terasa satu keluarga, bukan potongan teks yang berdiri sendiri.",
        ],
      },
    ],
  },
  {
    id: "commit-003",
    commit: "Checkpoint 03",
    date: "10 Juli 2026",
    label: "Perubahan ketiga",
    title: "Seluruh perubahan lokal yang belum dipush dirangkum di sini",
    summary:
      "Checkpoint ketiga sekarang dipakai sebagai kumpulan semua perubahan lokal yang belum dipush ke git. Isinya mencakup pemecahan halaman dashboard/data/detail/progress/form, penyesuaian sidebar dan launcher, perapihan komponen lokal dan icon library, sampai penyempurnaan alur dokumen lampiran dan review status.",
    scope: ["Dashboard", "Data", "Form", "Detail", "Progress", "Docs", "Sidebar", "Launcher", "Bugfix"],
    sections: [
      {
        title: "1. Struktur halaman dan routing",
        summary: "Halaman utama dipisah dan dipetakan ulang supaya tiap flow punya route dan breadcrumb sendiri.",
        bullets: [
          "Route baru `Data Pengajuan / Detail Pengajuan` ditambahkan supaya detail readonly punya halaman sendiri dan tidak bercampur dengan form.",
          "Breadcrumb dan aksi `Kembali` di layout utama diperluas untuk halaman detail, progress, dan form.",
          "Struktur dashboard, data pengajuan, detail, progress, dan form dipisah ke komponen halaman yang lebih ringan agar editing berikutnya lebih aman.",
          "Banyak helper dashboard dipecah ke folder `src/pages/dashboard` supaya entry page, launcher, dan data statis tidak menumpuk di satu file besar.",
          "Shell layout juga ikut disesuaikan agar footer, breadcrumb, dan area sticky tidak saling makan ruang di desktop.",
          "Variabel layout global ditambah supaya tinggi sticky dan spacing antar area lebih gampang dihitung ulang.",
        ],
      },
      {
        title: "2. Dashboard, data pengajuan, dan launcher",
        summary: "CTA pengajuan dan tabel data disesuaikan supaya flow dari dashboard maupun `/data` terasa konsisten.",
        bullets: [
          "CTA `Pengajuan` di dashboard dan di halaman `/data` memakai icon lokal yang sama dari library icon internal.",
          "Launcher pengajuan bisa dibuka dari halaman data tanpa memaksa user pindah ke dashboard, lalu modal tetap ditutup di halaman yang sama.",
          "Tombol dan search field di tabel data pengajuan dirapikan ukuran serta proporsinya agar lebih konsisten.",
          "Menu sidebar dashboard disesuaikan icon-nya, dibuat collapsible seperti TOC, dan tinggi panelnya mengikuti ruang viewport dengan lebih pas.",
          "Card ringkasan pengajuan, statistik, dan filter status dashboard dipisah agar lebih gampang dipelihara.",
          "Data tabel pengajuan tetap mempertahankan aksi detail, progress, edit, copy, dan delete sesuai status baris.",
          "Favicon browser diarahkan ke aset lokal supaya tampilan app lebih konsisten dengan brand INSW.",
        ],
      },
      {
        title: "3. Form pengajuan dan upload flow",
        summary: "Flow form dipecah dan diselaraskan ulang supaya step upload, parsing, review, dan dokumen lampiran lebih jelas.",
        bullets: [
          "Step upload assistant dan non-assistant disesuaikan lagi agar ketentuan alurnya sama, termasuk tombol footer, status lanjut parsing, dan copy tombol.",
          "Step review diringkas: badge status disamakan ke komponen lokal, statistik ditata ulang, dan label yang redundan dihapus.",
          "Step `Dokumen Lampiran` sekarang lebih file-driven: ada input file, nama file masuk ke `Nomor Dokumen`, dan simpan ditahan kalau file belum dipilih.",
          "TOC di form pengajuan dan entitas diatur ulang supaya urutan jump ke section sama dengan urutan card kontennya.",
          "Bagian sticky TOC di form dan detail diberi top offset yang lebih nyaman, plus scrollbar internal untuk daftar TOC yang panjang.",
          "Notifikasi draft terakhir di bawah wizard dijadikan toast/alert yang bisa di-dismiss, bukan banner statis.",
          "Beberapa badge review dan label status di form diselaraskan lagi supaya tidak duplikatif dan lebih mudah dibaca.",
          "Wordings pada step upload, parsing, review, dan dokumen lampiran dipoles ulang supaya konsisten dengan approval client sebelumnya.",
          "Alur pengajuan dengan assistant tetap membawa step identifikasi, upload, parsing, dan review, tapi state lokalnya di-reset lewat session hook supaya modal tidak menyimpan state lama.",
        ],
      },
      {
        title: "4. Detail, progress, dan dokumen pendukung",
        summary: "Halaman detail dan progress diperkaya supaya lebih dekat ke kebutuhan baca-audit, bukan sekadar tampilan statis.",
        bullets: [
          "Halaman progress sekarang punya detail timeline yang lebih informatif, dukungan note detail, dan aksi download response JSON.",
          "Halaman detail pengajuan ditambahkan sebagai route readonly dengan TOC, breadcrumb, dan drawer/section yang lebih jelas.",
          "Komponen dokumen pendukung di progress serta halaman detail disesuaikan agar action dan label lebih mudah dipindai.",
          "Drawer/section child data di step barang dan compliance juga dirapikan agar status aktif, action, dan file referensi lebih konsisten.",
          "Timeline progress sekarang punya detail note yang bisa dibuka ke modal, bukan cuma label statis di daftar.",
          "Ringkasan progress dan file respon instansi ditambah aksi download agar lebih cocok untuk peninjauan internal.",
          "Download response dibungkus jadi JSON payload lokal supaya preview data bisa dicontoh tanpa backend.",
        ],
      },
      {
        title: "5. Live docs, icon, dan komponen lokal",
        summary: "Library komponen lokal dan icon set dijadikan referensi yang lebih lengkap untuk pekerjaan berikutnya.",
        bullets: [
          "Halaman `/component` ditambah materi tooltip, badge, dan pembenahan urutan section supaya lebih representatif sebagai live docs.",
          "Halaman `/icon` tetap jadi referensi icon set lokal, dan beberapa icon baru/penyesuaian dipakai langsung di dashboard serta data pengajuan.",
          "Input kompak, tooltip portal, badge, dan icon wrapper dirapikan supaya dipakai ulang ke banyak flow tanpa duplikasi style.",
          "Badge system, tooltip, dan icon library dijadikan bagian live docs supaya tim gampang cek perilaku komponen lokal sebelum dipakai ke page utama.",
          "Icon lokal dipakai ulang untuk menu dashboard, CTA pengajuan, action tabel, dan area search agar visualnya konsisten.",
          "Favicon app diarahkan ke `public/favico.png` supaya identitas visual konsisten di browser.",
          "Urutan section pada live docs juga diubah supaya representatif: badge/tooltip masuk lebih awal, loading state tetap ada di bawah sebagai referensi lain.",
        ],
      },
      {
        title: "6. Shell, layout, dan copy umum",
        summary: "Beberapa penyesuaian global dilakukan supaya ruang layar, footer, dan copy umum lebih pas.",
        bullets: [
          "Shell header, breadcrumb, footer, dan sidebar layout disesuaikan supaya tinggi panel terasa lebih pas di viewport desktop.",
          "Style dasar dan helper layout ditambah variabel shell agar perhitungan sticky area lebih eksplisit.",
          "Copy pada changelog, dashboard, dan form dirapikan supaya narasinya konsisten untuk laporan client dan workflow internal.",
          "Tooltip, badge, button, input, dan modal lokal diberi penyesuaian kecil agar ukuran dan jaraknya tidak jomplang antar halaman.",
          "Wording kecil di tombol, helper text, dan badge status diganti berkali-kali supaya lebih cocok dengan pola bahasa yang sudah disepakati client.",
          "Beberapa aset statis dan file revisi lama dibersihkan dari workspace setelah dipindahkan ke struktur baru.",
        ],
      },
      {
        title: "7. Wiring data, state, dan bugfix antar modal",
        summary: "Bagian paling teknis dari checkpoint ini ada di alur state, penghubung modal, dan sinkronisasi antar halaman.",
        bullets: [
          "State launcher, wizard, parsing, dan review sekarang dipecah ke hook dan helper supaya modal yang sama bisa dipakai di dashboard maupun data page.",
          "Alur upload template, upload OCR, parsing review, dan copy data disatukan lagi lewat komponen shared agar tidak ada duplikasi UI yang beda tipis.",
          "State pilihan file, status upload, dan tombol lanjut parsing diselaraskan supaya disabled/enabled mengikuti status sebenarnya.",
          "Beberapa data mock seperti summary card, proposal list, dan upload flow juga dipindahkan agar page utama cuma fokus ke render.",
          "Bug kecil seperti icon terlalu besar, badge dobel, TOC aktif yang loncat, dan ruang kosong di menu ikut dibenahi sebagai bagian dari checkpoint ini.",
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
            <Link to="/dashboard">Kembali ke Dashboard</Link>
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
                    <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Perubahan pertama, kedua, &amp; ketiga</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                    {entries.length} checkpoint
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="max-w-4xl text-[13px] leading-6 text-neutral-700">
                    Saat ini changelog sudah dibagi jadi 3 checkpoint: checkpoint pertama untuk fondasi dashboard dan flow utama, checkpoint
                    kedua untuk perubahan feedback dan mirror inbox yang masuk setelah 6 Juli 2026 pukul 12.00, lalu checkpoint ketiga untuk
                    semua perubahan lokal yang belum dipush ke git. List di kiri dipakai sebagai TOC, sedangkan detail utama dibuka per accordion
                    di sini.
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
                    <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Perubahan pertama &amp; kedua</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                    {entries.length} checkpoint
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="max-w-4xl text-[13px] leading-6 text-neutral-700">
                    Saat ini changelog sudah dibagi jadi 2 checkpoint: checkpoint pertama untuk fondasi dashboard dan flow utama, lalu checkpoint
                    kedua untuk perubahan feedback dan mirror inbox yang masuk setelah 6 Juli 2026 pukul 12.00. List di kiri dipakai sebagai TOC,
                    sedangkan detail utama dibuka per accordion di sini.
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
