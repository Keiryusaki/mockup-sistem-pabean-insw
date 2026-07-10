import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { buildUploadNotice, createDefaultOcrSlots, createUploadSlot, OCR_UPLOAD_DEFAULTS, type UploadSlot } from "./submissionLauncherData";
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

type ParseSourcePreview = {
  id: string;
  label: string;
  fileName: string;
  kind: "pdf" | "image" | "spreadsheet";
};

type ParseMappingRow = {
  seri: string;
  uraian: string;
  hsCode: string;
  quantity: string;
  source: ParseSourcePreview;
};

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

type AiWizardSession = {
  stage: WizardStep;
  selectedActivity: ActivityChoice | null;
  branchActivity: Exclude<ActivityChoice, "tidak_yakin"> | null;
  questionIndex: number;
  answers: Record<string, string | string[]>;
  messages: ConversationMessage[];
  analysisReady: boolean;
  docSelection: string[];
  excelSlot: UploadSlot;
  ocrSlots: UploadSlot[];
  customCounter: number;
  selectedParseRow: ParseMappingRow | null;
  parseRevision: number;
  pdfStatus: "loading" | "ready" | "missing";
  pdfRevision: number;
  previewOpen: boolean;
  dismissConfirmOpen: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  draftPdfUrl: string;
  renderPdfToolbar: ReturnType<typeof createRenderPdfToolbar>;
  uploadedFiles: string[];
  activeQuestion: FlowQuestion | null;
  analysis: ReturnType<typeof getAnalysisResult> | null;
  requiredDocuments: string[];
  requiredDocumentsKey: string;
  smartDraft: AiDraft | null;
  stepIndex: number;
  parseSources: ParseSourcePreview[];
  parseRows: ParseMappingRow[];
  parseConfidence: number;
  parseConfidenceLabel: string;
  notice: string;
  selectedParseFile: ParseSourcePreview | undefined;
  setPreviewOpen: (value: boolean) => void;
  setSelectedParseRow: (value: ParseMappingRow | null) => void;
  setParseRevision: Dispatch<SetStateAction<number>>;
  setDismissConfirmOpen: (value: boolean) => void;
  setDocSelection: Dispatch<SetStateAction<string[]>>;
  setStage: Dispatch<SetStateAction<WizardStep>>;
  setPdfRevision: Dispatch<SetStateAction<number>>;
  setPdfStatus: Dispatch<SetStateAction<"loading" | "ready" | "missing">>;
  setAnswers: Dispatch<SetStateAction<Record<string, string | string[]>>>;
  setMessages: Dispatch<SetStateAction<ConversationMessage[]>>;
  setAnalysisReady: Dispatch<SetStateAction<boolean>>;
  setSelectedActivity: Dispatch<SetStateAction<ActivityChoice | null>>;
  setBranchActivity: Dispatch<SetStateAction<Exclude<ActivityChoice, "tidak_yakin"> | null>>;
  setQuestionIndex: Dispatch<SetStateAction<number>>;
  setExcelSlot: Dispatch<SetStateAction<UploadSlot>>;
  setOcrSlots: Dispatch<SetStateAction<UploadSlot[]>>;
  setCustomCounter: Dispatch<SetStateAction<number>>;
  handleSingleSelect: (value: string) => void;
  handleMultiToggle: (value: string) => void;
  confirmMultiSelection: () => void;
  beginActivity: (choice: ActivityChoice) => void;
  handleExcelPick: (file: File | null) => void;
  handleExcelUpload: () => void;
  handleOcrPick: (slotId: string, file: File | null) => void;
  handleOcrUpload: (slotId: string) => void;
  addOcrSlot: () => void;
  resetConversation: () => void;
  handleDismissRequest: () => void;
  handleConfirmExit: () => void;
  handleContinue: () => void;
  handleContinueToParsing: () => void;
};

const AI_DRAFT_STORAGE_KEY = "insw-ai-submission-draft";
const AI_WIZARD_STORAGE_KEY = "insw-smart-submission-assistant-draft";
const BASE_URL = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
const SAMPLE_DRAFT_PDF = `${BASE_URL}/sample-smart-draft.pdf`;

function createRenderPdfToolbar() {
  return () => null;
}

