# Apps Script — INSW Form Configuration

## Pasang sebagai bound script

1. Buka Spreadsheet `insw-form-config-overrides`.
2. Pilih **Extensions → Apps Script**.
3. Ganti isi `Code.gs` dengan file `Code.gs` dari folder ini.
4. Pada **Project Settings**, aktifkan tampilan file manifest lalu ganti `appsscript.json` dengan file dari folder ini.
5. Save, lalu reload Spreadsheet.
6. Pilih menu **Form Configuration → Setup Project** dan izinkan akses.
7. Pilih **Form Configuration → Configure Publish Key**. Gunakan secret acak minimal 24 karakter dan simpan secret tersebut untuk konfigurasi server/proxy intranet.
8. Jalankan **Validate Published Revision**.

## Deploy Web App

1. Di Apps Script pilih **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: pilih sesuai Workspace/intranet. Untuk endpoint baca publik mockup dapat memilih akses yang lebih longgar, tetapi publish tetap membutuhkan `publishKey`.
5. Deploy dan salin URL yang berakhir `/exec`.

Setiap perubahan Code.gs memerlukan **Manage deployments → Edit → New version → Deploy** agar endpoint `/exec` memakai kode terbaru.

## Test endpoint

Health:

```text
GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=health
```

Published configuration:

```text
GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=config
GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=config&domain=EXPORT&documentId=EXP_BC30
```

Publish menggunakan `POST` JSON. Dari browser gunakan `Content-Type: text/plain;charset=utf-8` untuk menghindari preflight; implementasi final sebaiknya melalui proxy intranet agar publish key tidak masuk bundle frontend.

```json
{
  "action": "publish",
  "publishKey": "SECRET_DARI_SCRIPT_PROPERTIES",
  "publishedBy": "configurator@intranet",
  "note": "Update label dan mandatory",
  "configs": {
    "IMPORT": { "version": 2, "documents": [] },
    "EXPORT": { "version": 1, "documents": [] }
  }
}
```

Publish menambahkan snapshot baru ke `Documents` dan `Overrides`, mencatat `Revisions`, lalu mengubah `Settings.published_revision` setelah seluruh penulisan berhasil.
