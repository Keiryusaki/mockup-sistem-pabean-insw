import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { Button } from "../../components/Button";
import { TrashBinTrashIcon } from "../../components/Icons";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { CloseIcon } from "./SubmissionModalShared";
import { ParsingReviewSection, type ParsingReviewRow } from "./ParsingReviewSection";
import {
  buildUploadNotice,
  copyDataGroupLookup,
  copyDataLeafLookup,
  createDefaultOcrSlots,
  createUploadSlot,
  type UploadFlowContext,
  type UploadSlot,
  type UploadStage,
  type UploadStatus,
} from "./submissionLauncherData";

const BASE_URL = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
const SAMPLE_DRAFT_PDF = `${BASE_URL}/sample-smart-draft.pdf`;
const PDF_WORKER_URL = pdfWorkerUrl;

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M14 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8l-6-6Zm1 7V4.5L19.5 9H15a.5.5 0 0 1-.5-.5ZM8 12h8v1.5H8V12Zm0 3h8v1.5H8V15Z" />
    </svg>
  );
}

function UploadTemplateIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-current">
      <path d="M12 3 7 8h3v5h4V8h3l-5-5Z" />
      <path d="M6 16h12v2H6z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

export function UploadBarangModal({
  open,
  onClose,
  onBack,
  context,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  context: UploadFlowContext | null;
  onComplete: (payload: { excelFiles: string[]; ocrFiles: string[] }) => void;
}) {
  const [stage, setStage] = useState<UploadStage>("upload");
  const [excelSlot, setExcelSlot] = useState<UploadSlot>(() =>
    createUploadSlot("excel", "Upload Template Excel", "File Excel digunakan sebagai sumber data utama untuk pengisian barang.", true),
  );
  const [ocrSlots, setOcrSlots] = useState<UploadSlot[]>(() => createDefaultOcrSlots());
  const [customCounter, setCustomCounter] = useState(1);
  const [parseRevision, setParseRevision] = useState(0);
  const [selectedParseRow, setSelectedParseRow] = useState<ParsingReviewRow | null>(null);
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage("upload");
    setExcelSlot(createUploadSlot("excel", "Upload Template Excel", "File Excel digunakan sebagai sumber data utama untuk pengisian barang.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setParseRevision(0);
    setSelectedParseRow(null);
    setDismissConfirmOpen(false);
  }, [open]);

  const uploadedExcelFiles = excelSlot.uploadedFile ? [excelSlot.uploadedFile] : [];
  const uploadedOcrSlots = ocrSlots.filter((slot) => slot.uploadedFile);
  const uploadedOcrFiles = uploadedOcrSlots.map((slot) => `${slot.label} - ${slot.uploadedFile}`);
  const hasExcel = uploadedExcelFiles.length > 0;
  const hasOcr = uploadedOcrFiles.length > 0;
  const isTemplateFlow = context?.source === "upload";
  const hasPendingUploads = excelSlot.status === "picked" || excelSlot.status === "failed" || ocrSlots.some((slot) => slot.status === "picked" || slot.status === "failed");
  const barangCount = hasExcel ? Math.max(1, uploadedExcelFiles.length * 2) : hasOcr ? Math.max(1, uploadedOcrFiles.length) : context?.source === "copy" ? 1 : 0;
  const supportCount = uploadedOcrFiles.length;
  const mappedFields = hasExcel ? 18 : hasOcr ? 12 : 0;
  const notice = buildUploadNotice(uploadedExcelFiles, uploadedOcrFiles);
  const parseSources = useMemo<ParsingReviewRow["source"][]>(() => {
    const ocrSources = uploadedOcrSlots
      .filter((slot) => slot.uploadedFile)
      .map((slot, index) => {
        const fileName = slot.uploadedFile ?? slot.selectedFile ?? `ocr-${index + 1}`;
        return {
          id: slot.id,
          label: slot.label,
          fileName,
          kind: fileName.toLowerCase().endsWith(".pdf") ? ("pdf" as const) : ("image" as const),
        };
      });

    if (ocrSources.length) return ocrSources;

    if (hasExcel) {
      const fileName = excelSlot.uploadedFile ?? excelSlot.selectedFile ?? "template-upload-barang.xlsx";
      return [
        {
          id: "excel-source",
          label: "Template Excel",
          fileName,
          kind: "spreadsheet",
        },
      ];
    }

    return [
      { id: "ocr-a", label: "OCR A", fileName: "ocr-sumber-a.pdf", kind: "pdf" },
      { id: "ocr-b", label: "OCR B", fileName: "ocr-sumber-b.png", kind: "image" },
    ];
  }, [excelSlot.selectedFile, excelSlot.uploadedFile, hasExcel, uploadedOcrSlots]);

  const parseRows = useMemo<ParsingReviewRow[]>(() => {
    const sourceA = parseSources[0];
    const sourceB = parseSources[1] ?? sourceA;
    const rows: Array<Omit<ParsingReviewRow, "source"> & { sourceIndex: number }> = [
      { seri: "1", uraian: "Barang contoh A", hsCode: "8471.30.10", quantity: "10", sourceIndex: 0 },
      { seri: "2", uraian: "Barang contoh B", hsCode: "8471.30.90", quantity: "4", sourceIndex: 0 },
      { seri: "3", uraian: "Barang contoh C", hsCode: "8504.40.90", quantity: "8", sourceIndex: 0 },
      { seri: "4", uraian: "Barang contoh D", hsCode: "3923.10.90", quantity: "12", sourceIndex: 1 },
      { seri: "5", uraian: "Barang contoh E", hsCode: "7326.90.99", quantity: "2", sourceIndex: 1 },
    ];

    return rows.map((row) => ({
      seri: row.seri,
      uraian: row.uraian,
      hsCode: row.hsCode,
      quantity: row.quantity,
      source: row.sourceIndex === 0 ? sourceA : sourceB,
    }));
  }, [parseSources]);

  const parseConfidence = useMemo(() => {
    const fileCount = uploadedExcelFiles.length + uploadedOcrFiles.length;
    if (!fileCount) return 0;
    return Math.min(99, 84 + fileCount * 3 + parseRevision * 2);
  }, [parseRevision, uploadedExcelFiles.length, uploadedOcrFiles.length]);

  const parseConfidenceLabel =
    parseConfidence >= 95 ? "Aman" : parseConfidence >= 60 ? "Perlu dicek" : parseConfidence > 0 ? "Wajib review" : "Menunggu upload";
  const parseConfidenceTone =
    parseConfidence >= 95
      ? "border-success-200 bg-success-50 text-success-700"
      : parseConfidence >= 60
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-error-200 bg-error-50 text-error-700";
  const handleDismissRequest = () => {
    if (stage === "validasi") {
      setDismissConfirmOpen(true);
      return;
    }

    onClose();
  };

  const handleConfirmExit = () => {
    setDismissConfirmOpen(false);
    onClose();
  };

  if (!open) return null;

  const handleExcelPick = (file: File | null) => {
    setExcelSlot((current) =>
      file
        ? { ...current, selectedFile: file.name, status: "picked", error: null }
        : { ...current, selectedFile: null, uploadedFile: null, status: "empty", error: null },
    );
  };

  const handleExcelUpload = () => {
    setExcelSlot((current) => {
      if (!current.selectedFile) return { ...current, status: "failed", error: "Pilih file Excel dulu." };
      return { ...current, uploadedFile: current.selectedFile, status: "uploaded", error: null };
    });
  };

  const handleOcrPick = (slotId: string, file: File | null) => {
    setOcrSlots((current) =>
      current.map((slot) =>
        slot.id !== slotId
          ? slot
          : file
            ? { ...slot, selectedFile: file.name, status: "picked", error: null }
            : { ...slot, selectedFile: null, uploadedFile: null, status: "empty", error: null },
      ),
    );
  };

  const handleOcrUpload = (slotId: string) => {
    setOcrSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        if (!slot.selectedFile) return { ...slot, status: "failed", error: "Pilih file OCR dulu." };
        return { ...slot, uploadedFile: slot.selectedFile, status: "uploaded", error: null };
      }),
    );
  };

  const handleOcrRemove = (slotId: string) => {
    setOcrSlots((current) => current.filter((slot) => slot.id !== slotId || !slot.removable));
  };

  const addOcrSlot = () => {
    setCustomCounter((current) => current + 1);
    setOcrSlots((current) => [
      ...current,
      createUploadSlot(`custom-${Date.now()}`, `Dokumen tambahan ${customCounter + 1}`, "Tambahkan dokumen OCR lain yang perlu diunggah.", false, true),
    ]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, kind: "excel" | "ocr", slotId?: string) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (kind === "excel") {
      handleExcelPick(file);
      return;
    }
    if (slotId) handleOcrPick(slotId, file);
  };

  const goToParsing = () => setStage("validasi");
  const handleReparse = () => {
    setParseRevision((current) => current + 1);
    setSelectedParseRow(null);
  };
  const finishUploadFlow = () => {
    onComplete({ excelFiles: uploadedExcelFiles, ocrFiles: uploadedOcrFiles });
    onClose();
  };
  const handleBackAction = () => {
    if (stage === "validasi") {
      setStage("upload");
      return;
    }

    onBack();
  };
  const statusTone = (state: UploadStatus) =>
    state === "uploaded"
      ? "bg-success-50 text-success-700"
      : state === "picked"
        ? "bg-brand-primary-50 text-brand-primary-700"
        : state === "failed"
          ? "bg-error-50 text-error-700"
          : "bg-neutral-100 text-neutral-500";
  const statusLabel = (state: UploadStatus) =>
    state === "uploaded" ? "Uploaded" : state === "picked" ? "Dipilih" : state === "failed" ? "Gagal" : "Belum dipilih";

  const renderStatusPill = (state: UploadStatus) => (
    <div className={["rounded-full px-3 py-1 text-[12px] font-semibold", statusTone(state)].join(" ")}>{statusLabel(state)}</div>
  );

  const renderOcrCard = (slot: UploadSlot) => {
    const inputId = `ocr-upload-${slot.id}`;

    return (
      <div
        key={slot.id}
        className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, "ocr", slot.id)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileIcon />
              <div className="text-[13px] font-semibold text-neutral-800">{slot.label}</div>
              {slot.required ? <span className="rounded-full bg-error-50 px-2 py-0.5 text-[10px] font-semibold text-error-600">Wajib</span> : null}
            </div>
            <div className="mt-1 text-[11px] leading-5 text-neutral-600">{slot.description}</div>
          </div>
          {renderStatusPill(slot.status)}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px] text-neutral-700">{slot.selectedFile ?? "Belum ada file"}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <label htmlFor={inputId} className="cursor-pointer">
                Pilih File
              </label>
            </Button>
            <input
              id={inputId}
              className="hidden"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => handleOcrPick(slot.id, event.target.files?.[0] ?? null)}
            />
            <Button variant="primary" size="sm" onClick={() => handleOcrUpload(slot.id)} disabled={!slot.selectedFile}>
              Upload
            </Button>
            {slot.removable ? (
              <Button variant="ghost" size="sm" onClick={() => handleOcrRemove(slot.id)}>
                <TrashBinTrashIcon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
        {slot.error ? <div className="mt-2 text-[11px] text-error-600">{slot.error}</div> : null}
      </div>
    );
  };

  const uploadDataBarangSection = (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">Upload Data Barang</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-800">Pilih file Excel untuk data barang</div>
          </div>
          {renderStatusPill(excelSlot.status)}
        </div>

        <div className="my-4 border-t border-border-primary" />

        <div className="rounded-[24px] border border-dashed border-border-primary bg-background-primary/20 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background-primary text-brand-primary-600">
                <UploadTemplateIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[18px] font-semibold text-neutral-800">Upload Data Barang</div>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-neutral-600">
                  File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Selected file</div>
                <div className="mt-1 text-[14px] font-semibold text-neutral-800">{excelSlot.selectedFile ?? "Belum ada file"}</div>
                {excelSlot.error ? <div className="mt-1 text-[11px] text-error-600">{excelSlot.error}</div> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm">
                  <label className="cursor-pointer">
                    Pilih File
                    <input
                      className="hidden"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(event) => handleExcelPick(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </Button>
                <Button variant="primary" size="sm" onClick={handleExcelUpload} disabled={!excelSlot.selectedFile}>
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">Upload OCR</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-800">Upload dokumen dasar satu per satu</div>
          </div>
          <div className="rounded-full bg-background-primary px-3 py-1 text-[12px] font-semibold text-brand-primary-700">{uploadedOcrFiles.length} file</div>
        </div>

        <div className="my-4 border-t border-border-primary" />

        <div className="space-y-3">{ocrSlots.map(renderOcrCard)}</div>

        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={addOcrSlot} startIcon={<PlusIcon />}>
            Tambah Dokumen
          </Button>
        </div>
      </section>

      <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4 text-[12px] leading-5 text-neutral-700">{notice}</div>
    </div>
  );

  const uploadTemplateExcelSection = (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">Upload Template Excel</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-800">Pilih file Excel sebagai sumber data utama dan dokumen OCR sebagai pendukung validasi data barang.</div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-brand-primary-600">Download Template Excel</div>
            <div className="mt-2 text-[18px] font-semibold text-neutral-800">Template awal untuk pengisian barang</div>
          </div>
        </div>

        <div className="my-4 border-t border-border-primary" />

        <Button variant="outline" size="sm" asChild>
          <a href={`${BASE_URL}/template-upload-barang.xlsx`} download>
            Download Template Excel
          </a>
        </Button>
      </section>

      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">Upload Template Excel</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-800">Pilih file lalu upload eksplisit</div>
          </div>
          {renderStatusPill(excelSlot.status)}
        </div>

        <div className="my-4 border-t border-border-primary" />

        <div
          className="rounded-[24px] border border-dashed border-border-primary bg-background-primary/20 p-4 sm:p-5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, "excel")}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background-primary text-brand-primary-600">
                <UploadTemplateIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[18px] font-semibold text-neutral-800">Template Excel</div>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-neutral-600">
                  File Excel digunakan sebagai sumber data utama untuk pengisian barang.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Selected file</div>
                <div className="mt-1 text-[14px] font-semibold text-neutral-800">{excelSlot.selectedFile ?? "Belum ada file"}</div>
                {excelSlot.error ? <div className="mt-1 text-[11px] text-error-600">{excelSlot.error}</div> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm">
                  <label className="cursor-pointer">
                    Pilih File
                    <input
                      className="hidden"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(event) => handleExcelPick(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </Button>
                <Button variant="primary" size="sm" onClick={handleExcelUpload} disabled={!excelSlot.selectedFile}>
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border-primary bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">Upload OCR</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-800">Upload dokumen dasar satu per satu</div>
          </div>
          <div className="rounded-full bg-background-primary px-3 py-1 text-[12px] font-semibold text-brand-primary-700">{uploadedOcrFiles.length} file</div>
        </div>

        <div className="my-4 border-t border-border-primary" />

        <div className="space-y-3">{ocrSlots.map(renderOcrCard)}</div>

        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={addOcrSlot} startIcon={<PlusIcon />}>
            Tambah Dokumen
          </Button>
        </div>
      </section>

      <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4 text-[12px] leading-5 text-neutral-700">{notice}</div>
    </div>
  );

  const uploadSection = isTemplateFlow ? uploadTemplateExcelSection : uploadDataBarangSection;

  const parsingSection = (
    <ParsingReviewSection
      parseConfidence={parseConfidence}
      parseConfidenceLabel={parseConfidenceLabel}
      parseConfidenceTone={parseConfidenceTone}
      parseSummaryTone={
        parseConfidence >= 95
          ? "border-success-200 bg-success-50/70 text-success-800"
          : parseConfidence >= 60
            ? "border-amber-200 bg-amber-50/70 text-amber-900"
            : "border-error-200 bg-error-50/70 text-error-800"
      }
      parseConfidenceHint={
        parseConfidence >= 95
          ? "Confidence sudah aman untuk lanjut ke form."
          : parseConfidence >= 60
            ? "Hasil parsing cukup baik, tapi tetap disarankan cek beberapa bagian."
            : "Hasil parsing belum stabil. Sebaiknya parse ulang sebelum lanjut."
      }
      rows={parseRows}
      barangCount={parseRows.length}
      supportCount={uploadedOcrFiles.length}
      mappedFields={parseConfidence >= 95 ? 18 : parseConfidence >= 60 ? 12 : 0}
      onReparse={handleReparse}
      onOpenRow={(row) =>
        setSelectedParseRow({
          ...row,
          source: { ...row.source, kind: row.source.fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image" },
        })
      }
    />
  );

  const title =
    stage === "upload"
      ? isTemplateFlow
        ? "Upload Template Excel"
        : "Upload Data Barang"
      : "Ringkasan hasil AI dan sumber data";
  const subtitle =
    stage === "upload"
      ? isTemplateFlow
        ? "Pilih file Excel sebagai sumber data utama dan dokumen OCR sebagai pendukung validasi data barang."
        : "Pilih file Excel untuk data barang."
      : "AI akan membaca file yang diunggah, lalu menyiapkan data untuk auto fill sebelum masuk ke form.";
  const primaryDisabled = stage === "upload" && hasPendingUploads;
  const eyebrowLabel = stage === "upload" ? (isTemplateFlow ? "UPLOAD TEMPLATE EXCEL" : "UPLOAD DATA BARANG") : "DATA PARSING";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">{eyebrowLabel}</div>
          <h3 className="mt-1 text-[24px] font-semibold text-neutral-800">{title}</h3>
          <p className="mt-1 max-w-3xl text-[12px] text-neutral-600 sm:text-[13px]">{subtitle}</p>
          {context?.documentType && (
            <div className="mt-3 inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
              Jenis dokumen: {context.documentType}
            </div>
          )}
          {context?.copyRow && (
            <div className="mt-3 inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
              Salin dari: {context.copyRow.nomor} - {context.copyRow.dokumen}
            </div>
          )}
          {context?.copyGroups?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {context.copyGroups.map((group) => (
                <span key={group} className="rounded-full bg-background-primary px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                  {copyDataLeafLookup.get(group)?.title ?? copyDataGroupLookup.get(group)?.title ?? group}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">{stage === "upload" ? uploadSection : parsingSection}</div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={handleBackAction}>
              {stage === "upload" ? "Kembali" : "Kembali ke Upload"}
            </Button>

            <div className="flex items-center gap-3">
              {stage === "upload" ? (
                <>
                  <Button variant="outline" size="sm" onClick={finishUploadFlow}>
                    Lewati Upload
                  </Button>
                  <Button variant="primary" size="sm" onClick={goToParsing} disabled={primaryDisabled}>
                    Lanjut ke Data Parsing
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={finishUploadFlow}>
                  Lanjut ke Form
                </Button>
              )}
              <button type="button" onClick={handleDismissRequest} className="insw-btn insw-btn--outline insw-btn--sm">
                <span className="inline-flex shrink-0 items-center justify-center">
                  <CloseIcon />
                </span>
                <span className="min-w-0">Batal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {dismissConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
              <div className="w-full max-w-[520px] rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.35)]">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-500/10 text-error-600">
                    <CloseIcon />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-neutral-800">Konfirmasi keluar?</h3>
                    <p className="mt-1 text-[12px] leading-5 text-neutral-600">
                      Data parsing sudah tersedia. Apakah Anda yakin ingin keluar dari proses ini?
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" size="sm" onClick={() => setDismissConfirmOpen(false)}>
                    Tidak
                  </Button>
                  <Button variant="error" size="sm" onClick={handleConfirmExit}>
                    Ya
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {selectedParseRow && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
          onClick={(event) => event.target === event.currentTarget && setSelectedParseRow(null)}
        >
          <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Tutup preview detail"
              onClick={() => setSelectedParseRow(null)}
            >
              <CloseIcon />
            </button>

            <div className="border-b border-border-primary px-5 py-5 pr-16 sm:px-8">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Detail Mapping</div>
              <h3 className="mt-1 text-[24px] font-semibold text-neutral-800">Seri {selectedParseRow.seri}</h3>
              <p className="mt-1 max-w-3xl text-[12px] text-neutral-600 sm:text-[13px]">
                Lihat data barang yang dipetakan AI beserta sumber OCR yang dipakai untuk baris ini.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Data Barang</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">Hasil parse untuk seri {selectedParseRow.seri}</div>
                  </div>

                  <div className="mt-4 grid gap-2 text-[12px]">
                    {[
                      { label: "Seri", value: selectedParseRow.seri },
                      { label: "Uraian Barang", value: selectedParseRow.uraian },
                      { label: "HS Code", value: selectedParseRow.hsCode },
                      { label: "Qty", value: selectedParseRow.quantity },
                      { label: "Sumber", value: selectedParseRow.source.label },
                      { label: "File", value: selectedParseRow.source.fileName },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-border-primary px-3 py-2">
                        <span className="text-neutral-600">{item.label}</span>
                        <span className="text-right font-semibold text-neutral-800">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-brand-primary-100 bg-brand-primary-50/70 p-3 text-[12px] leading-5 text-brand-primary-800">
                    Confidence parsing global: <span className="font-semibold">{parseConfidence}%</span> {parseConfidenceLabel}
                  </div>
                </section>

                <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                  <div className="border-b border-border-primary pb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Preview Sumber OCR</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedParseRow.source.label}</div>
                  </div>

                  <div className="mt-4 h-[520px] overflow-hidden rounded-2xl border border-border-primary bg-background-primary/30">
                    {selectedParseRow.source.kind === "pdf" ? (
                      <Worker workerUrl={PDF_WORKER_URL}>
                        <Viewer fileUrl={`${SAMPLE_DRAFT_PDF}?v=${parseRevision}`} />
                      </Worker>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 shadow-sm">
                          <FileIcon />
                        </div>
                        <div className="mt-4 text-[14px] font-semibold text-neutral-800">{selectedParseRow.source.fileName}</div>
                        <p className="mt-2 max-w-sm text-[12px] leading-5 text-neutral-600">
                          Preview visual sumber ada pada dokumen OCR yang dipakai AI untuk memetakan baris ini.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-border-primary px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-neutral-600">Tutup detail untuk kembali ke tabel mapping.</div>
                <Button variant="outline" size="sm" onClick={() => setSelectedParseRow(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
