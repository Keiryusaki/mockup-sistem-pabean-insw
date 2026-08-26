import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const outputPath = path.join(scriptDir, "insw-form-config-overrides.xlsx");
const importPath = path.join(projectRoot, "src/form-config/import/import-document-configs.json");
const exportPath = path.join(projectRoot, "src/form-config/export/export-document-configs.json");
const exportMappingPath = path.join(projectRoot, "src/form-config/export/export-source-mapping.json");

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const [importConfig, exportConfig, exportMapping] = await Promise.all([
  readJson(importPath),
  readJson(exportPath),
  readJson(exportMappingPath),
]);

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

const revision = 1;
const generatedAt = new Date().toISOString();
const checksum = createHash("sha256")
  .update(canonicalStringify({ IMPORT: importConfig, EXPORT: exportConfig }))
  .digest("hex");

const exportDocumentById = new Map(exportMapping.documents.map((document) => [document.id, document]));
const documents = [
  ...importConfig.documents.map((document) => ({ domain: "IMPORT", sourceVersion: importConfig.version, document })),
  ...exportConfig.documents.map((document) => ({ domain: "EXPORT", sourceVersion: exportConfig.version, document })),
];

function valueOrBlank(value) {
  return value === undefined || value === null ? "" : value;
}

function flattenOverrides(domain, config) {
  const rows = [];
  for (const document of config.documents) {
    for (const [stepId, step] of Object.entries(document.steps ?? {})) {
      if (["enabled", "label", "order"].some((key) => step[key] !== undefined)) {
        rows.push({ domain, documentId: document.id, nodeType: "STEP", stepId, enabled: step.enabled, customLabel: step.label, sortOrder: step.order });
      }
      for (const [sectionId, section] of Object.entries(step.sections ?? {})) {
        if (["enabled", "label", "description", "order"].some((key) => section[key] !== undefined)) {
          rows.push({ domain, documentId: document.id, nodeType: "SECTION", stepId, sectionId, enabled: section.enabled, customLabel: section.label, description: section.description, sortOrder: section.order });
        }
        for (const [fieldKey, field] of Object.entries(section.fields ?? {})) {
          rows.push({
            domain,
            documentId: document.id,
            nodeType: "FIELD",
            stepId,
            sectionId,
            fieldKey,
            enabled: field.enabled,
            required: field.required,
            customLabel: field.label,
            helperText: field.helperText,
            sortOrder: field.order,
          });
        }
      }
    }
  }
  return rows;
}

const overrides = [
  ...flattenOverrides("IMPORT", importConfig),
  ...flattenOverrides("EXPORT", exportConfig),
];

const workbook = new ExcelJS.Workbook();
workbook.creator = "INSW Form Config Generator";
workbook.created = new Date();
workbook.modified = new Date();
workbook.subject = "Published form configuration overrides for Import and Export";

const colors = {
  navy: "FF003B73",
  blue: "FF075BA7",
  lightBlue: "FFEAF3FB",
  yellow: "FFFFE39A",
  white: "FFFFFFFF",
  border: "FFD8DEE8",
  text: "FF263238",
};

function styleHeader(row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: colors.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.blue } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: colors.navy } } };
  });
}

function setupDataSheet(sheet, columns) {
  sheet.columns = columns;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  styleHeader(sheet.getRow(1));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber % 2 === 0) row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7FAFD" } }; });
  });
}

