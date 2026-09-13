# Smart Submission Assistant — Revision Instruction

## 1. Objective
Revisi Smart Submission Assistant existing agar mengikuti flow bisnis baru.

Dokumen context utama:
`01-smart-submission-flow-context.md`

Baca dokumen tersebut terlebih dahulu sebelum melakukan perubahan UI.

---

# 2. Kondisi Existing

Saat ini Smart Submission Assistant memiliki flow utama:

```text
Identifikasi
↓
Upload Data Barang
↓
Data Parsing
↓
Form Pengajuan
```

Pada step Upload Data Barang:
- upload Excel,
- upload dokumen OCR,
masih berada pada layar yang sama.

Pada Data Parsing:
- hasil OCR,
- mapping,
masih digabung menjadi satu flow.

Flow ini harus direvisi.

---

# 3. Target Flow Baru

Target interaction:

```text
Identifikasi berdasarkan scope SSO
↓
Upload Excel
├─ Upload Excel
│  ↓
│  Parse Excel
│  ↓
│  Preview Mapping
│  ↓
│  HS Code Validation
│
└─ Lewati Excel
   ↓
   Upload Dokumen
   ↓
   OCR
   ↓
   Identifikasi Barang
   ↓
   Rekomendasi HS Code
   ↓
   User memilih HS Code

↓
Identifikasi Perizinan
↓
Pilih izin existing / Input Manual / Lewati
↓
Upload Dokumen Lampiran
↓
OCR + Parsing
↓
Review Hasil Mapping
↓
Lanjut ke Form Pengajuan
```

---

# 4. Jangan Over-Redesign Stepper

Jangan langsung membuat stepper dengan 8–10 langkah.

Gunakan macro step yang ringkas.

Implementasikan sementara:

```text
1. Identifikasi
2. Data Barang
3. Perizinan
4. Dokumen Lampiran
5. Review Data
```

Stepper harus bersifat state-driven.

Jika suatu bagian dilewati:
- step boleh tetap tercatat sebagai skipped/completed,
- flow tidak boleh terasa error.

---

# 5. Step 1 — Identifikasi

## Perubahan
Jangan lagi mulai dari pilihan yang terlalu umum jika informasi tersebut sudah diketahui dari SSO/token.

Contoh existing:
```text
Barang Masuk Indonesia
Barang Keluar Indonesia
KEK
Saya Tidak Yakin
```

Revisi:
- buat mock `userScope` dari token Backend,
- hanya tampilkan opsi yang relevan.

Contoh:
```js
userScope = {
  allowedFlow: "EXPORT",
  allowedDocuments: ["BC23", "BC27"]
}
```

Jika user hanya memiliki akses EXPORT:
- jangan tampilkan opsi Barang Masuk,
- langsung arahkan ke pertanyaan identifikasi ekspor.

Pertahankan visual conversational assistant existing.

---

# 6. Hasil Identifikasi

Setelah pertanyaan identifikasi selesai, tampilkan card hasil:

- Jenis pengajuan teridentifikasi
- Ringkasan jawaban
- Dokumen yang mungkin diperlukan

CTA:
- **Lanjut ke Data Barang**
- **Ubah Jawaban**

Hapus flow lama yang langsung menggabungkan Excel dan OCR pada layar upload yang sama.

---

# 7. Step 2 — Data Barang

Step ini memiliki dua jalur.

## 7.1 Default View
Tampilkan card:

### Upload Excel Data Barang

Deskripsi:
> Gunakan template Excel data barang untuk mempercepat pengisian dan pemetaan data.

Actions:
- Pilih File
- Upload
- Download Template
- **Lewati Upload Excel**

Jangan tampilkan upload OCR pada layar awal ini.

---

# 8. Branch A — Upload Excel

## 8.1 Setelah Upload
Tampilkan loading state:
- Membaca file
- Validasi struktur
- Parsing data
- Mapping field

Setelah selesai, tampilkan:

### Hasil Analisis Data Barang

Summary:
- jumlah barang
- jumlah field terbaca
- warning mapping jika ada

CTA:
- Lihat Mapping
- Parse Ulang bila diperlukan

## 8.2 Preview Mapping
Gunakan tabel preview seperti existing, tetapi label sumber jangan lagi "Sumber OCR" jika berasal dari Excel.

Kolom contoh:
- Seri
- Uraian Barang
- HS Code
- Qty
- Satuan
- Sumber Data
- Status Mapping
- Detail

Sumber Data:
`Excel`

