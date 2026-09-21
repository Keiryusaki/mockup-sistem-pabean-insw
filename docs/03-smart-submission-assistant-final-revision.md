# Smart Submission Assistant — Final Revision Specification

## 1. Objective

Revisi Smart Submission Assistant agar mengikuti flow terbaru dari SA dan tetap mempertahankan karakter conversational/chat assistant.

Dokumen ini menjadi instruction utama untuk agent.

Tujuan utama revisi:
- Menyesuaikan flow dengan source flow terbaru dari SA.
- Mempertahankan wording bisnis/CTA semaksimal mungkin.
- Tetap menggunakan tampilan Smart Submission Assistant yang conversational.
- Menggunakan scope dokumen dari token SSO untuk mempersempit pilihan dokumen.
- Memisahkan tanggung jawab Smart Submission Assistant dengan Formulir Ekstraksi & Rincian.
- Menjaga history pertanyaan/jawaban agar tidak hilang saat berpindah tahap.
- Menghindari proses yang seharusnya berada di Formulir Ekstraksi agar tidak dipaksakan masuk ke modal Assistant.

## 2. IMPORTANT — COPY PRESERVATION RULE

Struktur visual Smart Submission Assistant boleh direvisi dan dimodernisasi, namun wording bisnis yang berasal dari flow resmi harus dipertahankan semaksimal mungkin.

Jangan mengubah tanpa requirement eksplisit:
- nama proses,
- nama dokumen,
- deskripsi bisnis,
- label pilihan,
- CTA utama.

Fokus revisi adalah presentation, hierarchy, spacing, interaction, branching, responsive behavior, dan state handling; bukan rewriting copy.

Jika membutuhkan helper text tambahan untuk UX, helper text boleh ditambahkan, tetapi jangan menggantikan wording utama dari SA.

Contoh:
- Gunakan `Lanjutkan Unggah Berkas`, jangan ganti menjadi `Mulai Upload`.
- Gunakan `BUKA FORMULIR EKSTRAKSI & RINCIAN`, jangan ganti menjadi `Lanjut ke Form`.

## 3. Positioning Smart Submission Assistant

Smart Submission Assistant bukan Form Pengajuan utama.

Smart Submission Assistant berfungsi sebagai preparation/orchestration layer sebelum user masuk ke Formulir Ekstraksi & Rincian.

Assistant bertugas membantu user:
1. Memilih jenis dokumen pabean yang diizinkan.
2. Memahami dokumen yang dipilih.
3. Mengunggah dokumen wajib.
4. Memilih metode input data barang.
5. Mengunggah spreadsheet bila menggunakan jalur Excel.
6. Menampilkan ringkasan validasi barang dan kebutuhan perizinan pada jalur Excel.
7. Menanyakan apakah user memiliki Dokumen Fasilitas / Dokumen Lainnya.
8. Melakukan handoff ke Formulir Ekstraksi & Rincian.

Setelah handoff, Smart Submission Assistant selesai. Proses berikutnya dilakukan pada `Formulir Ekstraksi & Rincian`, bukan di modal Assistant.

## 4. SSO / Token Scope

Backend sudah memberikan token dari SSO. Token tersebut membawa scope akun dan menentukan dokumen apa yang boleh dibuat oleh user.

Contoh mock:

```ts
const userScope = {
  direction: "IMPORT",
  allowedDocuments: ["BC20", "BC16"]
};
```

Implikasi:
- Jangan menampilkan seluruh dokumen kepada semua user.
- Step pemilihan dokumen hanya menampilkan dokumen yang ada pada `allowedDocuments`.
- Wording utama tetap menggunakan wording dari SA.
- UI hanya melakukan filtering option berdasarkan scope user.

Jika token hanya mengizinkan BC 2.0 dan BC 1.6, maka tampilkan:

`Silakan pilih jenis dokumen pemasukan yang akan diajukan:`

- BC 2.0
- BC 1.6

Jangan tampilkan opsi lain.

## 5. Overall Flow

```text
SSO / Token
↓
Scope dokumen diketahui
↓
Pemilihan Jenis Dokumen Pabean
↓
Informasi Dokumen
↓
Unggah Dokumen Wajib
↓
Pemilihan Metode Input Data Barang
├── Jalur Excel
│   ↓
│   Unggah Spreadsheet Rincian Barang
│   ↓
│   Ringkasan Validasi Elemen Barang
│   ↓
│   Daftar Persyaratan Perizinan Pos Tarif
│
└── Jalur Ekstraksi Invoice
    ↓
    Informasi Pemrosesan Dokumen

↓
Konfirmasi Dokumen Fasilitas / Tambahan
↓
Konfirmasi Inisialisasi Selesai
↓
BUKA FORMULIR EKSTRAKSI & RINCIAN
↓
Formulir Ekstraksi & Rincian
```

