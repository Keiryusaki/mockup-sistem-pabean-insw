import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { Button } from "../../components/Button";
import {
  ACTIVITY_OPTIONS,
  ANALYSIS_CHECKLIST,
  INITIAL_PROMPT,
  STEP_LABELS,
  TRIAGE_QUESTION,
  buildAiDraftFromAnalysis,
  getActivityLabel,
  getAnalysisResult,
  getAnswerLabel,
  getBranchChoice,
  getQuestionFlow,
  toSubmissionDraft,
  type ActivityChoice,
  type AiDraft,
  type AiSubmissionDraft,
  type ConversationMessage,
  type FlowQuestion,
  type WizardStep,
} from "./aiWizardData";
import {
  buildUploadNotice,
  createDefaultOcrSlots,
  createUploadSlot,
  OCR_UPLOAD_DEFAULTS,
  type UploadSlot,
} from "./submissionLauncherData";
import { ParsingReviewSection, type ParsingReviewRow } from "./ParsingReviewSection";
import { useAiWizardSession } from "./useAiWizardSession";
import { ModalCancelButton } from "./SubmissionModalShared";

type AiWizardSnapshot = {
  stage: WizardStep;
  selectedActivity: ActivityChoice | null;
  branchActivity: Exclude<ActivityChoice, "tidak_yakin"> | null;
  questionIndex: number;
  answers: Record<string, string | string[]>;
  messages: ConversationMessage[];
  analysisReady: boolean;
  docSelection: string[];
  pdfStatus: "loading" | "ready" | "missing";
  pdfRevision: number;
};

const AI_DRAFT_STORAGE_KEY = "insw-ai-submission-draft";
const AI_WIZARD_STORAGE_KEY = "insw-smart-submission-assistant-draft";
const BASE_URL = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
const SAMPLE_DRAFT_PDF = `${BASE_URL}/sample-smart-draft.pdf`;
const PDF_WORKER_URL = pdfWorkerUrl;

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M12 3.5A1.5 1.5 0 0 1 13.5 5v1H16a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4h2.5V5A1.5 1.5 0 0 1 12 3.5Zm-1 3.5V6h2v1h-2Zm-2 3.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm6 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM9 15c0-1.1 1.34-2 3-2s3 .9 3 2H9Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M14 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8l-6-6Zm1 7V4.5L19.5 9H15a.5.5 0 0 1-.5-.5ZM8 12h8v1.5H8V12Zm0 3h8v1.5H8V15Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M12 3 7.5 7.5l1.4 1.4L11 6.8V16h2V6.8l2.1 2.1 1.4-1.4L12 3ZM5 19h14v2H5v-2Z" />
    </svg>
  );
}

function PlusSmallIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