Status:
- Sesuai
- Perlu Dicek
- HS Code Belum Valid

---

# 9. Validasi HS Code Setelah Excel

Setelah mapping Excel, tampilkan section:

### Validasi HS Code

Untuk setiap barang:
- Seri
- Barang
- HS Code
- Status
- indikasi kebutuhan izin

Contoh:
```text
Seri 1
Laptop
8471.30.10
Perizinan terdeteksi
```

CTA:
**Lanjut Identifikasi Perizinan**

---

# 10. Branch B — Lewati Upload Excel

Jika user menekan:
**Lewati Upload Excel**

Jangan langsung ke Form.

Arahkan ke:

### Upload Dokumen untuk Identifikasi Barang

Tampilkan dokumen yang relevan hasil identifikasi.

Kelompokkan:
- Wajib
- Pendukung

Contoh:
- Invoice
- Packing List
- Bill of Lading

Support:
- PDF
- JPG/PNG jika dibutuhkan

---

# 11. OCR Flow Tanpa Excel

Setelah dokumen di-upload:

Tampilkan loading/progress:
1. Membaca dokumen
2. OCR
3. Mengidentifikasi barang
4. Mengelompokkan barang
5. Mencari kandidat HS Code

Setelah selesai:

### Barang Terdeteksi

Untuk setiap barang tampilkan:
- Nama / uraian hasil OCR
- Qty jika ada
- sumber dokumen
- rekomendasi HS Code

Contoh:

```text
Laptop Computer
Sumber: Invoice.pdf

Rekomendasi HS Code:
○ 8471.30.10
○ 8471.30.90
○ Pilih HS Code lain
```

User wajib dapat:
- memilih salah satu rekomendasi,
- mencari HS Code lain,
- input manual.

Tambahkan badge:
`Rekomendasi AI`

Jangan menyebut hasil HS sebagai keputusan final AI.

---

# 12. Step 3 — Perizinan

Setelah HS Code tersedia dari Excel maupun OCR, kedua branch masuk ke step yang sama.

Tampilkan:

### Identifikasi Perizinan

Sistem mengecek:
- HS Code,
- kebutuhan izin,
- data perizinan user di INSW.

Loading state:
- Memeriksa HS Code
- Mengidentifikasi regulasi
- Mencocokkan perizinan user

---

# 13. Hasil Perizinan

Jika izin ditemukan:

```text
HS 8471.30.10
Laptop

2 perizinan ditemukan
```

Tampilkan pilihan izin existing.

Card izin:
- Nama izin
- Nomor
- Status
- Masa berlaku
- Instansi
- HS Code terkait

Actions:
- **Gunakan Perizinan**
- **Input Manual**
- **Lewati**

Jika beberapa HS Code:
group per HS Code.

---

# 14. Input Manual Perizinan

Jika user memilih Input Manual:
tampilkan form inline / drawer ringan.

Field mock:
- Jenis Perizinan
- Nomor
- Tanggal
- Instansi Penerbit
- Masa Berlaku
- HS Code terkait

CTA:
- Simpan
- Batal

Jangan gunakan modal bertingkat jika tidak diperlukan.

---

# 15. Jika Tidak Ada Izin Ditemukan

Tampilkan neutral state:

```text
Belum ditemukan perizinan terdaftar yang sesuai dengan HS Code ini.
```

Actions:
- Input Manual
- Lewati

Jika izin terindikasi wajib:
tampilkan warning informatif, bukan hard reject pada mockup.

---

# 16. Step 4 — Dokumen Lampiran

Setelah perizinan selesai, assistant menanyakan:

> Apakah Anda ingin mengunggah dokumen lampiran wajib maupun pendukung?

Actions:
- **Upload Dokumen**
- **Lewati**

Jika Upload Dokumen:
tampilkan daftar form upload.

Kelompok:
### Dokumen Wajib
### Dokumen Pendukung

Setiap item:
- nama dokumen,
- status wajib/pendukung,
- selected file,
- Pilih File,
- Upload,
- status berhasil.

---

# 17. Tombol Lanjut ke Analisis Dokumen

Setelah upload:
CTA utama:
**Lanjut ke Analisis Dokumen**

Jika dokumen wajib belum lengkap:
- boleh disable CTA atau tampil warning,
- sesuaikan mock scenario.

---

# 18. OCR + Parsing Dokumen

Setelah CTA ditekan:
tampilkan proses:

- OCR dokumen
- Parsing data
- Mapping field
- Cross-check dengan Excel jika Excel tersedia

