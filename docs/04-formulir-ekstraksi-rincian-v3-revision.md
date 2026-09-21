# Formulir Ekstraksi & Rincian — V3 Implementation Revision

## 1. Tujuan

Dokumen ini menjadi instruction implementasi untuk melengkapi halaman **Formulir Ekstraksi & Rincian** berdasarkan:

- flow Smart Submission Assistant terbaru,
- screen 10–12 dari dokumen SA v3,
- skeleton halaman yang sudah dibuat di mockup,
- serta prinsip UX yang sudah disepakati sebelumnya.

Fokus utama:

1. Pertahankan shell/layout existing yang sudah dibuat agent.
2. Lengkapi placeholder berdasarkan struktur Formulir Ekstraksi & Rincian yang sudah diberikan SA.
3. Pisahkan behavior jalur `EXCEL` dan `INVOICE_OCR`.
4. Gabungkan section yang terlalu granular agar mengikuti struktur bisnis yang lebih natural.
5. Jangan mengubah ulang Smart Submission Assistant kecuali bagian handoff/state yang dibutuhkan halaman ini.
6. Pertahankan wording bisnis dari source SA semaksimal mungkin, terutama heading penting dan CTA.

---

# 2. IMPORTANT — DO NOT REBUILD THE PAGE FROM SCRATCH

Existing page shell sudah sesuai arah.

Pertahankan:

- header aplikasi,
- breadcrumb,
- hero/header `Formulir Ekstraksi & Rincian`,
- left-side TOC,
- white content cards,
- overall enterprise/government visual style,
- footer action,
- spacing dan layout dasar.

Fokus perubahan adalah:

- isi section,
- grouping,
- conditional rendering,
- tables,
- HS Code interaction,
- permit workspace,
- supporting document upload,
- dan state antar branch.

---

# 3. Boundary Sistem

Smart Submission Assistant selesai ketika user menekan:

### Jalur Excel
`BUKA FORMULIR EKSTRAKSI & RINCIAN`

### Jalur Invoice
`BUKA FORMULIR EKSTRAKSI INVOICE`

Setelah CTA tersebut:

- modal Smart Submission Assistant ditutup,
- user masuk ke halaman `Formulir Ekstraksi & Rincian`,
- UI tidak lagi berbentuk chat/conversation,
- semua data hasil Assistant diteruskan melalui state/mock context.

---

# 4. State dari Smart Submission Assistant

Gunakan mock state terstruktur.

Contoh:

```ts
type ExtractionMode = "EXCEL" | "INVOICE_OCR";

type SubmissionPreparation = {
  documentType: "BC20";
  documentLabel: "BC 2.0";

  requiredDocuments: {
    invoice?: UploadedFile;
    packingList?: UploadedFile;
    billOfLadingOrAwb?: UploadedFile;
  };

  inputMethod: ExtractionMode;

  spreadsheet?: {
    fileName: string;
    totalItems: number;
    totalHsCodes: number;
    totalCif: number;
    currency: string;
  };

  hasAdditionalDocuments: boolean;

  permitRequirements?: PermitRequirement[];

  initializationComplete: boolean;
};
```

Page harus bisa dirender berdasarkan `inputMethod`.

---

# 5. Struktur Halaman Baru

Existing TOC terlalu granular.

Ubah menjadi struktur berikut.

## Jalur Excel

```text
1. Ringkasan Pengajuan
2. Sumber Data
3. Rincian Barang & Pos Tarif
4. Perizinan
5. Dokumen Fasilitas / Tambahan
```

## Jalur Invoice / OCR

```text
1. Ringkasan Pengajuan
2. Sumber Data
3. Hasil Ekstraksi OCR
4. Rincian Barang & Pos Tarif
5. Perizinan
6. Dokumen Fasilitas / Tambahan
```

`Hasil Ekstraksi OCR` hanya muncul pada branch `INVOICE_OCR`.

Jangan mempertahankan section terpisah:

- Pos Tarif / HS Code
- Persyaratan Perizinan
- Dokumen Perizinan

sebagai 3 section independen.

Gabungkan sesuai arahan di bawah.

---

# 6. Ringkasan Pengajuan

Pertahankan card existing.

