Revisi Smart Submission Assistant berdasarkan hasil usability review.

====================================================
1. PERSISTENT CONVERSATION HISTORY
====================================================

Saat berpindah macro-step, jangan menghapus history pertanyaan dan jawaban assistant.

User harus tetap dapat melihat bagaimana hasil identifikasi sebelumnya diperoleh.

Pertahankan conversation history dalam satu state.

Jika history terlalu panjang:
- tampilkan summary/collapse:
  "Lihat 6 jawaban sebelumnya"
- user dapat expand kembali.

Jangan reset chat ketika masuk:
- Data Barang
- Perizinan
- Dokumen Lampiran
- Review Data

====================================================
2. PERIZINAN MENJADI MULTI-SELECT
====================================================

Saat ini perizinan terlihat seperti single-select card.

Ubah menjadi multi-select karena satu HS Code dapat membutuhkan lebih dari satu izin.

Setiap izin memiliki checkbox.

Contoh:

☑ Perizinan Elektronik
  PT-ELK-2026-00881
  Aktif
  Berlaku sampai 31 Desember 2026
  Kementerian Perdagangan

☑ Masterlist Fasilitas
  ML-00123
  Aktif
  Berlaku sampai 30 Juni 2027
  BKPM

Tampilkan summary:
"2 dari 3 perizinan dipilih"

CTA:
- Gunakan Perizinan Terpilih
- Input Manual
- Lewati

====================================================
3. GROUPING PER HS CODE
====================================================

Jika terdapat banyak HS Code, kelompokkan izin berdasarkan HS Code.

Gunakan accordion/compact group.

Contoh:

HS 8471.30.10 — Laptop Computer
3 perizinan ditemukan
2 dipilih

HS 8504.40.90 — Power Adapter
1 perizinan ditemukan
1 dipilih

HS 3923.10.90
Tidak ditemukan perizinan

Jangan menampilkan puluhan card besar sekaligus.

Gunakan area scroll internal jika jumlah izin banyak.

====================================================
4. DOKUMEN LAMPIRAN
====================================================

Update kategori:

Wajib:
- Invoice
- Packing List
- Bill of Lading

Pendukung:
- Certificate of Origin (COO)
- dokumen lain sesuai hasil identifikasi

Meskipun dokumen berlabel Wajib, flow tetap boleh dilanjutkan.

Logic CTA:

- Jika belum ada satu pun dokumen berhasil di-upload:
  tombol "Lanjut ke Analisis Dokumen" disabled

- Jika minimal 1 dokumen sudah berhasil di-upload:
  tombol aktif

- Jika masih ada dokumen wajib belum ter-upload:
  tampilkan warning:
  "Beberapa dokumen wajib belum diunggah. Anda tetap dapat melanjutkan dan melengkapinya pada Form Pengajuan."

Jangan hard-block user.

====================================================
5. PERBAIKI BRANCH TANPA EXCEL
====================================================

Saat ini jika user melewati Excel:
- user upload dokumen OCR
- setelah HS dan perizinan selesai
- user diarahkan lagi ke Dokumen Lampiran

Ini salah karena menyebabkan upload OCR dua kali.

Perbaiki flow.

FLOW A — DENGAN EXCEL

Identifikasi
↓
Upload Excel
↓
Parsing Excel
↓
Mapping
↓
Validasi HS
↓
Perizinan
↓
Dokumen Lampiran
↓
OCR + Parsing Dokumen
↓
Review Data
↓
Form Pengajuan


FLOW B — TANPA EXCEL

Identifikasi
↓
Lewati Excel
↓
Upload Dokumen OCR
↓
OCR + Identifikasi Barang
↓
Rekomendasi HS Code
↓
User memilih HS Code
↓
Perizinan
↓
Review Data
↓
Form Pengajuan

PENTING:
Pada FLOW B jangan tampilkan step Upload Dokumen Lampiran lagi.

Dokumen yang di-upload pada proses OCR pertama dianggap sebagai:
- sumber identifikasi barang
- sekaligus dokumen lampiran user

====================================================
6. STEPPER DINAMIS
====================================================

Stepper mengikuti branch.

Jika menggunakan Excel:

Identifikasi
Data Barang
Perizinan
Dokumen Lampiran
Review Data

Jika melewati Excel:

Identifikasi
Data Barang
Perizinan
Review Data

Dokumen Lampiran tidak perlu tampil sebagai step terpisah pada branch OCR.

====================================================
7. REVIEW DATA
====================================================

Pada branch OCR, Review Data harus tetap menampilkan dokumen yang sudah di-upload sebelumnya.

Contoh summary:

Sumber Data:
Dokumen OCR

Dokumen:
- Invoice.pdf
- PackingList.pdf
- BillOfLading.pdf

Barang teridentifikasi:
5

HS Code:
5 dikonfirmasi

Perizinan:
3 digunakan

Dengan demikian user tidak merasa dokumen yang sudah di-upload sebelumnya hilang.

====================================================
TARGET UX
====================================================

- History assistant tetap dapat ditelusuri.
- Perizinan dapat memilih lebih dari satu.
- Banyak izin tidak membuat halaman terlalu panjang.
- Dokumen wajib tidak menyebabkan dead-end.
- Bill of Lading menjadi dokumen wajib.
- Branch tanpa Excel hanya memiliki satu proses upload OCR.
- User tidak diminta meng-upload file yang sama dua kali.