# Smart Submission Assistant — Flow Context & Business Understanding

## 1. Tujuan Dokumen
Dokumen ini menjadi **source of truth** untuk memahami konteks bisnis dan alur baru Smart Submission Assistant pada mockup Sistem Kepabeanan INSW.

Dokumen ini **bukan instruction implementasi langsung**. Tujuannya agar agent memahami:
- konteks flow,
- alasan perubahan,
- hubungan antar proses,
- sumber data,
- branching Excel vs OCR,
- relasi HS Code dengan perizinan,
- dan titik akhir sebelum user masuk ke Form Pengajuan.

Semua revisi UI berikutnya harus tetap mengacu pada pemahaman di dokumen ini.

---

## 2. Konteks Umum
Smart Submission Assistant digunakan untuk membantu user:
1. Mengidentifikasi jenis pengajuan yang relevan.
2. Menentukan sumber data barang.
3. Membaca atau memetakan data barang.
4. Mengidentifikasi HS Code.
5. Mengecek kebutuhan perizinan.
6. Mencocokkan izin yang sudah dimiliki user di sistem INSW.
7. Memproses dokumen lampiran wajib maupun pendukung.
8. Menyiapkan hasil data untuk masuk ke Form Pengajuan.

Assistant bersifat **guided flow**, bukan chatbot bebas tanpa struktur.

---

## 3. Informasi dari SSO / Token Backend
Pada flow baru, Backend sudah mengirim token dari SSO.

Token tersebut sudah membawa informasi yang mempersempit scope user, misalnya:
- user hanya dapat membuat dokumen tertentu,
- user berada pada domain pemasukan atau pengeluaran tertentu,
- user hanya memiliki akses pada jenis pengajuan tertentu.

### Implikasi
Pertanyaan identifikasi tidak lagi harus mulai dari pertanyaan yang terlalu umum seperti:
- pemasukan atau pengeluaran?
- user mau membuat apa dari nol?

Flow identifikasi harus memanfaatkan scope dari token agar:
- pertanyaan lebih pendek,
- pilihan lebih relevan,
- opsi yang tidak mungkin tidak perlu ditampilkan.

Contoh:
Jika token menunjukkan user hanya bisa membuat dokumen ekspor, assistant tidak perlu lagi menanyakan "Barang Masuk Indonesia atau Barang Keluar Indonesia?".
Assistant langsung masuk ke pertanyaan turunan untuk membedakan kebutuhan ekspor yang relevan.

---

## 4. Flow Existing
Flow existing mockup:

### Mulai Pengajuan
↓
### Smart Submission Assistant — Identifikasi 1
↓
### Identifikasi 2
↓
### Identifikasi 3
↓
### Identifikasi 4
↓
### Identifikasi 5
↓
### Upload Data Barang
↓
### Data Parsing
- OCR parsing
- mapping data
↓
### Form Pengajuan

Pada flow existing:
- Excel dan OCR masih berada dalam satu area Upload Data Barang.
- Data Parsing menangani beberapa sumber sekaligus.
- HS Code dan pencocokan perizinan belum menjadi tahapan eksplisit.

---

## 5. Prinsip Flow Baru
Flow baru memisahkan dua jalur sumber data:

### Jalur A — User menggunakan Excel
Excel menjadi sumber utama structured data barang.

### Jalur B — User melewati Excel
Dokumen lampiran / pendukung menjadi sumber utama informasi barang melalui OCR dan AI.

Kedua jalur akhirnya bertemu kembali pada:
- identifikasi HS Code,
- pencocokan perizinan,
- hasil mapping,
- dan Form Pengajuan.

---

# 6. FLOW BARU — HIGH LEVEL

```text
SSO / Token Backend
↓
Scope Jenis Dokumen User Diketahui
↓
Smart Submission Assistant
↓
Identifikasi yang Sudah Dikerucutkan
↓
Hasil Identifikasi Pengajuan
↓
Upload Excel Data Barang
├─ Upload Excel
│  ↓
│  Parsing Excel
│  ↓
│  Mapping Data Barang
│  ↓
│  Validasi / Identifikasi HS Code
│
└─ Lewati Upload Excel
   ↓
   Upload Dokumen Lampiran / Pendukung
   ↓
   OCR + Analisis Dokumen
   ↓
   Identifikasi Barang
   ↓
   Rekomendasi HS Code
   ↓
   User Konfirmasi / Pilih HS Code

↓
Identifikasi Kebutuhan Perizinan
↓
Cek Perizinan User yang Sudah Terdaftar di INSW
↓
Gunakan Izin Existing / Input Manual / Lewati
↓
Upload Dokumen Lampiran Wajib / Pendukung
↓
OCR + Parsing
↓
Hasil Parsing + Data Mapping
↓
Form Pengajuan
```