Gunakan sebagai context summary.

Field:

- Dokumen
- Dokumen wajib
- Sumber data
- Dokumen tambahan

Contoh:

```text
Dokumen
BC 2.0

Dokumen wajib
3 file

Sumber data
Spreadsheet Excel

Dokumen tambahan
Akan dilampirkan
```

Untuk jalur OCR:

```text
Sumber data
Ekstraksi Otomatis Invoice
```

Section ini read-only.

---

# 7. Sumber Data

Pertahankan section existing tetapi sesuaikan dengan branch.

## Jika EXCEL

Tampilkan:

- File spreadsheet
- Total Seri Barang
- Total Pos Tarif
- Total CIF

Contoh:

```text
File
data_barang_pt_abc.xlsx

Total Seri Barang
240

Total Pos Tarif
4

Total CIF
USD 42,500.00
```

## Jika INVOICE_OCR

Tampilkan:

- Invoice sumber
- Dokumen lain yang ikut diproses
- Status OCR
- Jumlah item terdeteksi

Contoh:

```text
Invoice
inv_10829.pdf

Status
OCR selesai

Barang terdeteksi
5

HS Code telah ditetapkan
3 dari 5
```

---

# 8. Hasil Ekstraksi OCR — HANYA JALUR INVOICE

Section ini menggantikan placeholder `Hasil Ekstraksi / Mapping` pada existing page.

Heading:

### `Preview Parsing OCR & Penetapan HS Code`

Helper copy:

`Ringkasan hasil AI dan sumber data`

`AI akan membaca file yang diunggah, lalu menyiapkan data untuk auto fill sebelum masuk ke form.`

Tampilkan badge:

`Jenis dokumen: BC 2.0`

---

# 9. Preview Mapping OCR

Tampilkan tabel:

| Seri | Uraian | HS Code | Quantity | Detail |
|---|---|---|---:|---|
| 1 | Barang contoh A | 8471.30.10 | 10 | Detail |
| 2 | Barang contoh B | 8471.30.90 | 4 | Detail |
| 3 | Barang contoh C | Belum Ditetapkan | 8 | Detail |
| 4 | Barang contoh D | Belum Ditetapkan | 12 | Detail |
| 5 | Barang contoh E | 7326.90.99 | 2 | Detail |

Untuk HS Code yang sudah ada:

CTA inline:
`Ubah HS Code`

Untuk HS Code kosong:

CTA inline:
`CARI SUGGESTION HS (BTKI)`

Pertahankan wording CTA tersebut.

---

# 10. Action Preview OCR

Gunakan actions:

- `Kembali ke Upload`
- `Lanjut ke Form`
- `Batal`

Behavior:

### Kembali ke Upload
Kembali ke state upload sumber OCR tanpa menghapus data sebelumnya.

### Lanjut ke Form
Boleh aktif ketika item yang membutuhkan HS Code sudah ditinjau atau berdasarkan mock scenario.

### Batal
Batalkan workflow / kembali sesuai flow existing.

---

# 11. Modal Penetapan Pos Tarif (HS Code)

Ketika user menekan:

- `Ubah HS Code`
- atau `CARI SUGGESTION HS (BTKI)`

buka modal besar:

### `PENETAPAN POS TARIF (HS CODE)`

Header context:

`Uraian Barang Dokumen: "Barang contoh C (Wireless Router Dual Band 5GHz)"`

Gunakan 3 tab:

1. `MASTER LIST PERUSAHAAN`
2. `RIWAYAT PIB`
3. `REKOMENDASI BTKI`

Tambahkan opsi manual di bawah tab.

---

# 12. Tab 1 — Master List Perusahaan

Heading:

### `MASTER LIST PERUSAHAAN (INTERNAL DATA)`

Contoh card selectable:

```text
Pos Tarif (HS)
8517.62.21

Uraian Master
Unit Router Transmisi Digital Dual Band 5G

Part Number
RT-5G-DUAL-01

Satuan Wajib
U (Unit)

Dokumen Izin
Perlu Sertifikasi SDPPI (Kode: 310)

Terakhir Update
15/01/2026
```

Gunakan radio selection karena user memilih satu HS Code final untuk item tersebut.

---