## 6. Conversation History

History conversation harus tetap terlihat selama Smart Submission Assistant aktif.

Saat berpindah tahap:
- Jangan reset area conversation.
- Pertanyaan assistant sebelumnya tetap tersimpan.
- Jawaban user sebelumnya tetap tersimpan.
- User tetap dapat scroll ke atas.

Jika conversation menjadi terlalu panjang, tambahkan pattern seperti `Lihat percakapan sebelumnya` atau `Lihat 7 jawaban sebelumnya`.

History tidak perlu tetap tampil setelah user masuk ke Formulir Ekstraksi & Rincian.

## 7. Suggested Visual Stepper

Gunakan macro step sederhana:

```text
1. Dokumen
2. Dokumen Wajib
3. Data Barang
4. Dokumen Tambahan
5. Selesai
```

Stepper hanya berfungsi sebagai progress indicator. Jangan membuat seluruh subproses menjadi 8–10 step kecil.

Branch Excel dan Ekstraksi Invoice tetap menggunakan stepper yang sama, tetapi isi step `Data Barang` berubah sesuai metode yang dipilih.

## 8. STEP 1 — Pemilihan Jenis Dokumen Pabean

Pertahankan wording:

### `Pemilihan Jenis Dokumen Pabean`

Assistant message:
- `Selamat datang di Layanan Mandiri Pabean INSW.`
- `Silakan pilih jenis dokumen pemasukan yang akan diajukan:`

Option mengikuti SSO scope. Contoh: BC 2.0, BC 1.6, BC 2.3, FTZ-01, KEK; tetapi jangan hardcode semua option untuk seluruh user.

UI:
- assistant bubble,
- option card / selection chip,
- selected state yang jelas.

Setelah user memilih, tampilkan jawaban user sebagai bubble agar history tetap terasa seperti conversation.

## 9. STEP 2 — Informasi Dokumen

Contoh jika user memilih BC 2.0.

Pertahankan wording:

### `PEMBERITAHUAN IMPOR BARANG UNTUK DIPAKAI (BC 2.0)`

`Digunakan untuk pengeluaran barang impor dari Kawasan Pabean dengan tujuan diimpor untuk dipakai.`

### `Dokumen Pelengkap Pabean Wajib:`

1. Faktur Perdagangan (Invoice)
2. Daftar Kemasan (Packing List)
3. B/L (Bill of Lading) atau AWB

CTA:
- `Ubah Dokumen`
- `Lanjutkan Unggah Berkas`

UI:
- information card di dalam conversation,
- icon dokumen,
- list dokumen wajib,
- hierarchy yang jelas.

`Ubah Dokumen` = secondary button.
`Lanjutkan Unggah Berkas` = primary button.

Jangan rewrite CTA.

## 10. STEP 3 — Unggah Dokumen Wajib

Pertahankan wording:

### `Unggah Dokumen Wajib`

`Silakan unggah seluruh dokumen pabean wajib`

`(Format: PDF, maks. 5MB per berkas):`

Upload list:
1. Invoice
2. Packing List
3. B/L / AWB

CTA: `Simpan & Lanjutkan`

UI gunakan upload card / upload row. Setiap item menampilkan:
- Nama dokumen
- Status wajib
- Pilih Berkas
- Nama file
- Status upload

Bill of Lading / AWB termasuk dokumen wajib.

## 11. STEP 4 — Pemilihan Metode Input Data Barang

Pertahankan wording:

### `Pemilihan Metode Input Data Barang`

`Dokumen wajib berhasil diunggah. Silakan tentukan metode pengisian elemen data rincian barang:`

Choice:
- `Unggah Spreadsheet Excel`
- `Ekstraksi Otomatis Invoice`

Helper:
`Unduh Format Standar: Template_Rincian_Barang_LNSW.xlsx`

UI gunakan dua large choice card. Setelah memilih branch, tampilkan jawaban user di history.

## 12. BRANCH A — Jalur Excel

### 12.1 Unggah Spreadsheet Rincian Barang

Pertahankan:

### `Unggah Spreadsheet Rincian Barang`