---

# 7. Jalur A — Upload Excel

## 7.1 Upload Excel
Upload Excel menjadi proses yang muncul terlebih dahulu setelah identifikasi selesai.

Tujuan:
- mengambil data barang terstruktur,
- mempercepat populasi data,
- mengurangi ketergantungan OCR.

User memiliki dua opsi:
- **Upload Excel**
- **Lewati Upload Excel**

### Catatan
Jika Excel di-upload, Excel menjadi sumber utama data barang.

## 7.2 Parsing Excel
Setelah file Excel di-upload:
- sistem membaca struktur file,
- melakukan parsing data,
- menampilkan hasil mapping.

Gunakan istilah seperti:
- Analisis Data Barang
- Mapping Data

Hindari mencampur istilah ini dengan OCR karena Excel bukan proses OCR.

## 7.3 Preview Mapping
User melihat hasil parsing Excel dalam bentuk preview.

Contoh informasi:
- Seri
- Uraian Barang
- HS Code
- Qty
- Satuan
- Negara Asal
- field penting lainnya

User perlu dapat:
- melihat hasil,
- mengecek kecocokan,
- membuka detail jika diperlukan.

## 7.4 Validasi / Identifikasi HS Code
Setelah mapping:
- sistem membaca HS Code yang ada,
- memvalidasi HS Code,
- mengidentifikasi apakah HS Code tertentu membutuhkan perizinan.

Jika Excel belum memiliki HS Code yang valid, sistem dapat memberikan indikasi atau meminta user memperbaikinya.

---

# 8. Jalur B — Lewati Excel / Gunakan OCR

Jika user memilih **Lewati Upload Excel**, sistem langsung berpindah ke proses upload dokumen lampiran / pendukung.

Dokumen dapat berupa:
- Invoice
- Packing List
- Bill of Lading
- dokumen wajib lainnya
- dokumen pendukung lainnya

## 8.1 OCR dan Analisis Dokumen
Sistem:
- membaca dokumen dengan OCR,
- melakukan parsing,
- mengidentifikasi daftar barang,
- mengkaji informasi barang.

## 8.2 Rekomendasi HS Code
Karena tidak ada Excel sebagai structured source, AI membantu memberikan **perkiraan/rekomendasi HS Code** berdasarkan isi dokumen.

User harus tetap menentukan atau mengonfirmasi HS Code.

Contoh:
```text
Barang terdeteksi:
Laptop / Portable Computer

Rekomendasi HS Code:
○ 8471.30.10
○ 8471.30.90
○ Pilih HS Code lain
```

AI tidak boleh dianggap sebagai penentu final.
User tetap dapat:
- memilih rekomendasi,
- mengganti HS Code,
- melakukan input manual.

---

# 9. HS Code & Perizinan

HS Code menjadi titik penting karena digunakan untuk menentukan kemungkinan kebutuhan perizinan.

Setelah HS Code tersedia:
1. Sistem mengidentifikasi HS Code yang membutuhkan izin.
2. Sistem mengecek data perizinan milik user yang sudah terdaftar di INSW.
3. Sistem mencocokkan izin dengan HS Code terkait.

Contoh:
```text
HS 8471.30.10
Laptop

Ditemukan 2 perizinan terkait:
- PI Elektronik
- Masterlist ML-00123
```

---

# 10. Pilihan Perizinan

Jika sistem menemukan perizinan terkait, user ditanya:

> Apakah Anda ingin menggunakan perizinan yang sudah terdaftar?

Pilihan:
- **Gunakan Perizinan**
- **Input Manual**
- **Lewati**

## Jika Gunakan Perizinan
User diarahkan memilih dari daftar izin yang relevan.

Daftar izin harus memiliki konteks:
- nama izin,
- nomor,
- status,
- masa berlaku,
- HS Code terkait jika relevan.

## Jika Input Manual
User dapat memasukkan data izin manual.

## Jika Lewati
Flow lanjut tanpa memilih izin, tetapi sistem dapat menampilkan warning jika izin sebenarnya relevan.

---

# 11. Dokumen Lampiran Wajib & Pendukung

Setelah proses perizinan, assistant bertanya:

> Apakah Anda ingin mengunggah dokumen lampiran wajib maupun pendukung?

Pilihan:
- **Ya**
- **Lewati**

Jika Ya:
- tampilkan daftar form upload berdasarkan hasil identifikasi,
- dokumen wajib dibedakan dari dokumen pendukung,
- user dapat upload satu atau beberapa dokumen.

Contoh:
```text
Wajib
- Invoice
- Packing List

Pendukung
- Bill of Lading
- COO
```

---

# 12. OCR & Parsing Dokumen Lampiran

Setelah dokumen di-upload:
- sistem melakukan OCR,
- parsing data,
- mapping field,
- validasi hasil.