# 13. Tab 2 — Riwayat PIB

Heading:

### `RIWAYAT PIB TERDAHULU (HISTORICAL DATA)`

Tampilkan multiple selectable history cards.

Contoh:

```text
Pos Tarif
8517.62.21

No. Aju PIB
000020-001289-20251120-000109

Tanggal Aju
20/11/2025

Status
SPPB Jalur Hijau

Uraian PIB
Wireless Router Dual Band Indoor Unit

Satuan Wajib
U (Unit)
```

Contoh alternatif:

```text
Pos Tarif
8517.62.99
```

Tetap gunakan radio select.

---

# 14. Tab 3 — Rekomendasi BTKI

Heading:

### `REKOMENDASI BTKI LNSW (SISTEM TARIFF ENGINE)`

Tampilkan result card:

```text
Pos Tarif
8517.62.21

Akurasi Kemiripan
96%

Uraian BTKI
Perangkat transmisi digital untuk data, termasuk unit router & switch

Satuan Wajib
U (Unit) / NMB

Ketentuan Lartas
Wajib Sertifikasi SDPPI Kominfo (Kode: 310)

Tarif Masuk
Bea Masuk: 0%
PPN: 11%
PPh: 2.5%
```

Akurasi hanya display informasi dari source mock.

Jangan menambahkan risk score baru.

---

# 15. Opsi Manual HS Code

Di bawah ketiga sumber:

### `OPSI MANUAL: Masukkan Pos Tarif di Luar Ketiga Sumber`

Input:

```text
[ ____________ ]
```

Jika manual dipilih:

- deselect radio source lain,
- validasi format basic mock,
- user dapat menerapkan HS manual.

Modal footer:

- `Batal`
- `PILIH & TERAPKAN`

Pertahankan CTA.

---

# 16. Rincian Barang & Pos Tarif

Gabungkan existing section:

- `Rincian Barang`
- `Pos Tarif / HS Code`

menjadi satu section:

### `Tabel Rincian Item Barang & Pos Tarif`

Gunakan tabel sesuai struktur source SA.

Kolom:

- No
- Uraian Barang
- Pos Tarif (HS)
- Jml
- Sat
- Valuta
- Nilai CIF
- Status Izin
- Action

Contoh:

```text
001 | Bibit Mawar Merah | 0602.40.00 | 100 | BPT | USD | 1,200.00 | Wajib KT
002 | Bibit Mawar Putih | 0602.40.00 | 150 | BPT | USD | 1,800.00 | Wajib KT
101 | Router Gateway A1 | 8517.62.21 | 50 | C62 | USD | 5,000.00 | SDPPI
181 | Pupuk Organik Cair | 3105.90.00 | 500 | KGM | USD | 2,500.00 | Bebas Lartas
```

Action dapat berupa:

- `Detail`
- `Ubah HS Code`

Jangan buat HS Code sebagai section besar terpisah.

---

# 17. Table Pagination

Implement pagination mock untuk menunjukkan bahwa data bisa sangat banyak.

Contoh:

```text
Halaman 1 dari 24

[ < Sebelumnya ] [ 1 ] [ 2 ] [ 3 ] ... [ 24 ] [ Selanjutnya > ]
```

Footer table actions:

- `+ Tambah Seri Manual`
- `Unduh Data Tabel (.CSV)`

Pertahankan wording.

---

# 18. Detail Barang

Jika existing project sudah menggunakan drawer untuk `Kelola Detail`, reuse drawer tersebut.

Jangan buat nested modal jika tidak perlu.

Drawer dapat menampilkan:

- informasi barang,
- quantity,
- satuan,
- CIF,
- HS Code,
- status perizinan.

Untuk scope revisi ini, cukup reuse existing detail pattern.

---

# 19. Perizinan — Gabungkan Persyaratan + Dokumen Perizinan

Hapus separation antara:

- `Persyaratan Perizinan`
- `Dokumen Perizinan`

Ganti dengan satu section:

# `PENGELOLAAN & VALIDASI DOKUMEN PERIZINAN (LARTAS INSW)`

Helper:

`Sistem mengelompokkan seri barang berdasarkan Pos Tarif (HS Code) dan mencocokkannya ke database INSW.`