`Silakan unggah berkas rincian barang sesuai format template:`

Dropzone:
- `Klik atau seret berkas spreadsheet ke sini`
- `Format didukung: .xlsx / .xls`

Gunakan drag & drop upload component.

### 12.2 Ringkasan Validasi Elemen Barang

Pertahankan heading:

### `RINGKASAN VALIDASI ELEMEN BARANG`

Tampilkan:
- Total Seri Barang
- Total Pos Tarif (HS)
- Total Nilai Barang (CIF)

### `Status Ketentuan & Regulasi:`
- Pos Tarif Wajib Lartas / Izin
- Pos Tarif Bebas Lartas
- Pos Tarif Spesifikasi Khusus

CTA: `Lanjutkan`

UI jangan dibuat seperti chat text panjang. Gunakan analysis/result card di dalam conversation.

### 12.3 Daftar Persyaratan Perizinan Pos Tarif

Pertahankan:

### `Daftar Persyaratan Perizinan Pos Tarif`

`Berdasarkan Pos Tarif yang diajukan, berikut daftar izin yang dipersyaratkan:`

Data contoh:
- Dokumen
- Nama Izin
- Kode Izin Kepabeanan
- Komoditi
- Regulasi
- Deskripsi
- Keterangan

CTA: `Lanjutkan`

Jika data izin banyak, jangan tampilkan puluhan card besar sekaligus. Gunakan grouping per Pos Tarif / HS Code dengan expandable/accordion.

Pada tahap Assistant ini sifatnya masih informasi persyaratan. Jangan membuat keputusan approve/reject.

## 13. BRANCH B — Jalur Ekstraksi Invoice

Jika user memilih `Ekstraksi Otomatis Invoice`, jangan melakukan seluruh OCR/mapping rinci di dalam Assistant.

Pertahankan wording:

### `INFORMASI PEMROSESAN DATA BARANG`

`Ekstraksi otomatis (OCR) rincian barang dari berkas Invoice akan dijalankan pada Formulir Ekstraksi.`

`Anda dapat memeriksa kesesuaian uraian barang serta penetapan Pos Tarif (HS Code) pada formulir tersebut.`

CTA: `Lanjutkan`

UI gunakan information card. Boleh tambahkan visual process sederhana `Invoice → OCR → Rincian Barang → HS Code`, tetapi wording utama tidak diubah.

Proses OCR sebenarnya dilakukan nanti pada Formulir Ekstraksi & Rincian.

## 14. STEP 5 — Konfirmasi Dokumen Fasilitas / Tambahan

Kedua branch bertemu kembali di sini.

Pertahankan wording:

### `Konfirmasi Dokumen Fasilitas / Tambahan`

`Apakah Anda memiliki Dokumen Fasilitas atau Dokumen Lainnya yang akan dilampirkan nanti?`

Helper:
`(Contoh: Surat Keterangan Asal / COO, Laporan Surveyor, Polis)`

Catatan:
`Catatan: Pengunggahan berkas dokumen tambahan akan dilakukan pada Formulir Lanjutan.`

Pilihan:
- `Ya`
- `Tidak`

Jika user memilih `Ya`:

```ts
hasAdditionalDocuments = true
```

Jika `Tidak`:

```ts
hasAdditionalDocuments = false
```

Jangan upload file tambahan pada Smart Submission Assistant. Upload aktual disediakan di Formulir Ekstraksi & Rincian.

## 15. STEP 6A — Handoff Jalur Excel

Pertahankan:

### `INISIALISASI PENGAJUAN BC 2.0 SELESAI`

`Dokumen administrasi dan file Excel rincian barang telah berhasil dicatat ke dalam draf pengajuan.`

`Silakan menuju Formulir Lanjutan untuk meninjau rincian item barang, Pos Tarif, serta mengunggah berkas perizinan dan dokumen pendukung:`

CTA:
### `BUKA FORMULIR EKSTRAKSI & RINCIAN`

Gunakan success/handoff card. Boleh tambahkan summary visual:
- Dokumen: BC 2.0
- Dokumen wajib: 3 file
- Metode barang: Spreadsheet Excel
- Dokumen fasilitas: Ada / Tidak Ada

CTA utama wajib mempertahankan wording.

## 16. STEP 6B — Handoff Jalur Ekstraksi Invoice

Pertahankan:

### `INISIALISASI PENGAJUAN BC 2.0 SELESAI`