Jika Excel tersedia:
- Excel menjadi source utama,
- OCR hanya memperkaya / memvalidasi.

Jika ada konflik:
tampilkan status:
`Perlu Ditinjau`

Jangan overwrite structured data secara diam-diam.

---

# 19. Step 5 — Review Data

Gabungkan hasil akhir ke satu screen:

### Ringkasan Hasil

Summary:
- Jumlah barang
- Jumlah HS Code
- Perizinan digunakan
- Dokumen terbaca
- Field berhasil dipetakan
- Field perlu ditinjau

Hindari terlalu menonjolkan global confidence score.

Jika ingin tetap ada:
gunakan sebagai secondary indicator.

---

# 20. Final Mapping Preview

Tampilkan normalized data hasil akhir.

Contoh table:
- Seri
- Uraian Barang
- HS Code
- Sumber Utama
- Perizinan
- Dokumen
- Status
- Detail

Sumber Utama dapat berupa:
- Excel
- OCR
- Manual

Status:
- Siap
- Perlu Ditinjau

---

# 21. CTA Akhir

Actions:
- **Kembali Periksa Data**
- **Lanjut ke Form Pengajuan**

Saat lanjut:
- tutup Smart Submission Assistant,
- masuk Form Pengajuan,
- auto-fill data hasil assistant.

Tampilkan info di Form:
> Data berikut diisi otomatis berdasarkan hasil Smart Submission Assistant. Pengguna tetap dapat melakukan koreksi sebelum submit.

---

# 22. State yang Perlu Disiapkan

Gunakan state mock seperti:

```js
assistantState = {
  userScope,
  identificationAnswers,
  identifiedSubmissionType,

  excel: {
    skipped,
    file,
    parsedItems,
    mappingStatus
  },

  ocr: {
    files,
    detectedItems,
    hsRecommendations
  },

  hsCodes: [],

  permits: {
    detected,
    selected,
    manual
  },

  attachments: [],

  finalMapping: []
}
```

Jangan menyebar state random ke banyak component tanpa struktur.

---

# 23. Source Priority

Implementasikan aturan mock:

```text
Excel > Existing INSW Data > OCR > Manual
```

Khusus konflik Excel vs OCR:
- pertahankan Excel,
- beri warning bahwa OCR menemukan perbedaan,
- user boleh meninjau.

---

# 24. Copy & Label Update

Gunakan istilah:

- Upload Excel Data Barang
- Analisis Data Barang
- Preview Mapping
- Validasi HS Code
- Identifikasi Perizinan
- Gunakan Perizinan Terdaftar
- Input Manual
- Dokumen Lampiran
- Analisis Dokumen
- Hasil Mapping
- Review Data

Hindari satu label "Data Parsing" untuk semua proses.

---

# 25. Visual Style

Pertahankan visual existing:
- modal besar Smart Submission Assistant,
- header sticky,
- stepper di atas,
- light blue conversation area,
- card putih,
- navy accent,
- rounded border,
- enterprise government style.

Jangan redesign total tampilan.
Fokus utama revisi adalah **flow dan state**.

---

# 26. Acceptance Criteria

Revisi dianggap selesai jika:

1. Identifikasi sudah mempertimbangkan mock scope dari SSO.
2. Excel tampil sebagai upload pertama/default.
3. User dapat skip Excel.
4. Upload Excel mengarah ke parsing + mapping.
5. Setelah mapping ada validasi HS Code.
6. HS Code memicu proses cek perizinan.
7. User dapat menggunakan izin existing, input manual, atau skip.
8. Setelah perizinan ada pertanyaan upload dokumen lampiran.
9. Jalur skip Excel menggunakan OCR untuk identifikasi barang.
10. Jalur OCR menghasilkan rekomendasi HS Code yang harus dikonfirmasi user.
11. Kedua branch bertemu pada perizinan dan final mapping.
12. Excel menjadi source utama jika Excel dan OCR sama-sama tersedia.
13. Final screen menampilkan hasil mapping sebelum masuk Form.
14. CTA akhir membawa user ke Form Pengajuan.
15. UI tetap konsisten dengan Smart Submission Assistant existing.

---

# 27. Catatan
Jangan hapus komponen existing yang masih dapat digunakan.

Prioritaskan reuse:
- conversational message bubble,
- choice card,
- upload card,
- parsing summary,
- mapping table,
- modal shell,
- stepper.

Refactor flow-nya, bukan membangun seluruh UI dari nol.