Gunakan grouped accordion/card berdasarkan HS Code.

---

# 20. Group Perizinan per HS Code

Contoh collapsed summary:

```text
0602.40.00
Tanaman Hidup Mawar

Seri 001 s.d. Seri 100
100 Seri

Status:
✓ Terpenuhi
```

atau:

```text
8517.62.21
Perangkat Transmisi / Router

Seri 101 s.d. Seri 180
80 Seri

Status:
⚠ Belum Terpenuhi
```

Tambahkan:

`Lihat Rincian Seri`

Group dapat expand/collapse.

Default:
- first problematic group expanded,
- valid groups boleh collapsed.

---

# 21. Group dengan Izin Ditemukan

Contoh:

### `KELOMPOK 1`

Pos Tarif:

`0602.40.00 - Tanaman Hidup Mawar`

Cakupan:

`Seri 001 s.d. Seri 100 (Total: 100 Seri)`

Ketentuan:

```text
Ketentuan Regulasi
Karantina Tumbuhan (PP 14/2002)

Kode Dokumen
940 (KT-2 / KT-9 / SP-5 / KT-13)
```

Subheading:

### `Hasil Validasi Sistem INSW`

Permit result:

```text
No
0192/KT9/2026

Tipe
KT-9 (Pelepasan Karantina)

Masa Berlaku
s.d. 30/11/2026

Status
Aktif

Status Kuota
Sisa: 15.000 BPT
Kebutuhan: 8.500

Status Validasi
COCOK & VALID

Cakupan
Seri 001 - 100
```

Gunakan status visual positif tetapi tidak berlebihan.

---

# 22. Group tanpa Izin Existing

Contoh:

### `KELOMPOK 2`

Pos Tarif:

`8517.62.21 - Perangkat Transmisi / Router`

Cakupan:

`Seri 101 s.d. Seri 180 (Total: 80 Seri)`

Ketentuan:

```text
Ketentuan Regulasi
Sertifikasi Alat Telekomunikasi (Kominfo)

Kode Dokumen
310 (SDPPI)
```

Tampilkan warning:

`Tidak ditemukan Sertifikat Standar / Izin SDPPI untuk Pos Tarif ini pada profil entitas INSW Anda.`

Status:

`TIDAK COCOK / BELUM TERSEDIA`

---

# 23. Upload Berkas Perizinan Manual

Pada group yang izin existing-nya tidak ditemukan, tampilkan:

### `Unggah Berkas Perizinan Manual (Opsional)`

Field:

- Nomor Izin
- Tgl Terbit
- File Bukti

Contoh:

```text
Nomor Izin
[ Masukkan Nomor Sertifikat SDPPI ]

Tgl Terbit
[ DD/MM/YYYY ]

File Bukti
[ Browse File... ]
```

Helper:

`PDF, Maks 5MB`

CTA:

`Simpan Berkas`

Jangan menampilkan form manual di group yang sudah terpenuhi kecuali ada action `Ganti / Tambah Dokumen` bila diperlukan untuk mock.

---

# 24. Mapping Preview Perizinan

Setelah semua group perizinan, tampilkan summary:

### `RINGKASAN PEMETAAN PERIZINAN KE SERI BARANG (MAPPING PREVIEW)`

Kolom:

- Pos Tarif
- Cakupan Seri Barang
- Satuan Wajib (BTKI)
- Dokumen Izin Terkait
- Status Pemenuhan
- Risiko Pabean

Contoh data:

```text
0602.40.00
Seri 001 s.d. 100
BPT (Batang/Plants)
KT-9 (0192/KT9/2026)
Terpenuhi
Jalur Hijau
```

```text
8517.62.21
Seri 101 s.d. 180
U (Unit) / NMB
Belum Terlampir
Belum Terpenuhi
Jalur Merah
```

```text
3105.90.00
Seri 181 s.d. 220
KGM (Kilogram)
- (Bebas Lartas)
Bebas Regulasi
Normal
```

PENTING:

Gunakan wording `Risiko Pabean` sesuai source SA.

Jangan menambahkan:
- risk score,
- probabilitas,
- AI risk score,
- auto decision.

---

# 25. Dokumen Fasilitas / Tambahan

