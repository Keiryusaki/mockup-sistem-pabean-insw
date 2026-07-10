import { buildBaseFormSnapshot, type AiSubmissionDraft, type FormStateSnapshot } from "./formSnapshotData";
import type { UploadFlowContext } from "./submissionLauncherData";

export type UploadDraftResult = {
  draft: AiSubmissionDraft;
  formState: FormStateSnapshot;
};

export function buildDraftFromUpload(
  context: UploadFlowContext | null,
  excelFiles: string[],
  ocrFiles: string[],
): UploadDraftResult {
  const hasExcel = excelFiles.length > 0;
  const hasOcr = ocrFiles.length > 0;
  const sourceDocuments = hasExcel
    ? [...excelFiles, ...ocrFiles]
    : hasOcr
      ? [...ocrFiles]
      : context?.copyRow
        ? [context.copyRow.dokumen]
        : context?.documentType
          ? [context.documentType]
          : [];

  const jenisPengajuan =
    context?.documentType ||
    context?.copyRow?.dokumen ||
    (hasExcel ? "Pengajuan Barang Masuk / Impor" : hasOcr ? "Pengajuan Barang Masuk / Impor" : "Pengajuan Umum");

  const companyName = context?.copyRow?.perusahaan || "PT Contoh Nusantara";
  const npwp = "01.234.567.8-999.000";
  const nib = context?.source === "copy" ? `COPY-${context.copyRow?.nomor ?? "0001"}` : "1234567890123";

  const draft: AiSubmissionDraft = {
    jenisPengajuan,
    namaPerusahaan: companyName,
    npwp,
    nib,
    keterangan:
      hasExcel && hasOcr
        ? "Data Excel digunakan sebagai sumber utama. Dokumen OCR digunakan sebagai validasi dan pelengkap data."
        : hasOcr
          ? "Data hasil OCR perlu ditinjau kembali."
          : context?.source === "copy"
            ? `Prefill disiapkan dari pengajuan sebelumnya ${context.copyRow?.nomor ?? ""}.${context.copyGroups?.length ? ` Kelompok yang dipilih: ${context.copyGroups.length}.` : ""}`
            : `Prefill disiapkan dari dokumen ${jenisPengajuan}.`,
    dokumen: sourceDocuments.length ? sourceDocuments : ["surat_pengajuan_impor_v01.docx"],
  };

  return {
    draft,
    formState: buildBaseFormSnapshot(draft.jenisPengajuan, draft.namaPerusahaan, draft.npwp, draft.nib, draft.dokumen),
  };
}
