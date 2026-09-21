# Formulir Ekstraksi & Rincian — V3 Flowchart Patch

## 1. Tujuan

Dokumen ini adalah **patch/delta** terhadap:

`04-formulir-ekstraksi-rincian-v3-revision.md`

Jangan mengulang implementasi dari nol.

Agent harus:
- mempertahankan seluruh hasil implementasi berdasarkan dokumen `04`,
- menerapkan perubahan hanya pada area yang dijelaskan di patch ini,
- memastikan flow halaman mengikuti flowchart v3 terbaru dari SA.

Patch ini dibuat karena flowchart terbaru menegaskan beberapa detail yang sebelumnya belum eksplisit.

---

## 2. Scope Perubahan

Hanya ada 4 perubahan utama:

1. Jalur OCR/Invoice wajib memastikan **100% HS Code terisi** sebelum user dapat lanjut ke Formulir Rincian Barang & Perizinan.
2. Tambahkan **Screen 13 — Modal Rincian Daftar Lengkap Seri Barang**.
3. Ubah wording section summary compliance menjadi:
   `MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN`
4. Perjelas ending flow menjadi:
   `Draf Rincian & Perizinan Disimpan`

Jangan mengubah area lain yang sudah berjalan jika tidak terkait empat poin di atas.

---

## 3. PATCH 01 — Mandatory HS Completion untuk Jalur Invoice

### Kondisi Existing

Pada implementasi sebelumnya, CTA:

`Lanjut ke Form`

masih dapat aktif berdasarkan mock scenario atau setelah item ditinjau.

### Revisi

Untuk branch:

```ts
extractionMode === "INVOICE_OCR"
```

CTA:

`Lanjut ke Form`

**hanya boleh aktif jika seluruh item hasil OCR sudah memiliki HS Code dan sudah dikonfirmasi user.**

Gunakan state seperti:

```ts
const allHsCodesAssigned = extractedItems.every(
  (item) => item.hsCode && item.hsConfirmed
);
```

CTA:

```tsx
disabled={!allHsCodesAssigned}
```

---

## 4. Visual Progress HS Code

Pada Screen 10 / Preview OCR, tampilkan progress HS Code agar user memahami alasan CTA belum aktif.

Contoh:

```text
Penetapan Pos Tarif
3 dari 5 barang sudah memiliki HS Code
```

atau:

```text
HS Code
3 / 5 Terisi
```

Jika belum lengkap:

```text
2 barang masih memerlukan penetapan HS Code.
```

Gunakan neutral/helper warning.

Jangan gunakan error besar karena user belum melakukan kesalahan; workflow memang belum selesai.

---

## 5. Behavior Loop Screen 10 ↔ Screen 11

Flow wajib:

```text
Screen 10
Preview Parsing OCR
↓
User klik:
- Ubah HS Code
atau
- CARI SUGGESTION HS (BTKI)
↓
Screen 11
Modal Penetapan Pos Tarif
↓
User pilih HS
↓
PILIH & TERAPKAN
↓
Kembali ke Screen 10
↓
Update row
↓
Cek semua HS sudah terisi?
```

Jika:

```text
Belum
```

user tetap berada di Screen 10 dan melanjutkan penetapan HS lainnya.

Jika:

```text
Ya — 100% Terisi
```

CTA:

`Lanjut ke Form`

menjadi aktif.

---

## 6. Jangan Auto Assign HS Code

Rekomendasi dari:

- Master List Perusahaan
- Riwayat PIB
- BTKI LNSW

hanya menjadi sumber pilihan.

Jangan otomatis menerapkan rekomendasi tanpa aksi user.

HS Code dianggap terisi setelah user melakukan:

`PILIH & TERAPKAN`

atau menetapkan manual.

---

## 7. State HS Assignment

Gunakan state eksplisit per item.

```ts
type ExtractedItem = {
  id: string;
  series: number;
  description: string;
  quantity: number;

  hsCode: string | null;

  hsSource:
    | "MASTER_LIST"
    | "PIB_HISTORY"
    | "BTKI"
    | "MANUAL"
    | null;

  hsConfirmed: boolean;
};
```

`allHsCodesAssigned` sebaiknya berdasarkan:

```ts
item.hsCode && item.hsConfirmed
```

bukan hanya karena sistem memiliki suggestion.

---

## 8. PATCH 02 — Screen 13 Modal Rincian Daftar Lengkap Seri Barang

Flowchart terbaru secara eksplisit memiliki:

### `Screen 13: Modal Rincian Daftar Lengkap Seri Barang`

Modal ini dibuka dari group perizinan / kelompok HS Code.

Contoh entry point:

```text
POS TARIF: 0602.40.00
Tanaman Hidup Mawar

Mencakup:
Seri 001 s.d. Seri 100
Total: 100 Seri

[ Lihat Rincian Seri ]
```

Klik:

`Lihat Rincian Seri`

→ buka Screen 13.

---

## 9. Screen 13 — Modal Structure

Gunakan large modal.

Heading:

### `Rincian Daftar Seri Barang`

Context header:

```text
Pos Tarif
0602.40.00

Tanaman Hidup Mawar

Total
100 Seri
```

Tampilkan tabel compact.

Kolom:
- Seri
- Uraian Barang
- Pos Tarif (HS)
- Jumlah
- Satuan
- Valuta
- Nilai CIF
- Status Izin

Contoh:

```text
001
Bibit Mawar Merah
0602.40.00
100
BPT
USD
1,200.00
Wajib KT
```

---

## 10. Modal Rincian Seri — Pagination / Search

Karena satu HS Code dapat mencakup banyak seri, tambahkan:

- Search
- Pagination

Contoh search placeholder:

`Cari nomor seri atau uraian barang...`

Pagination mengikuti table utama.

Jangan render seluruh 100+ row sekaligus tanpa pagination.

Footer:

`Tutup`

Tidak perlu action edit dari modal ini kecuali existing implementation sudah punya pattern tersebut.

Modal ini berfungsi sebagai detail/reference view.

---

## 11. Reuse Data

Screen 13 tidak boleh membuat dataset baru.

Filter dari master goods data:

```ts
const groupedSeries = goods.filter(
  (item) => item.hsCode === selectedHsCode
);
```

Dengan demikian:
- table utama,
- permit grouping,
- modal rincian seri

selalu menggunakan data yang sama.

---

## 12. PATCH 03 — Rename Compliance Summary

Pada dokumen `04`, summary setelah group perizinan diberi nama:

`RINGKASAN PEMETAAN PERIZINAN KE SERI BARANG (MAPPING PREVIEW)`

Flowchart v3 memperjelas bagian ini sebagai:

### `MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN`

Gunakan wording terbaru tersebut sebagai heading utama.

Jika ingin mempertahankan wording lama, jadikan subtitle/helper, bukan heading utama.

Contoh:

```text
MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN

Ringkasan pemetaan perizinan ke seri barang berdasarkan Pos Tarif.
```

---

## 13. Matriks Kepatuhan & Prediksi Jalur Pabean

Pertahankan kolom yang sudah digunakan:

- Pos Tarif
- Cakupan Seri Barang
- Satuan Wajib (BTKI)
- Dokumen Izin Terkait
- Status Pemenuhan
- Risiko Pabean

Contoh:

```text
0602.40.00
Seri 001 s.d. 100
BPT
KT-9 (0192/KT9/2026)
Terpenuhi
Jalur Hijau
```

```text
8517.62.21
Seri 101 s.d. 180
U / NMB
Belum Terlampir
Belum Terpenuhi
Jalur Merah
```

---

## 14. Jangan Tambahkan Risk Scoring

Walaupun heading menggunakan:

`Prediksi Jalur Pabean`

jangan menambahkan:

- percentage,
- probability,
- risk score,
- skor AI,
- confidence jalur,
- automatic decision.

Hanya gunakan data/label yang sudah ada di source mock.

Contoh:
- Jalur Hijau
- Jalur Merah
- Normal

tanpa interpretasi tambahan.

---

## 15. Relationship dengan Permit Group

Matriks bukan pengganti Permit Group.

Gunakan hierarchy:

```text
Pengelolaan & Validasi Dokumen Perizinan
↓
Group HS Code / Permit
↓
Detail Existing Permit / Upload Manual
↓
MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN
```

Permit Group = detail operasional.

Matriks = summary lintas HS Code.

---

## 16. PATCH 04 — Ending Flow

Flowchart terbaru memperjelas ending:

### `Selesai: Draf Rincian & Perizinan Disimpan`

Saat user menekan:

`Simpan & Lanjut ke Form Utama`

atau CTA existing:

`LANJUT KE FORMULIR UTAMA BC 2.0 >`

sistem harus mensimulasikan bahwa:

1. data rincian barang tersimpan,
2. mapping HS tersimpan,
3. data perizinan tersimpan,
4. dokumen fasilitas/tambahan tersimpan,
5. draft Formulir Rincian & Perizinan berhasil dibuat.

---

## 17. Save State Before Navigation

Sebelum navigation ke Formulir Utama:

```ts
saveExtractionDraft();
```

Mock state:

```ts
const extractionDraft = {
  status: "SAVED",

  documentType: "BC20",

  goods: [...],

  hsAssignments: [...],

  permitGroups: [...],

  supportingDocuments: [...],

  savedAt: new Date()
};
```