Existing section sudah mendekati source SA.

Ubah menjadi repeatable table / row list.

Heading:

### `DOKUMEN FASILITAS / DOKUMEN PENDUKUNG LAINNYA`

Kolom:

- No
- Jenis Dokumen
- Nomor Dokumen
- Tanggal
- Berkas Lampiran
- Action

Contoh:

```text
01
020 - SKA / COO
E260192830192
10/03/2026
coo_china.pdf
✓
```

Empty row:

```text
02
Pilih Jenis Dokumen...
[ nomor ]
[ tanggal ]
[ Browse File... ]
```

CTA:

`+ Tambah Dokumen Pendukung`

---

# 26. Conditional Supporting Document Section

Gunakan state dari Assistant:

```ts
hasAdditionalDocuments
```

Jika `true`:

- section tampil expanded,
- sediakan minimal satu row input kosong.

Jika `false`:

pilihan implementasi:
- section tidak tampil di TOC dan body,
- atau collapsed optional section.

Untuk mockup, prefer:

### Jika false
Tetap tampil sebagai collapsed optional section dengan CTA:

`+ Tambah Dokumen Pendukung`

Alasan:
user masih dapat berubah pikiran saat mengisi Formulir Ekstraksi.

Namun jangan otomatis menampilkan input row jika sebelumnya memilih `Tidak`.

---

# 27. Validasi / Catatan

Existing `Validasi / Catatan` bukan bagian utama yang diberikan SA.

Jangan jadikan core section besar di TOC.

Jika ingin dipertahankan:

ubah menjadi secondary block kecil di akhir:

### `Catatan Pengguna`

Textarea:

`Tambahkan catatan...`

Tidak perlu badge `Draft workspace` per section.

---

# 28. Remove Repetitive “Draft workspace” Badges

Pada screenshot existing, hampir setiap card memiliki badge:

`Draft workspace`

Ini terlalu repetitif dan menambah noise.

Gunakan status global di page header saja, misalnya:

`Draf`

atau:

`Status: Berkas Terverifikasi`

sesuai mock scenario.

Jangan ulang badge yang sama di setiap section.

---

# 29. Page Header

Pertahankan existing page hero.

Heading:

### `Formulir Ekstraksi & Rincian`

Subtitle dapat tetap:

`Workspace untuk meninjau sumber data, hasil ekstraksi, rincian barang, Pos Tarif, dan dokumen pendukung sebelum diteruskan ke Formulir Utama Pabean.`

Badge kanan:

- `BC 2.0`
- `Spreadsheet Excel`

atau:

- `BC 2.0`
- `Ekstraksi Invoice`

Tambahkan global status kecil:

`Draf`

atau:

`Berkas Terverifikasi`

---

# 30. Status Summary di Atas Form

Berdasarkan source SA, Formulir Rincian dapat menampilkan:

```text
Status: Berkas Terverifikasi
Sumber: data_barang_pt_abc.xlsx
240 Seri Barang
4 Pos Tarif
```

Implementasikan sebagai compact metadata row di bawah page header atau di atas section pertama.

Jangan membuat card besar baru.

---

# 31. Sticky TOC

Pertahankan left TOC existing.

Behavior:

- sticky pada desktop,
- klik item scroll ke section,
- active item mengikuti scroll,
- hidden/compact di mobile jika diperlukan.

Dynamic TOC berdasarkan branch.

---

# 32. Footer Actions

Gunakan sticky bottom action area jika existing memungkinkan.

CTA:

- `Simpan Draf`
- `LANJUT KE FORMULIR UTAMA BC 2.0 >`

Pertahankan wording CTA dari source SA.

Jika document type dynamic:

```ts
`LANJUT KE FORMULIR UTAMA ${documentLabel} >`
```

Contoh:

`LANJUT KE FORMULIR UTAMA BC 2.0 >`

---

# 33. Behavior “Lanjut ke Formulir Utama”

Untuk mockup:

1. Validate state minimal.
2. Jika ada item HS Code yang belum ditetapkan:
   tampil warning.
3. Jika ada permit yang belum terpenuhi:
   tampil warning.
4. User tetap dapat melihat status yang belum lengkap.
5. Jangan implement hard business validation yang belum diberikan SA.