const readme = workbook.addWorksheet("README", { properties: { tabColor: { argb: colors.navy } } });
readme.columns = [{ width: 28 }, { width: 105 }];
readme.mergeCells("A1:B1");
readme.getCell("A1").value = "INSW — Form Configuration Overrides";
readme.getCell("A1").font = { bold: true, size: 18, color: { argb: colors.white } };
readme.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } };
readme.getCell("A1").alignment = { vertical: "middle" };
readme.getRow(1).height = 34;
[
  ["Tujuan", "Workbook ini menyimpan snapshot konfigurasi published. Base mapping tetap berada di repository."],
  ["Draft", "Draft configurator tetap disimpan di localStorage browser dan belum memengaruhi pengguna lain."],
  ["Publish", "Apps Script akan memvalidasi snapshot, menambah revision, menulis Documents dan Overrides, lalu mengubah Settings.published_revision."],
  ["Identitas field", "Override Ekspor menggunakan dataKey. Override Impor menggunakan field ID catalog. Jangan mengganti key teknis dari Spreadsheet."],
  ["Cara upload", "Upload file ini ke Google Drive, pilih Open with Google Sheets, lalu simpan sebagai Google Spreadsheet."],
  ["Sheet Settings", "Pointer revision aktif dan metadata schema."],
  ["Sheet Documents", "Metadata jenis dokumen per domain dan revision."],
  ["Sheet Overrides", "Sparse override untuk STEP, SECTION, dan FIELD."],
  ["Sheet Revisions", "Riwayat publish. Apps Script menambahkan satu record setiap publish."],
  ["Nilai kosong", "Sel kosong berarti mengikuti base mapping. FALSE berarti override eksplisit untuk mematikan state boolean."],
].forEach((values) => readme.addRow(values));
readme.eachRow((row, index) => {
  if (index === 1) return;
  row.alignment = { vertical: "top", wrapText: true };
  row.getCell(1).font = { bold: true, color: { argb: colors.navy } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightBlue } };
  row.height = 34;
});

const settings = workbook.addWorksheet("Settings", { properties: { tabColor: { argb: colors.yellow } } });
setupDataSheet(settings, [
  { header: "key", key: "key", width: 28 },
  { header: "value", key: "value", width: 34 },
  { header: "description", key: "description", width: 80 },
]);
settings.addRows([
  { key: "schema_version", value: 1, description: "Versi kontrak workbook." },
  { key: "published_revision", value: revision, description: "Revision yang dibaca aplikasi." },
  { key: "draft_storage", value: "LOCAL_STORAGE", description: "Draft configurator belum disimpan ke Spreadsheet." },
  { key: "generated_at", value: generatedAt, description: "Waktu workbook dibuat oleh generator." },
]);

const documentsSheet = workbook.addWorksheet("Documents", { properties: { tabColor: { argb: colors.blue } } });
setupDataSheet(documentsSheet, [
  { header: "revision", key: "revision", width: 12 },
  { header: "domain", key: "domain", width: 13 },
  { header: "document_id", key: "document_id", width: 24 },
  { header: "label", key: "label", width: 28 },
  { header: "description", key: "description", width: 75 },
  { header: "default_requires_quarantine", key: "default_requires_quarantine", width: 28 },
  { header: "archived", key: "archived", width: 12 },
  { header: "source_version", key: "source_version", width: 16 },
]);
documentsSheet.addRows(documents.map(({ domain, sourceVersion, document }) => ({
  revision,
  domain,
  document_id: document.id,
  label: document.label,
  description: document.description || (domain === "EXPORT" ? exportDocumentById.get(document.id)?.description ?? "" : ""),
  default_requires_quarantine: Boolean(document.defaultRequiresQuarantine),
  archived: Boolean(document.archived),
  source_version: sourceVersion,
})));

const overridesSheet = workbook.addWorksheet("Overrides", { properties: { tabColor: { argb: colors.blue } } });
setupDataSheet(overridesSheet, [
  { header: "revision", key: "revision", width: 12 },
  { header: "override_id", key: "override_id", width: 70 },
  { header: "domain", key: "domain", width: 13 },
  { header: "document_id", key: "document_id", width: 24 },
  { header: "node_type", key: "node_type", width: 14 },
  { header: "step_id", key: "step_id", width: 24 },
  { header: "section_id", key: "section_id", width: 32 },
  { header: "field_key", key: "field_key", width: 44 },
  { header: "enabled", key: "enabled", width: 12 },
  { header: "required", key: "required", width: 12 },
  { header: "custom_label", key: "custom_label", width: 38 },
  { header: "description", key: "description", width: 60 },
  { header: "helper_text", key: "helper_text", width: 55 },
  { header: "sort_order", key: "sort_order", width: 14 },
]);
overridesSheet.addRows(overrides.map((item) => ({
  revision,
  override_id: [item.domain, item.documentId, item.nodeType, item.stepId, item.sectionId, item.fieldKey].filter(Boolean).join(":"),
  domain: item.domain,
  document_id: item.documentId,
  node_type: item.nodeType,
  step_id: item.stepId,
  section_id: valueOrBlank(item.sectionId),
  field_key: valueOrBlank(item.fieldKey),
  enabled: valueOrBlank(item.enabled),
  required: valueOrBlank(item.required),
  custom_label: valueOrBlank(item.customLabel),
  description: valueOrBlank(item.description),
  helper_text: valueOrBlank(item.helperText),
  sort_order: valueOrBlank(item.sortOrder),
})));