`Seluruh dokumen administrasi awal telah tersimpan.`

`Silakan menuju Formulir Lanjutan untuk memulai proses OCR pembacaan barang, validasi Pos Tarif, serta unggah berkas dokumen perizinan / fasilitas:`

CTA:
### `BUKA FORMULIR EKSTRAKSI INVOICE`

Untuk mockup, CTA ini boleh membuka page yang sama: `Formulir Ekstraksi & Rincian`, tetapi mode awalnya berbeda:

```ts
extractionMode = "INVOICE_OCR";
```

Sedangkan Excel:

```ts
extractionMode = "EXCEL";
```

Label CTA tetap mengikuti wording resmi.

## 17. Handoff Behavior

Saat CTA handoff diklik:
1. Smart Submission Assistant selesai.
2. Modal Assistant ditutup.
3. Navigasi ke route/page baru `Formulir Ekstraksi & Rincian`.
4. Kirim state hasil Assistant.

Contoh state:

```ts
submissionPreparation = {
  documentType: "BC20",
  requiredDocuments: [
    "invoice",
    "packing_list",
    "bill_of_lading"
  ],
  inputMethod: "EXCEL",
  spreadsheet: {
    fileName: "rincian_barang.xlsx",
    totalItems: 12,
    totalHsCodes: 3,
    totalCif: 42500
  },
  permitRequirements: [],
  hasAdditionalDocuments: true,
  extractionMode: "EXCEL"
};
```

Untuk branch Invoice:

```ts
inputMethod: "INVOICE_OCR",
extractionMode: "INVOICE_OCR"
```

## 18. Formulir Ekstraksi & Rincian — Initial Placeholder

Rancangan final Formulir Ekstraksi & Rincian belum diberikan oleh client.

Jangan membuat business logic final yang belum diketahui.

Buat terlebih dahulu skeleton/workspace yang menyediakan space untuk:
1. Ringkasan Pengajuan
2. Sumber Data
3. Hasil Ekstraksi / Mapping
4. Rincian Barang
5. Pos Tarif / HS Code
6. Persyaratan Perizinan
7. Dokumen Perizinan
8. Dokumen Fasilitas / Tambahan
9. Validasi / Catatan
10. CTA menuju Formulir Utama Pabean

Semua section harus mudah direvisi setelah rancangan resmi diterima.

## 19. Conditional Section — Dokumen Fasilitas / Tambahan

Jika:

```ts
hasAdditionalDocuments === true
```

maka di Formulir Ekstraksi & Rincian tampilkan section:

### `Dokumen Fasilitas / Tambahan`

Sediakan placeholder upload. Contoh kemungkinan field:
- Jenis Dokumen
- Nomor Dokumen
- Tanggal
- Instansi
- File
- Upload

Contoh jenis:
- COO
- Laporan Surveyor
- Polis
- Dokumen lainnya

Karena rancangan resmi belum tersedia, jangan menganggap struktur ini final.

Jika `hasAdditionalDocuments === false`, section boleh tidak ditampilkan atau ditampilkan collapsed dengan empty state dan CTA `Tambah Dokumen`.

Untuk mockup lebih aman tampil conditional.

## 20. Formulir Ekstraksi — Jalur Excel

Jika:

```ts
extractionMode === "EXCEL"
```

initial workspace dapat menampilkan:

### Ringkasan Spreadsheet
- File
- Total Seri Barang
- Total Pos Tarif
- Total CIF

### Rincian Barang
Gunakan table/workspace.

### Pos Tarif & Persyaratan
Tampilkan hasil yang sebelumnya sudah didapat dari Assistant.

### Upload Perizinan
Sediakan placeholder.

### Dokumen Fasilitas / Tambahan
Tampil jika `hasAdditionalDocuments === true`.

## 21. Formulir Ekstraksi — Jalur Invoice

Jika:

```ts
extractionMode === "INVOICE_OCR"
```

initial workspace dapat dimulai dengan proses:

```text
Membaca Invoice
↓
OCR
↓
Ekstraksi Rincian Barang
↓
Identifikasi Kandidat HS Code
↓
User Review
```

Lalu tampilkan workspace hasil.

Assistant tidak perlu melakukan proses ini sebelumnya.

## 22. Formulir Ekstraksi Bukan Chat

PENTING.

Smart Submission Assistant:
- conversational,
- bubble,
- choices,
- assistant guidance.

Formulir Ekstraksi & Rincian:
- page/workspace,
- form,
- table,
- drawer,
- TOC,
- status,
- upload.