Jika perlu confirmation:

```text
Masih terdapat data yang perlu ditinjau.

2 item belum memiliki Pos Tarif.
1 kelompok perizinan belum terpenuhi.

Tetap lanjut?
```

Ini helper UX, bukan business rule resmi.

---

# 34. Excel vs OCR — Shared Destination

Kedua branch akhirnya bertemu di:

- Rincian Barang & Pos Tarif
- Perizinan
- Dokumen Fasilitas / Tambahan

Perbedaannya hanya initial source.

## EXCEL

```text
Assistant
↓
Spreadsheet
↓
Ringkasan Validasi
↓
Formulir Ekstraksi & Rincian
↓
Rincian Barang
↓
Perizinan
↓
Dokumen Tambahan
```

## INVOICE_OCR

```text
Assistant
↓
Formulir Ekstraksi
↓
Preview OCR
↓
Penetapan HS
↓
Rincian Barang
↓
Perizinan
↓
Dokumen Tambahan
```

Jangan membuat dua page form terpisah.

Gunakan satu page dengan state/section conditional.

---

# 35. Suggested Component Structure

Contoh:

```text
ExtractionFormPage
├── ExtractionHeader
├── ExtractionMeta
├── ExtractionToc
│
├── SubmissionSummarySection
├── SourceDataSection
│
├── OcrPreviewSection              // only INVOICE_OCR
│   └── HsCodeAssignmentModal
│
├── GoodsAndTariffSection
│   ├── GoodsTable
│   ├── Pagination
│   └── GoodsDetailDrawer
│
├── PermitManagementSection
│   ├── PermitHsGroupAccordion
│   ├── ManualPermitUpload
│   └── PermitMappingSummary
│
├── SupportingDocumentsSection
│   └── SupportingDocumentRow[]
│
├── UserNotes                      // optional secondary
│
└── ExtractionFooterActions
```

---

# 36. Mock Data

Gunakan contoh data dari source SA untuk membuat hasil terasa nyata.

## Goods

```ts
[
  {
    no: "001",
    description: "Bibit Mawar Merah",
    hsCode: "0602.40.00",
    quantity: 100,
    unit: "BPT",
    currency: "USD",
    cif: 1200,
    permitStatus: "Wajib KT"
  },
  {
    no: "002",
    description: "Bibit Mawar Putih",
    hsCode: "0602.40.00",
    quantity: 150,
    unit: "BPT",
    currency: "USD",
    cif: 1800,
    permitStatus: "Wajib KT"
  },
  {
    no: "101",
    description: "Router Gateway A1",
    hsCode: "8517.62.21",
    quantity: 50,
    unit: "C62",
    currency: "USD",
    cif: 5000,
    permitStatus: "SDPPI"
  },
  {
    no: "181",
    description: "Pupuk Organik Cair",
    hsCode: "3105.90.00",
    quantity: 500,
    unit: "KGM",
    currency: "USD",
    cif: 2500,
    permitStatus: "Bebas Lartas"
  },
  {
    no: "240",
    description: "Media Tanam Gambut",
    hsCode: "2703.00.00",
    quantity: 300,
    unit: "KGM",
    currency: "USD",
    cif: 1100,
    permitStatus: "Bebas Lartas"
  }
]
```

---

# 37. Permit Mock Data

```ts
[
  {
    hsCode: "0602.40.00",
    title: "Tanaman Hidup Mawar",
    seriesRange: "Seri 001 s.d. Seri 100",
    totalSeries: 100,
    regulation: "Karantina Tumbuhan (PP 14/2002)",
    documentCode: "940",
    documentTypes: "KT-2 / KT-9 / SP-5 / KT-13",
    status: "VALID",
    existingPermit: {
      number: "0192/KT9/2026",
      type: "KT-9 (Pelepasan Karantina)",
      validUntil: "30/11/2026",
      quotaRemaining: "15.000 BPT",
      quotaRequired: "8.500 BPT"
    }
  },
  {
    hsCode: "8517.62.21",
    title: "Perangkat Transmisi / Router",
    seriesRange: "Seri 101 s.d. Seri 180",
    totalSeries: 80,
    regulation: "Sertifikasi Alat Telekomunikasi (Kominfo)",
    documentCode: "310",
    documentTypes: "SDPPI",
    status: "MISSING"
  }
]
```