export function useAiWizardSession({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: AiSubmissionDraft) => void;
}): AiWizardSession {
  const [stage, setStage] = useState<WizardStep>("identifikasi");
  const [selectedActivity, setSelectedActivity] = useState<ActivityChoice | null>(null);
  const [branchActivity, setBranchActivity] = useState<Exclude<ActivityChoice, "tidak_yakin"> | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [messages, setMessages] = useState<ConversationMessage[]>([{ role: "assistant", text: INITIAL_PROMPT }]);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [docSelection, setDocSelection] = useState<string[]>([]);
  const [excelSlot, setExcelSlot] = useState<UploadSlot>(() =>
    createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true),
  );
  const [ocrSlots, setOcrSlots] = useState<UploadSlot[]>(() => createDefaultOcrSlots());
  const [customCounter, setCustomCounter] = useState(1);
  const [selectedParseRow, setSelectedParseRow] = useState<ParseMappingRow | null>(null);
  const [parseRevision, setParseRevision] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [pdfRevision, setPdfRevision] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const draftPdfUrl = `${SAMPLE_DRAFT_PDF}?v=${pdfRevision}`;
  const renderPdfToolbar = useMemo(() => createRenderPdfToolbar(), []);
  const uploadedExcelFiles = excelSlot.uploadedFile ? [excelSlot.uploadedFile] : [];
  const uploadedOcrFiles = ocrSlots.filter((slot) => slot.uploadedFile).map((slot) => slot.uploadedFile as string);
  const uploadedFiles = [...uploadedExcelFiles, ...uploadedOcrFiles];
  const activeQuestion = useMemo<FlowQuestion | null>(() => {
    if (selectedActivity === "tidak_yakin" && !branchActivity) return TRIAGE_QUESTION;
    if (!branchActivity) return null;
    return getQuestionFlow(branchActivity)[questionIndex] ?? null;
  }, [branchActivity, questionIndex, selectedActivity]);
  const analysis = branchActivity ? getAnalysisResult(branchActivity, answers) : null;
  const requiredDocuments = analysis?.dokumenWajib ?? OCR_UPLOAD_DEFAULTS.map((item) => item.label);
  const requiredDocumentsKey = requiredDocuments.join("|");
  const smartDraft = useMemo(
    () => (branchActivity ? buildAiDraftFromAnalysis(branchActivity, answers, uploadedFiles) : null),
    [answers, branchActivity, uploadedFiles],
  );
  const stepIndex = STEP_LABELS.findIndex((step) => step.key === stage);
  const parseSources = useMemo<ParseSourcePreview[]>(() => {
    if (uploadedFiles.length > 0) {
      return uploadedFiles.map((fileName, index) => ({
        id: `source-${index + 1}`,
        label: index === 0 ? "Data Barang" : `OCR ${index}`,
        fileName,
        kind: fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
      }));
    }
    return [
      { id: "ocr-a", label: "OCR A", fileName: "ocr-sumber-a.pdf", kind: "pdf" },
      { id: "ocr-b", label: "OCR B", fileName: "ocr-sumber-b.png", kind: "image" },
    ];
  }, [uploadedFiles]);
  const parseRows = useMemo<ParseMappingRow[]>(() => {
    const sourceA = parseSources[0];
    const sourceB = parseSources[1] ?? sourceA;
    return [
      { seri: "1", uraian: "Barang contoh A", hsCode: "8471.30.10", quantity: "10", source: sourceA },
      { seri: "2", uraian: "Barang contoh B", hsCode: "8471.30.90", quantity: "4", source: sourceA },
      { seri: "3", uraian: "Barang contoh C", hsCode: "8504.40.90", quantity: "8", source: sourceA },
      { seri: "4", uraian: "Barang contoh D", hsCode: "3923.10.90", quantity: "12", source: sourceB },
      { seri: "5", uraian: "Barang contoh E", hsCode: "7326.90.99", quantity: "2", source: sourceB },
    ];
  }, [parseSources]);
  const parseConfidence = useMemo(() => {
    if (!uploadedFiles.length) return 0;
    return Math.min(99, 84 + uploadedFiles.length * 3 + parseRevision * 2);
  }, [parseRevision, uploadedFiles.length]);
  const parseConfidenceLabel =
    parseConfidence >= 95 ? "Aman" : parseConfidence >= 60 ? "Perlu dicek" : parseConfidence > 0 ? "Wajib review" : "Menunggu upload";
  const notice = buildUploadNotice(uploadedFiles.slice(0, 1), uploadedFiles.slice(1));
  const selectedParseFile = selectedParseRow?.source;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setStage("identifikasi");
      setSelectedActivity(null);
      setBranchActivity(null);
      setQuestionIndex(0);
      setAnswers({});
      setMessages([{ role: "assistant", text: INITIAL_PROMPT }]);
      setAnalysisReady(false);
      setDocSelection([]);
      setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
      setOcrSlots(createDefaultOcrSlots());
      setCustomCounter(1);
      setPdfStatus("loading");
      setPdfRevision(0);
      setPreviewOpen(false);
      setDismissConfirmOpen(false);
      setSelectedParseRow(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "dokumen") return;
    setOcrSlots((current) => {
      const requiredSlots = requiredDocuments.map((document, index) => {
        const existing = current[index];
        if (existing) {
          return { ...existing, label: document, description: "Dokumen dasar untuk membantu identifikasi dan validasi data barang.", required: true, removable: false };
        }
        return createUploadSlot(`ocr-${index}-${Date.now()}`, document, "Dokumen dasar untuk membantu identifikasi dan validasi data barang.", true);
      });
      const customSlots = current.filter((slot, index) => index >= requiredDocuments.length && slot.removable);
      return [...requiredSlots, ...customSlots];
    });
  }, [open, requiredDocumentsKey, stage]);

  useEffect(() => {
    if (!open) return;
    const stored = sessionStorage.getItem(AI_WIZARD_STORAGE_KEY);
    if (!stored) return;
    try {
      const snapshot = JSON.parse(stored) as AiWizardSnapshot;
      setStage(snapshot.stage ?? "identifikasi");
      setSelectedActivity(snapshot.selectedActivity ?? null);
      setBranchActivity(snapshot.branchActivity ?? null);
      setQuestionIndex(snapshot.questionIndex ?? 0);
      setAnswers(snapshot.answers ?? {});
      setMessages(snapshot.messages?.length ? snapshot.messages : [{ role: "assistant", text: INITIAL_PROMPT }]);
      setAnalysisReady(Boolean(snapshot.analysisReady));
      setDocSelection(snapshot.docSelection ?? []);
      setPdfStatus(snapshot.pdfStatus ?? "loading");
      setPdfRevision(snapshot.pdfRevision ?? 0);
    } catch {
      sessionStorage.removeItem(AI_WIZARD_STORAGE_KEY);
    }
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "parsing") return;
    let active = true;
    setPdfStatus("loading");
    fetch(SAMPLE_DRAFT_PDF, { method: "HEAD" })
      .then((response) => {
        if (!active) return;
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        setPdfStatus(response.ok && contentType.includes("pdf") ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setPdfStatus("missing");
      });
    return () => {
      active = false;
    };
  }, [open, pdfRevision, stage]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [analysisReady, messages, stage, uploadedFiles]);

  useLayoutEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  const pushMessage = (message: ConversationMessage) => setMessages((current) => [...current, message]);
  const resetConversation = () => {
    setStage("identifikasi");
    setSelectedActivity(null);
    setBranchActivity(null);
    setQuestionIndex(0);
    setAnswers({});
    setMessages([{ role: "assistant", text: INITIAL_PROMPT }]);
    setAnalysisReady(false);
    setDocSelection([]);
    setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setPdfStatus("loading");
    setPdfRevision(0);
    setPreviewOpen(false);
  };
  const handleDismissRequest = () => {
    if (stage === "parsing") {
      setDismissConfirmOpen(true);
      return;
    }
    onClose();
  };
  const handleConfirmExit = () => {
    setDismissConfirmOpen(false);
    onClose();
  };
  const persistWizardSnapshot = () => {
    const snapshot: AiWizardSnapshot = {
      stage,
      selectedActivity,
      branchActivity,
      questionIndex,
      answers,
      messages,
      analysisReady,
      docSelection,
      pdfStatus,
      pdfRevision,
    };
    sessionStorage.setItem(AI_WIZARD_STORAGE_KEY, JSON.stringify(snapshot));
  };
  const handleSingleSelect = (value: string) => {
    if (!activeQuestion) return;
    const nextAnswers = { ...answers, [activeQuestion.id]: value };
    setAnswers(nextAnswers);
    pushMessage({ role: "user", text: getAnswerLabel(activeQuestion, value) });
    if (activeQuestion.id === "triage") {
      const selectedBranch = getBranchChoice(value);
      if (!selectedBranch) return;
      setSelectedActivity(selectedBranch);
      setBranchActivity(selectedBranch);
      setQuestionIndex(0);
      setMessages((current) => [...current, { role: "assistant", text: getQuestionFlow(selectedBranch)[0].prompt }]);
      return;
    }
    if (!branchActivity) return;
    const flow = getQuestionFlow(branchActivity);
    if (questionIndex + 1 < flow.length) {
      setQuestionIndex((current) => current + 1);
      setMessages((current) => [...current, { role: "assistant", text: flow[questionIndex + 1].prompt }]);
      return;
    }
    setAnalysisReady(true);
    setMessages((current) => [...current, { role: "assistant", text: "Baik, saya sudah mengolah jawaban Anda." }]);
  };
  const handleMultiToggle = (value: string) => {
    setDocSelection((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };
  const confirmMultiSelection = () => {
    if (!activeQuestion?.multi || !branchActivity) return;
    const nextAnswers = { ...answers, [activeQuestion.id]: docSelection };
    setAnswers(nextAnswers);
    pushMessage({ role: "user", text: docSelection.length ? getAnswerLabel(activeQuestion, docSelection) : "Belum ada dokumen yang dipilih" });
    const flow = getQuestionFlow(branchActivity);
    if (questionIndex + 1 < flow.length) {
      setQuestionIndex((current) => current + 1);
      setMessages((current) => [...current, { role: "assistant", text: flow[questionIndex + 1].prompt }]);
      return;
    }
    setAnalysisReady(true);
  };
  const beginActivity = (choice: ActivityChoice) => {
    const nextBranch = choice === "tidak_yakin" ? null : choice;
    const initialQuestion = choice === "tidak_yakin" ? TRIAGE_QUESTION : getQuestionFlow(choice)[0];
    setStage("identifikasi");
    setSelectedActivity(choice);
    setBranchActivity(nextBranch);
    setQuestionIndex(0);
    setAnswers({});
    setAnalysisReady(false);
    setDocSelection([]);
    setExcelSlot(createUploadSlot("excel", "Upload Data Barang", "File Excel digunakan sebagai sumber data utama untuk pengisian barang secara langsung.", true));
    setOcrSlots(createDefaultOcrSlots());
    setCustomCounter(1);
    setMessages([
      { role: "assistant", text: INITIAL_PROMPT },
      { role: "user", text: getActivityLabel(choice) },
      { role: "assistant", text: initialQuestion.prompt },
    ]);
  };
  const handleExcelPick = (file: File | null) => {
    setExcelSlot((current) => (file ? { ...current, selectedFile: file.name, status: "picked", error: null } : { ...current, selectedFile: null, uploadedFile: null, status: "empty", error: null }));
  };
  const handleExcelUpload = () => {
    setExcelSlot((current) => {
      if (!current.selectedFile) return { ...current, status: "failed", error: "Pilih file Excel dulu." };
      return { ...current, uploadedFile: current.selectedFile, status: "uploaded", error: null };
    });
  };
  const handleOcrPick = (slotId: string, file: File | null) => {
    setOcrSlots((current) =>
      current.map((slot) => (slot.id !== slotId ? slot : file ? { ...slot, selectedFile: file.name, status: "picked", error: null } : { ...slot, selectedFile: null, uploadedFile: null, status: "empty", error: null })),
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
  const addOcrSlot = () => {
    setCustomCounter((current) => current + 1);
    setOcrSlots((current) => [
      ...current,
      createUploadSlot(`custom-${Date.now()}`, `Dokumen tambahan ${customCounter + 1}`, "Tambahkan dokumen OCR lain yang perlu diunggah.", false, true),
    ]);
  };
  const handleContinue = () => {
    if (!smartDraft) return;
    const submissionDraft = toSubmissionDraft(smartDraft);
    sessionStorage.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify(submissionDraft));
    sessionStorage.removeItem(AI_WIZARD_STORAGE_KEY);
    onSubmit(submissionDraft);
    onClose();
  };
  const handleContinueToParsing = () => setStage("parsing");

  return {
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
  };
}