Jangan pertahankan bubble chat setelah user masuk Formulir Ekstraksi & Rincian.

Transisi harus terasa jelas.

## 23. Preserve Existing Visual Language

Reuse komponen existing sebanyak mungkin:
- modal Assistant,
- assistant avatar/icon,
- bubble conversation,
- option card,
- upload card,
- stepper,
- parsing/result card,
- summary card.

Jangan rebuild seluruh visual dari nol.

Yang direvisi terutama:
- sequence,
- branching,
- wording,
- handoff.

## 24. Interaction State

Gunakan state terstruktur:

```ts
const assistantState = {
  userScope: {
    direction: null,
    allowedDocuments: []
  },
  selectedDocument: null,
  requiredDocuments: {
    invoice: null,
    packingList: null,
    billOfLadingOrAwb: null
  },
  inputMethod: null, // EXCEL | INVOICE_OCR
  spreadsheet: {
    file: null,
    parsed: false,
    summary: null,
    permitRequirements: []
  },
  hasAdditionalDocuments: null,
  conversationHistory: [],
  initializationComplete: false
};
```

Conversation history jangan berasal dari component state yang di-reset tiap step.

## 25. Conversation Event Example

```ts
conversationHistory = [
  {
    role: "assistant",
    type: "message",
    text: "Silakan pilih jenis dokumen pemasukan yang akan diajukan:"
  },
  {
    role: "user",
    type: "selection",
    value: "BC 2.0"
  },
  {
    role: "assistant",
    type: "document-info",
    documentType: "BC20"
  }
];
```

Gunakan renderer berdasarkan `type` agar history tetap tampil walaupun interaction berikutnya berubah.

## 26. Responsive Behavior

Desktop:
- modal Assistant tetap besar seperti existing,
- conversation area scrollable,
- sticky header + progress.

Mobile:
- option card stack vertical,
- upload rows menjadi card,
- CTA tetap mudah dijangkau,
- summary card stack.

Tidak perlu menyelesaikan seluruh mobile optimization jika scope mockup masih desktop, tetapi jangan hardcode layout yang mustahil dibuat responsive.

## 27. Acceptance Criteria

Revisi dianggap sesuai apabila:
1. Scope jenis dokumen mengikuti mock SSO token.
2. Pemilihan dokumen tetap terasa conversational.
3. Wording utama mengikuti flow SA.
4. CTA utama tidak di-rewrite.
5. Dokumen wajib BC 2.0 mencakup Invoice, Packing List, dan B/L atau AWB.
6. User memilih antara Spreadsheet Excel dan Ekstraksi Otomatis Invoice.
7. Jalur Excel memiliki upload spreadsheet.
8. Jalur Excel menampilkan Ringkasan Validasi Elemen Barang.
9. Jalur Excel menampilkan Daftar Persyaratan Perizinan Pos Tarif.
10. Jalur Invoice hanya menampilkan informasi bahwa OCR akan dilakukan pada Formulir Ekstraksi.
11. Kedua branch bertemu pada Konfirmasi Dokumen Fasilitas / Tambahan.
12. Upload dokumen fasilitas belum dilakukan di Assistant.
13. Assistant mencatat Ya/Tidak sebagai state.
14. History conversation tetap dapat dilihat saat berpindah tahap.
15. Assistant berakhir pada CTA handoff.
16. CTA Excel menggunakan `BUKA FORMULIR EKSTRAKSI & RINCIAN`.
17. CTA Invoice menggunakan `BUKA FORMULIR EKSTRAKSI INVOICE`.
18. Setelah CTA, modal Assistant ditutup.
19. User diarahkan ke Formulir Ekstraksi & Rincian.
20. Formulir Ekstraksi berupa workspace/form, bukan chat.
21. Formulir Ekstraksi memiliki placeholder untuk upload Dokumen Fasilitas / Tambahan jika sebelumnya memilih Ya.
22. Jangan membuat business logic final untuk Formulir Ekstraksi yang belum diberikan client.

## 28. Final Instruction

Prioritas revisi:
1. **Preserve wording**
2. **Correct flow**
3. **Keep conversational assistant experience**
4. **Respect SSO scope**
5. **Clean handoff to Formulir Ekstraksi**
6. **Do not over-design unknown extraction form requirements**

Jika terdapat perbedaan antara wording existing mockup dan wording pada source flow SA, prioritaskan wording dari source flow SA.