Tidak perlu backend real.

Local/mock state cukup.

---

## 18. Success Transition

Setelah save, boleh tampilkan temporary success state:

```text
Draf Rincian & Perizinan berhasil disimpan.

Data akan diteruskan ke Formulir Utama BC 2.0.
```

Kemudian CTA/navigation:

`Lanjut ke Formulir Utama BC 2.0`

Jangan membuat step baru yang panjang hanya untuk success screen.

---

## 19. Update CTA Logic

### Jalur OCR

Sebelum masuk Form Rincian:

`Lanjut ke Form`

aktif hanya jika:

```ts
allHsCodesAssigned === true
```

### Form Rincian

CTA final tetap:

- `Simpan Draf`
- `LANJUT KE FORMULIR UTAMA BC 2.0 >`

atau bila existing implementation menggunakan satu wording gabungan:

`Simpan & Lanjut ke Form Utama`

jaga agar behavior final tetap melakukan save draft terlebih dahulu.

---

## 20. Updated End-to-End Flow

Implementasi akhir harus mengikuti:

```text
SMART SUBMISSION ASSISTANT
↓
Pilih Dokumen
↓
Penjelasan Dokumen
↓
Upload Dokumen Wajib
↓
Pilih Metode Input Barang

==============================

JALUR EXCEL

Upload Excel
↓
Ringkasan Validasi
↓
Daftar Persyaratan Perizinan
↓
Dokumen Tambahan?
↓
Konfirmasi
↓
Formulir Rincian Barang & Perizinan

==============================

JALUR INVOICE

Informasi Ekstraksi Invoice
↓
Dokumen Tambahan?
↓
Konfirmasi
↓
Preview Parsing OCR
↓
Tetapkan HS Code
↓
Semua HS Code Sudah Terisi?

├── BELUM
│   ↓
│   Kembali ke Preview OCR
│   ↓
│   Tetapkan HS berikutnya
│
└── YA / 100%
    ↓
    Lanjut ke Form

==============================

FORMULIR RINCIAN BARANG & PERIZINAN

Bagian 1
Tabel Seri Barang & Pos Tarif
↓
Bagian 2
Pengelompokan HS + Validasi Izin
↓
Screen 13
Modal Rincian Daftar Lengkap Seri Barang
↓
MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN
↓
Bagian 3
Dokumen Fasilitas / Tambahan
↓
Simpan & Lanjut ke Form Utama
↓
Draf Rincian & Perizinan Disimpan
```

---

## 21. Update Acceptance Criteria

Tambahkan acceptance criteria berikut ke dokumen `04`.

### OCR / HS Code

1. `Lanjut ke Form` disabled jika masih ada HS Code kosong/unconfirmed.
2. Progress jumlah HS Code terisi terlihat pada Preview OCR.
3. Setiap hasil HS baru dianggap final setelah user memilih `PILIH & TERAPKAN`.
4. User kembali ke Preview OCR setelah modal HS ditutup/applied.
5. Flow terus berulang sampai 100% HS Code terisi.
6. Tidak ada auto-assignment HS dari suggestion.

### Screen 13

7. `Lihat Rincian Seri` membuka modal detail daftar seri.
8. Modal menggunakan goods dataset yang sama dengan main table.
9. Data difilter berdasarkan selected HS Code.
10. Modal memiliki search.
11. Modal memiliki pagination.
12. Modal tidak menduplikasi/edit dataset terpisah.

### Compliance Matrix

13. Heading menggunakan:
    `MATRIKS KEPATUHAN & PREDIKSI JALUR PABEAN`
14. Tidak ada AI risk score/probability tambahan.
15. Matriks tampil setelah detail Permit Group.

### Ending

16. Final CTA menyimpan draft Formulir Rincian & Perizinan.
17. Status draft berubah menjadi `SAVED`.
18. User baru diarahkan ke Formulir Utama setelah save sukses.
19. Success state menjelaskan bahwa `Draf Rincian & Perizinan` telah disimpan.

---

## 22. Final Instruction to Agent

Dokumen ini adalah patch.

Jangan revert atau membangun ulang hasil implementasi berdasarkan dokumen:

`04-formulir-ekstraksi-rincian-v3-revision.md`

Apply hanya perubahan berikut:

```text
1. Mandatory 100% HS completion pada jalur OCR
2. Loop Screen 10 ↔ Screen 11
3. Screen 13 Modal Rincian Seri
4. Rename compliance summary menjadi Matriks Kepatuhan & Prediksi Jalur Pabean
5. Explicit save state: Draf Rincian & Perizinan Disimpan
```

Setelah patch, flow harus tetap menggunakan desain dan component structure existing.