Data hasil OCR tidak langsung dianggap final.
User perlu diberi informasi bahwa hasil OCR harus ditinjau kembali.

---

# 13. Hasil Parsing & Data Mapping

Setelah proses selesai, tampilkan:
- ringkasan parsing,
- jumlah barang terbaca,
- jumlah dokumen terbaca,
- field berhasil dipetakan,
- warning,
- hasil mapping data.

Jika ada confidence score, gunakan hanya sebagai indikator teknis dan jangan menjadikannya keputusan.

Contoh:
```text
Parsing selesai

5 barang terbaca
3 dokumen terbaca
18 field berhasil dipetakan
2 field perlu ditinjau
```

---

# 14. Titik Pertemuan Dua Jalur

Baik user menggunakan Excel maupun OCR, kedua flow harus bertemu sebelum masuk Form Pengajuan.

Target akhirnya adalah **normalized data**:

```text
Data Barang
+
HS Code
+
Perizinan
+
Dokumen Lampiran
+
Hasil Mapping
```

Setelah normalized data tersedia:
↓
Masuk ke **Form Pengajuan**

Form kemudian melakukan auto-fill berdasarkan hasil assistant.

---

# 15. Prioritas Sumber Data

Jika terdapat lebih dari satu sumber data, gunakan prioritas berikut:

1. **Excel / structured data**
2. Data existing dari sistem INSW
3. OCR dokumen
4. Input manual

Jika informasi yang sama ditemukan pada Excel dan OCR:
- Excel menjadi sumber utama,
- OCR dapat digunakan sebagai pembanding / validasi,
- jangan overwrite Excel secara otomatis tanpa konfirmasi.

---

# 16. Prinsip UX

## A. Jangan menampilkan terlalu banyak macro step
Walaupun proses internal panjang, stepper utama harus tetap sederhana.

Hindari:
```text
Identifikasi
Upload
Parsing Excel
Mapping
HS
Perizinan
Upload Dokumen
OCR
Mapping OCR
Review
```

Gunakan pengelompokan yang lebih manusiawi.

Contoh kandidat macro step:
```text
1. Identifikasi
2. Data Barang
3. Perizinan
4. Dokumen Lampiran
5. Review Data
```

Catatan:
Macro step final masih dapat disesuaikan setelah review UI.

## B. Gunakan progressive disclosure
Tampilkan hanya pilihan yang relevan dengan konteks user.

## C. Assistant tetap conversational
Walaupun di belakang berbasis state machine, UI harus terasa seperti assistant:
- pertanyaan,
- pilihan,
- hasil analisis,
- arahan selanjutnya.

## D. Jangan meminta ulang data yang sudah diketahui
Jika SSO/token atau data INSW sudah memiliki informasi, jangan meminta user mengisi ulang tanpa alasan.

## E. Bedakan structured dan unstructured source
Excel != OCR.

Istilah UI harus mencerminkan perbedaan ini.

---

# 17. Business Rules Penting

- Scope dokumen user berasal dari token Backend/SSO.
- Identifikasi harus menyesuaikan scope tersebut.
- Upload Excel adalah jalur pertama/default.
- Upload Excel dapat dilewati.
- Jika Excel dilewati, dokumen OCR menjadi sumber identifikasi barang.
- AI dapat memberi rekomendasi HS Code tetapi user tetap mengonfirmasi.
- HS Code digunakan untuk mendeteksi kebutuhan perizinan.
- Sistem dapat mencari izin existing milik user di INSW.
- User dapat menggunakan izin existing, input manual, atau melewati.
- Dokumen lampiran dapat bersifat wajib atau pendukung.
- Excel memiliki prioritas lebih tinggi daripada OCR untuk field yang sama.
- Hasil akhir assistant adalah data terstruktur untuk auto-fill Form Pengajuan.

---

# 18. Terminologi yang Disarankan

Gunakan:
- Identifikasi
- Data Barang
- Analisis Data Barang
- Mapping Data
- HS Code
- Perizinan
- Dokumen Lampiran
- Analisis Dokumen
- Hasil Parsing
- Review Data

Hindari terlalu sering menggunakan:
- OCR Parsing
- AI Decision
- Recommendation Final
- Risk Decision

AI bersifat membantu identifikasi dan pemetaan, bukan mengambil keputusan legal.

---

# 19. Catatan Implementasi Mockup
Untuk mockup:
- seluruh API boleh menggunakan mock/local state,
- daftar izin boleh mock,
- token SSO boleh direpresentasikan sebagai mock user scope,
- hasil parsing boleh menggunakan dummy data,
- struktur flow harus mengikuti dokumen ini walaupun backend belum tersedia.

Dokumen ini harus dibaca sebelum mengerjakan revisi Smart Submission Assistant.
