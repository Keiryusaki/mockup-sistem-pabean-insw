# Google Sheet Form Configuration

Generate workbook awal:

```powershell
npm run generate:form-config-workbook
```

Output: `insw-form-config-overrides.xlsx`.

Workbook berisi snapshot published dari override JSON Impor dan Ekspor. Upload ke Google Drive, buka dengan Google Sheets, kemudian gunakan Spreadsheet tersebut sebagai data store Apps Script.

Aturan penting:

- Base mapping tidak disalin ke Spreadsheet.
- `field_key` Ekspor adalah `dataKey`; Impor memakai field ID catalog.
- Sel kosong berarti mengikuti base mapping.
- `FALSE` adalah override eksplisit, bukan nilai kosong.
- Aplikasi hanya membaca revision pada `Settings.published_revision`.
- Apps Script harus menulis snapshot revision baru sebelum mengubah pointer published revision.