export function AiStepModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: AiSubmissionDraft) => void;
}) {
  const {
    stage,
    selectedActivity,
    branchActivity,
    questionIndex,
    answers,
    messages,
    analysisReady,
    docSelection,
    excelSlot,
    ocrSlots,
    customCounter,
    selectedParseRow,
    parseRevision,
    pdfStatus,
    pdfRevision,
    previewOpen,
    dismissConfirmOpen,
    scrollContainerRef,
    draftPdfUrl,
    renderPdfToolbar,
    uploadedFiles,
    activeQuestion,
    analysis,
    requiredDocuments,
    requiredDocumentsKey,
    smartDraft,
    stepIndex,
    parseSources,
    parseRows,
    parseConfidence,
    parseConfidenceLabel,
    notice,
    selectedParseFile,
    setPreviewOpen,
    setSelectedParseRow,
    setParseRevision,
    setDismissConfirmOpen,
    setDocSelection,
    setStage,
    setPdfRevision,
    setPdfStatus,
    setAnswers,
    setMessages,
    setAnalysisReady,
    setSelectedActivity,
    setBranchActivity,
    setQuestionIndex,
    setExcelSlot,
    setOcrSlots,
    setCustomCounter,
    handleSingleSelect,
    handleMultiToggle,
    confirmMultiSelection,
    beginActivity,
    handleExcelPick,
    handleExcelUpload,
    handleOcrPick,
    handleOcrUpload,
    addOcrSlot,
    resetConversation,
    handleDismissRequest,
    handleConfirmExit,
    handleContinue,
    handleContinueToParsing,
  } = useAiWizardSession({ open, onClose, onSubmit });

  if (!open) return null;

  const renderMessage = (message: ConversationMessage, index: number) =>
    message.role === "assistant" ? (
      <div key={`${message.role}-${index}`} className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600 shadow-sm">
          <BotIcon />
        </div>
        <div className="max-w-[680px] rounded-2xl rounded-tl-md border border-border-primary bg-white px-4 py-3 text-[12px] leading-6 text-neutral-800 shadow-sm">
          {message.text}
        </div>
      </div>
    ) : (
      <div key={`${message.role}-${index}`} className="flex justify-end">
        <div className="max-w-[680px] rounded-2xl rounded-tr-md bg-brand-primary-500 px-4 py-3 text-[12px] leading-6 text-white shadow-sm">
          {message.text}
        </div>
      </div>
    );

  const uploadStatusTone =
    excelSlot.status === "uploaded"
      ? "bg-success-50 text-success-700"
      : excelSlot.status === "picked"
        ? "bg-brand-primary-50 text-brand-primary-700"
        : excelSlot.status === "failed"
          ? "bg-error-50 text-error-700"
          : "bg-neutral-100 text-neutral-500";
  const uploadStatusLabel =
    excelSlot.status === "uploaded" ? "Uploaded" : excelSlot.status === "picked" ? "Dipilih" : excelSlot.status === "failed" ? "Gagal" : "Belum dipilih";
  const selectedUploadSlots = [excelSlot, ...ocrSlots].filter((slot) => slot.status !== "empty");
  const hasPendingUploads = selectedUploadSlots.some((slot) => slot.status === "picked" || slot.status === "failed");
  const canContinueToParsing = selectedUploadSlots.length > 0 && selectedUploadSlots.every((slot) => slot.status === "uploaded") && !hasPendingUploads;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
        <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.28)] sm:max-h-[calc(100vh-3rem)]">
          <div className="border-b border-border-primary px-5 py-5 sm:px-8">
            <div className="flex items-start gap-3 pr-12">
              <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-500">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v6h5v2h-7V7h2Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[24px] font-semibold text-neutral-800">Smart Submission Assistant</h3>
                <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">
                  Asisten cerdas untuk membantu Anda menentukan jenis pengajuan yang tepat.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              {STEP_LABELS.map((step, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <div key={step.key} className="relative flex flex-col items-center">
                    {index < STEP_LABELS.length - 1 && <div className="absolute left-1/2 top-5 h-px w-[calc(100%+0.75rem)] bg-border-primary" />}
                    <div className={["relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-[12px] font-semibold", active || done ? "border-brand-primary-500 bg-brand-primary-500 text-white" : "border-border-primary bg-white text-neutral-500"].join(" ")}>
                      {done ? "✓" : step.icon}
                    </div>
                    <div className={["mt-2 text-center text-[11px] font-medium sm:text-[12px]", active || done ? "text-brand-primary-700" : "text-neutral-500"].join(" ")}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
            <div className="flex flex-col gap-4">
              {messages.map(renderMessage)}

              {stage === "identifikasi" && !analysisReady && !activeQuestion && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {ACTIVITY_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => beginActivity(option.key)}
                      className="group rounded-2xl border border-border-primary bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md"
                    >
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-500 transition-colors group-hover:bg-brand-primary-500 group-hover:text-white">
                        <PlusSmallIcon />
                      </div>
                      <div className="mt-4 text-[14px] font-semibold text-neutral-800">{option.title}</div>
                      <p className="mt-2 text-[12px] leading-5 text-neutral-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {stage === "identifikasi" && !analysisReady && activeQuestion && (
                <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                    {selectedActivity === "tidak_yakin" && !branchActivity ? "Triage Identifikasi" : "Pertanyaan Identifikasi"}
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-neutral-800">{activeQuestion.prompt}</div>

                  {!activeQuestion.multi ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {activeQuestion.options.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleSingleSelect(option.key)}
                          className="rounded-2xl border border-border-primary bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md"
                        >
                          <div className="text-[14px] font-semibold text-neutral-800">{option.label}</div>
                          {option.description && <div className="mt-2 text-[12px] leading-5 text-neutral-600">{option.description}</div>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {activeQuestion.options.map((option) => {
                          const selected = docSelection.includes(option.key);
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleMultiToggle(option.key)}
                              className={["rounded-2xl border p-4 text-left shadow-sm transition-all", selected ? "border-brand-primary-500 bg-brand-primary-50" : "border-border-primary bg-white hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-md"].join(" ")}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[14px] font-semibold text-neutral-800">{option.label}</div>
                                <div className={["inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold", selected ? "border-brand-primary-500 bg-brand-primary-500 text-white" : "border-border-primary text-transparent"].join(" ")}>
                                  ✓
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                        <Button variant="outline" size="sm" onClick={() => setDocSelection([])}>
                          Reset Pilihan
                        </Button>
                        <Button variant="primary" size="sm" onClick={confirmMultiSelection}>
                          Lanjut
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stage === "identifikasi" && analysisReady && analysis && (
                <div className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Analisis Identifikasi</div>
                      <h4 className="mt-1 text-[18px] font-semibold text-neutral-800">{analysis.jenisPengajuan}</h4>
                      <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-700">{analysis.rekomendasi}</p>
                    </div>
                    <div className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-600">
                      Selesai
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-border-primary bg-background-primary/50 p-4">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Progress Analisis</div>
                      <div className="mt-3 space-y-2">
                        {ANALYSIS_CHECKLIST.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-[12px] text-neutral-800">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-300/25 text-success-600">
                              ✓
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border-primary bg-background-primary/50 p-4">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Ringkasan Identifikasi</div>
                      <div className="mt-2 text-[12px] leading-6 text-neutral-800">{analysis.ringkasan}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/50 p-4">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-brand-primary-600">Dokumen yang perlu diunggah</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {requiredDocuments.map((document) => (
                        <span key={document} className="rounded-full border border-brand-primary-100 bg-white px-3 py-1 text-[12px] font-medium text-brand-primary-700">
                          {document}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={resetConversation}>
                      Ubah Jawaban
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleContinue}>
                      Lewati Upload Dokumen
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setStage("dokumen")}>
                      Lanjut ke Upload Dokumen
                    </Button>
                  </div>
                </div>
              )}

              {stage === "dokumen" && (
                <div className="space-y-4">
                  <section className="rounded-[24px] border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[12px] uppercase tracking-[0.18em] text-brand-primary-600">Upload Data Barang</div>
                        <div className="mt-2 text-[20px] font-semibold text-neutral-800">Pilih file Excel untuk data barang</div>
                      </div>
                      <div className={["rounded-full px-3 py-1 text-[12px] font-semibold", uploadStatusTone].join(" ")}>{uploadStatusLabel}</div>
                    </div>

                    <div className="my-4 border-t border-border-primary" />

                    <div
                      className="rounded-[24px] border border-dashed border-border-primary bg-background-primary/20 p-4 sm:p-5"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0] ?? null;
                        if (file) handleExcelPick(file);
                      }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background-primary text-brand-primary-600">
                            <UploadIcon />
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
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
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

                  <section className="rounded-[24px] border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[12px] uppercase tracking-[0.18em] text-brand-primary-600">Upload OCR</div>
                        <div className="mt-2 text-[20px] font-semibold text-neutral-800">Upload dokumen dasar satu per satu</div>
                      </div>
                    </div>

                    <div className="my-4 border-t border-border-primary" />

                    <div className="space-y-3">
                      {ocrSlots.map((slot) => {
                        const inputId = `ai-ocr-upload-${slot.id}`;
                        const slotStatusTone =
                          slot.status === "uploaded"
                            ? "bg-success-50 text-success-700"
                            : slot.status === "picked"
                              ? "bg-brand-primary-50 text-brand-primary-700"
                              : slot.status === "failed"
                                ? "bg-error-50 text-error-700"
                                : "bg-neutral-100 text-neutral-500";
                        const slotStatusLabel = slot.status === "uploaded" ? "Uploaded" : slot.status === "picked" ? "Dipilih" : slot.status === "failed" ? "Gagal" : "Belum dipilih";

                        return (
                          <div
                            key={slot.id}
                            className="rounded-[20px] border border-border-primary bg-white p-4 shadow-sm"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              const file = event.dataTransfer.files?.[0] ?? null;
                              if (file) handleOcrPick(slot.id, file);
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background-primary text-brand-primary-600">
                                    <FileIcon />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-semibold text-neutral-800">{slot.label}</div>
                                    <div className="mt-1 text-[12px] leading-5 text-neutral-600">{slot.description}</div>
                                  </div>
                                  {slot.required ? (
                                    <span className="rounded-full bg-error-50 px-2 py-0.5 text-[10px] font-semibold text-error-600">Wajib</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className={["rounded-full px-3 py-1 text-[12px] font-semibold", slotStatusTone].join(" ")}>{slotStatusLabel}</div>
                            </div>

                            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Selected file</div>
                                <div className="mt-1 text-[14px] font-semibold text-neutral-800">{slot.selectedFile ?? "Belum ada file"}</div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <label htmlFor={inputId} className="cursor-pointer">
                                    Pilih File
                                  </label>
                                </Button>
                                <input
                                  id={inputId}
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  className="hidden"
                                  onChange={(event) => handleOcrPick(slot.id, event.target.files?.[0] ?? null)}
                                />
                                <Button variant="primary" size="sm" onClick={() => handleOcrUpload(slot.id)} disabled={!slot.selectedFile}>
                                  Upload
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={addOcrSlot} startIcon={<PlusSmallIcon />}>
                        Tambah Dokumen
                      </Button>
                    </div>
                  </section>

                  <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-4 text-[12px] leading-5 text-neutral-700">{notice}</div>

                  <div className="rounded-[20px] border border-border-primary bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Button variant="outline" size="sm" onClick={handleContinue}>
                        Lewati
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleContinueToParsing} disabled={!canContinueToParsing}>
                        Lanjut ke Data Parsing
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {stage === "parsing" && (
                <ParsingReviewSection
                  parseConfidence={parseConfidence}
                  parseConfidenceLabel={parseConfidenceLabel}
                  parseConfidenceTone={parseConfidence >= 95 ? "border-success-200 bg-success-50 text-success-700" : parseConfidence >= 60 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-error-200 bg-error-50 text-error-700"}
                  parseSummaryTone={parseConfidence >= 95 ? "border-success-200 bg-success-50/70 text-success-800" : parseConfidence >= 60 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-error-200 bg-error-50/70 text-error-800"}
                  parseConfidenceHint={
                    parseConfidence >= 95
                      ? "Confidence sudah aman untuk lanjut ke form."
                      : parseConfidence >= 60
                        ? "Hasil parsing cukup baik, tapi tetap disarankan cek beberapa bagian."
                        : "Hasil parsing belum stabil. Sebaiknya parse ulang sebelum lanjut."
                  }
                  rows={parseRows as ParsingReviewRow[]}
                  barangCount={parseRows.length}
                  supportCount={uploadedFiles.length ? 1 : 0}
                  mappedFields={parseConfidence >= 95 ? 18 : parseConfidence >= 60 ? 12 : 0}
                  onReparse={() => setParseRevision((current) => current + 1)}
                  onOpenRow={(row) =>
                    setSelectedParseRow({
                      seri: row.seri,
                      uraian: row.uraian,
                      hsCode: row.hsCode,
                      quantity: row.quantity,
                      source: {
                        id: row.source.id ?? row.seri,
                        ...row.source,
                        kind: row.source.kind ?? (row.source.fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image"),
                      },
                    })
                  }
                />
              )}
            </div>
          </div>

          <div className="border-t border-border-primary bg-[#f8fbff] px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 text-[12px] text-neutral-600">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-600">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v6h5v2h-7V7h2Z" />
                  </svg>
                </span>
                <span>Data Anda aman dan hanya digunakan untuk keperluan pengajuan.</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ModalCancelButton onClick={handleDismissRequest} />
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
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6" onClick={(event) => event.target === event.currentTarget && setSelectedParseRow(null)}>
            <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]">
              <button type="button" className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900" aria-label="Tutup preview detail" onClick={() => setSelectedParseRow(null)}>
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
    </>
  );
}