---

# 38. Visual Direction

Tetap gunakan visual language existing:

- navy / blue government theme,
- white cards,
- rounded corner,
- subtle borders,
- compact badges,
- table yang bersih,
- clear hierarchy.

Untuk status:

- valid → check icon / subtle success
- warning → warning icon / subtle amber
- missing → attention state

Jangan membuat terlalu banyak full-color card.

---

# 39. Density

Page ini berpotensi menangani:

- 240 seri,
- banyak HS Code,
- banyak perizinan,
- banyak dokumen.

Karena itu:

- gunakan compact table,
- accordion,
- pagination,
- sticky TOC,
- internal scroll hanya jika benar-benar dibutuhkan.

Jangan render puluhan permit card full-expanded.

---

# 40. Do Not Invent Missing Business Rules

Implementasi harus mengikuti informasi source yang tersedia.

Jangan menambahkan sendiri:

- mandatory validation baru,
- formula perhitungan bea/pajak,
- automatic approval/rejection,
- AI risk score,
- regulasi baru,
- jenis dokumen baru yang tidak ada di source.

Jika membutuhkan data tambahan untuk visual mockup:

gunakan label generic atau mock data yang jelas sebagai placeholder.

---

# 41. Acceptance Criteria

Revisi dianggap selesai jika:

1. Existing page shell tetap dipertahankan.
2. TOC diringkas dan menjadi dynamic berdasarkan branch.
3. Jalur Excel dan OCR menggunakan page yang sama.
4. Jalur OCR memiliki `Preview Parsing OCR & Penetapan HS Code`.
5. Tabel OCR memiliki CTA `Ubah HS Code` dan `CARI SUGGESTION HS (BTKI)`.
6. Modal Penetapan Pos Tarif memiliki 3 sumber:
   - Master List Perusahaan
   - Riwayat PIB
   - Rekomendasi BTKI
7. Modal memiliki opsi input HS manual.
8. Rincian Barang dan Pos Tarif digabung dalam satu section.
9. Goods table mengikuti struktur source SA.
10. Table memiliki pagination.
11. Tersedia `+ Tambah Seri Manual`.
12. Tersedia `Unduh Data Tabel (.CSV)`.
13. Persyaratan dan Dokumen Perizinan digabung menjadi satu Permit Management section.
14. Permit Management dikelompokkan berdasarkan HS Code.
15. Group permit dapat expand/collapse.
16. Group valid menampilkan existing permit data.
17. Group missing menyediakan upload izin manual.
18. Ada `RINGKASAN PEMETAAN PERIZINAN KE SERI BARANG`.
19. Tidak ada AI risk score tambahan.
20. Dokumen Fasilitas / Tambahan menjadi repeatable rows.
21. Ada `+ Tambah Dokumen Pendukung`.
22. Supporting document section menggunakan state dari Assistant.
23. Badge `Draft workspace` yang repetitif dihapus.
24. `Validasi / Catatan` tidak lagi menjadi section utama TOC.
25. Footer CTA menggunakan:
    `Simpan Draf`
    `LANJUT KE FORMULIR UTAMA BC 2.0 >`
26. Halaman tetap terasa sebagai workspace/form, bukan chat.
27. Tidak ada business logic yang diinvent sendiri di luar source.

---

# 42. Final Instruction to Agent

Implementasikan revisi ini sebagai enhancement terhadap halaman existing.

Jangan melakukan redesign total.

Prioritas:

1. Correct information architecture
2. Complete Formulir Ekstraksi structure
3. Reuse existing components
4. Conditional Excel vs OCR behavior
5. HS Code assignment interaction
6. Grouped permit management
7. Supporting document management
8. Preserve official wording

Tujuan akhirnya adalah agar user dapat benar-benar merasakan flow lengkap:

```text
Smart Submission Assistant
↓
Formulir Ekstraksi & Rincian
↓
Review / Penetapan HS
↓
Rincian Barang
↓
Perizinan
↓
Dokumen Pendukung
↓
LANJUT KE FORMULIR UTAMA BC 2.0
```
