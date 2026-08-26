# Mapping Form Ekspor

`export-source-mapping.json` adalah hasil normalisasi workbook sumber form ekspor dan diperlakukan sebagai base mapping read-only. Perubahan dari configurator disimpan terpisah di `export-document-configs.json` menggunakan struktur override yang sama dengan form Impor.

## Generate ulang

```powershell
.\tools\generate-export-form-mapping.ps1 `
  -SourcePath 'D:\Mitreka\Client\2026\INSW\ekspor_data(semua_jenis_dokumen)_v2.0.xlsx'
```

Generator membaca XLSX tanpa mengubah workbook sumber. Proses akan gagal jika menemukan tipe input, kode dokumen, section, atau duplicate field key yang belum dikenali.

## Identitas dokumen

| Kode sumber | ID konfigurasi |
| --- | --- |
| `bc30` | `EXP_BC30` |
| `kek-tlddp` | `EXP_KEK_TLDDP` |
| `kek-ldp` | `EXP_KEK_LDP` |
| `kek-fasilitas` | `EXP_KEK_FASILITAS` |
| `pkbe` | `EXP_PKBE` |
| `surveyor` | `EXP_SURVEYOR` |

## Aturan mapping

- `id` adalah key teknis stabil di dalam section.
- `dataKey` menggabungkan namespace section dan field, misalnya `header-pengajuan.kantorPabean1`.
- `label` berasal dari nama kolom default workbook.
- Label khusus dokumen disimpan di `documentOverrides`, bukan dijadikan field baru.
- Catatan deskriptif global ditampilkan sebagai suffix label, misalnya `Berat Kotor (Bruto)`.
- Keterangan berbentuk daftar pada field select dinormalisasi menjadi opsi asli, misalnya `FCL / LCL` menjadi opsi `FCL` dan `LCL`.
- Instruksi `(disable otomatis)` dan `(select search)` pada aturan dokumen diterjemahkan menjadi perilaku field dan dihapus dari label pengguna.
- Nama field yang sama pada section berbeda tidak dianggap bentrok karena memiliki `dataKey` berbeda.
- Configurator menggunakan `dataKey` sebagai ID override. Pengaturan `enabled`, `required`, `label`, `order`, dan `helperText` tidak mengubah source mapping.
- Resolver selalu membentuk UI dari `base mapping + override dokumen`. Regenerasi workbook tidak menghapus override selama `dataKey` tetap sama.
- Section Karantina, Detail Mutu, Barang Karantina, dan PKB ditempatkan pada step `karantina` yang memiliki kondisi `requiresQuarantine`.
- Section child menyimpan metadata `relation`. Contohnya Barang Karantina memakai `_barangRef` yang mengarah ke record pada `barang-info`; key sintetis ini hanya untuk state mock dan bukan field backend baru.
- `Pihak Konsolidasi` adalah single-record kondisional untuk BC 3.0. UI hanya memasukkannya ke form dan perhitungan mandatory ketika skenario konsolidasi diaktifkan.
- `Pemilik Barang` tetap repeatable karena mempunyai seri entitas dan dapat direlasikan sebagai data pemilik.
- Tambah dan edit `Pemilik Barang` mengikuti pola inline tabel yang sama dengan form Impor. Record dapat disalin by-value dari Data Eksportir, sedangkan `Seri` dibuat read-only dan dinomori ulang setelah perubahan daftar.

## Penyimpanan konfigurasi saat ini

- `export-document-configs.json`: override published di repository selama tahap lokal.
- `localStorage`: draft configurator per browser.
- Tahap berikutnya mengganti provider override JSON dengan Spreadsheet + Apps Script tanpa mengubah resolver atau UI configurator.