const revisionsSheet = workbook.addWorksheet("Revisions", { properties: { tabColor: { argb: colors.yellow } } });
setupDataSheet(revisionsSheet, [
  { header: "revision", key: "revision", width: 12 },
  { header: "status", key: "status", width: 16 },
  { header: "published_at", key: "published_at", width: 28 },
  { header: "published_by", key: "published_by", width: 28 },
  { header: "checksum_sha256", key: "checksum_sha256", width: 70 },
  { header: "note", key: "note", width: 65 },
]);
revisionsSheet.addRow({ revision, status: "PUBLISHED", published_at: generatedAt, published_by: "INITIAL_IMPORT", checksum_sha256: checksum, note: "Snapshot awal dari override JSON repository." });

const dictionary = workbook.addWorksheet("Data Dictionary");
setupDataSheet(dictionary, [
  { header: "sheet", key: "sheet", width: 20 },
  { header: "column", key: "column", width: 34 },
  { header: "required", key: "required", width: 12 },
  { header: "description", key: "description", width: 85 },
]);
dictionary.addRows([
  { sheet: "Settings", column: "published_revision", required: true, description: "Pointer revision published yang dibaca endpoint GET Apps Script." },
  { sheet: "Documents", column: "revision + domain + document_id", required: true, description: "Composite key metadata dokumen." },
  { sheet: "Overrides", column: "override_id", required: true, description: "ID unik node override dalam satu revision." },
  { sheet: "Overrides", column: "node_type", required: true, description: "STEP, SECTION, atau FIELD." },
  { sheet: "Overrides", column: "field_key", required: "FIELD", description: "dataKey Ekspor atau field ID Impor; kosong untuk STEP/SECTION." },
  { sheet: "Overrides", column: "enabled", required: false, description: "Kosong mengikuti base; TRUE tampil; FALSE disembunyikan." },
  { sheet: "Overrides", column: "required", required: false, description: "Kosong mengikuti base; TRUE mandatory; FALSE optional." },
  { sheet: "Overrides", column: "sort_order", required: false, description: "Kosong mengikuti urutan base. Angka lebih kecil tampil lebih dahulu." },
  { sheet: "Revisions", column: "status", required: true, description: "PUBLISHED atau ARCHIVED. Hanya revision pada Settings yang aktif." },
]);

for (const sheet of [documentsSheet, overridesSheet]) {
  const domainColumn = sheet.getColumn("domain");
  const validationEndRow = Math.max(sheet.rowCount + 200, 250);
  for (let row = 2; row <= validationEndRow; row += 1) {
    sheet.getCell(row, domainColumn.number).dataValidation = { type: "list", allowBlank: false, formulae: ['"IMPORT,EXPORT"'] };
  }
}
const overrideValidationEndRow = Math.max(overridesSheet.rowCount + 200, 250);
for (let row = 2; row <= overrideValidationEndRow; row += 1) {
  overridesSheet.getCell(row, overridesSheet.getColumn("node_type").number).dataValidation = { type: "list", allowBlank: false, formulae: ['"STEP,SECTION,FIELD"'] };
}

await mkdir(scriptDir, { recursive: true });
await workbook.xlsx.writeFile(outputPath);
console.log(JSON.stringify({ outputPath, documents: documents.length, overrides: overrides.length, revision, checksum }, null, 2));
