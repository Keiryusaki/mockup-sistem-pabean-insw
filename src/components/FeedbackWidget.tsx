import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "./Button";
import { Input, Select, Textarea } from "./FormControls";
import { SparklesIcon } from "./Icons";
import {
  saveStoredFeedbackRecord,
  type FeedbackAttachment,
  type FeedbackType,
} from "../lib/feedbackFeed";

type MathChallenge = {
  left: number;
  right: number;
  operator: "+" | "-" | "x";
  answer: number;
};

type AttachmentPreview = {
  file: File;
  key: string;
  url?: string;
  isImage: boolean;
};

const FEEDBACK_SUBMIT_URL = (((import.meta as unknown as { env?: { VITE_DISCORD_FEEDBACK_SUBMIT_URL?: string } }).env?.VITE_DISCORD_FEEDBACK_SUBMIT_URL ?? "").trim());

function makeChallenge(): MathChallenge {
  const mode = Math.floor(Math.random() * 3);
  if (mode === 0) {
    const left = 2 + Math.floor(Math.random() * 8);
    const right = 1 + Math.floor(Math.random() * 8);
    return { left, right, operator: "+", answer: left + right };
  }

  if (mode === 1) {
    const left = 5 + Math.floor(Math.random() * 10);
    const right = 1 + Math.floor(Math.random() * Math.min(6, left - 1));
    return { left, right, operator: "-", answer: left - right };
  }

  const left = 2 + Math.floor(Math.random() * 8);
  const right = 2 + Math.floor(Math.random() * 6);
  return { left, right, operator: "x", answer: left * right };
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M12 16V5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 9.5 12 5l4.5 4.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M7 7l10 10" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 7 7 17" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path
        d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8A1.5 1.5 0 0 1 20 16.5H9l-4.5 4v-4.5H4A1.5 1.5 0 0 1 2.5 14V7A1.5 1.5 0 0 1 4 5.5Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 9h10" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12h7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FeedbackWidget() {
  const { location } = useRouterState();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [activated, setActivated] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Masukan");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [challenge, setChallenge] = useState<MathChallenge>(() => makeChallenge());
  const [mathAnswer, setMathAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [attachmentPreviews, setAttachmentPreviews] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openRafRef = useRef<number | null>(null);

  const currentRouteLabel = location.pathname === "/" ? "Dashboard" : location.pathname;
  const currentUrl = typeof window !== "undefined" ? window.location.href : currentRouteLabel;
  const canSubmit = Boolean(name.trim() && message.trim() && mathAnswer.trim() && status !== "sending" && FEEDBACK_SUBMIT_URL);

  const resetChallenge = () => setChallenge(makeChallenge());

  useEffect(() => {
    if (!open) return;
    resetChallenge();
    setStatus("idle");
    setStatusMessage("");
  }, [open]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setRendered(true);
      setActivated(false);
      if (openRafRef.current) {
        window.cancelAnimationFrame(openRafRef.current);
      }
      openRafRef.current = window.requestAnimationFrame(() => {
        setActivated(true);
        openRafRef.current = null;
      });
      return;
    }

    if (!rendered) return;

    setActivated(false);

    closeTimerRef.current = window.setTimeout(() => {
      setRendered(false);
      closeTimerRef.current = null;
    }, 220);

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (openRafRef.current) {
        window.cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, [open, rendered]);

  useEffect(() => {
    if (!attachments.length) {
      setAttachmentPreviews([]);
      return undefined;
    }

    const urls = new Map<string, string>();
    const next = attachments.map((file) => {
      if (!isImageFile(file)) return { file, key: fileKey(file), isImage: false };
      const key = fileKey(file);
      const url = URL.createObjectURL(file);
      urls.set(key, url);
      return { file, key, isImage: true, url };
    });
    setAttachmentPreviews(next);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleOpen = () => {
    setOpen(true);
    setStatus("idle");
    setStatusMessage("");
    resetChallenge();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) return;
    setAttachments((current) => [...current, ...nextFiles]);
  };

  const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    const extension = file.type.split("/")[1] || "png";
    const pastedFile = new File([file], `clipboard-${Date.now()}.${extension}`, { type: file.type });
    setAttachments((current) => [...current, pastedFile]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      addFiles(event.currentTarget.files);
      event.currentTarget.value = "";
    }
  };

  const handleRemoveAttachment = (key: string) => {
    setAttachments((current) => current.filter((file) => fileKey(file) !== key));
  };

  const sendFeedback = async () => {
    if (!FEEDBACK_SUBMIT_URL) {
      setStatus("error");
      setStatusMessage("Endpoint submit belum dikonfigurasi.");
      return;
    }

    const answer = Number.parseInt(mathAnswer.trim(), 10);
    if (!Number.isFinite(answer) || answer !== challenge.answer) {
      setStatus("error");
      setStatusMessage("Jawaban matematika belum benar.");
      return;
    }

    setStatus("sending");
    setStatusMessage("Mengirim ke forum Discord...");

    try {
      const submitAttachments = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          kind: isImageFile(file) ? "image" : "file",
          mimeType: file.type || undefined,
          size: file.size,
          dataUrl: await fileToDataUrl(file),
        })),
      );

      const response = await fetch(FEEDBACK_SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          name: name.trim(),
          message: message.trim(),
          page: currentRouteLabel,
          url: currentUrl,
          phase: "Perubahan Kedua",
          attachments: submitAttachments,
        }),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || `HTTP ${response.status}`);
      }

      const result = (await response.json().catch(() => null)) as
        | {
            discordChannelId?: string;
            discordMessageId?: string;
            discordMessageUrl?: string;
          }
        | null;

      setStatus("success");
      setStatusMessage("Masukan berhasil dikirim.");
      saveStoredFeedbackRecord({
        id: result?.discordMessageId ? `discord-${result.discordMessageId}` : `feedback-${Date.now()}`,
        kind: "root",
        type: feedbackType,
        reporter: name.trim() || "-",
        authorRole: "user",
        message: message.trim(),
        page: currentRouteLabel,
        url: currentUrl,
        createdAt: new Date().toISOString(),
        phase: "Perubahan Kedua",
        source: "discord",
        status: "Baru",
        channel: "#kotak-saran",
        discordChannelId: result?.discordChannelId,
        discordMessageId: result?.discordMessageId,
        discordMessageUrl: result?.discordMessageUrl,
        attachments: attachments.map((file) => ({
          name: file.name,
          kind: isImageFile(file) ? "image" : "file",
          mimeType: file.type || undefined,
          size: file.size,
        })) satisfies FeedbackAttachment[],
        tags: [feedbackType.toLowerCase(), currentRouteLabel.toLowerCase()],
      });
      setName("");
      setMessage("");
      setAttachments([]);
      setMathAnswer("");
      resetChallenge();
      window.setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setStatusMessage("");
      }, 900);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Gagal mengirim masukan.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary-300 bg-brand-primary-500 text-white shadow-[0_14px_32px_rgba(2,39,93,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-primary-600 hover:shadow-[0_18px_36px_rgba(2,39,93,0.34)]"
        aria-label="Buka masukan"
      >
        <MessageIcon />
      </button>

      {rendered && typeof document !== "undefined"
        ? createPortal(
            <div
              className={[
                "fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-[1px] transition-opacity duration-300 ease-out",
                activated ? "opacity-100" : "opacity-0",
              ].join(" ")}
            >
              <button
                type="button"
                aria-label="Close feedback overlay"
                onClick={handleClose}
                className="absolute inset-0"
              />
              <div
                className={[
                  "absolute bottom-4 right-4 z-[121] flex max-h-[calc(100vh-2rem)] w-[min(92vw,392px)] flex-col overflow-hidden rounded-[20px] border border-border-primary bg-white shadow-[0_22px_60px_rgba(15,23,42,0.28)] transition-all duration-300 ease-out",
                  activated ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border-primary px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-600 text-white shadow-sm">
                      <MessageIcon />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold leading-5 text-neutral-800">Lapor Pak !!</div>
                      <div className="text-[11px] leading-5 text-neutral-600">Sampaikan masukan atau perbaikan</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-primary text-neutral-700 transition-colors hover:bg-neutral-50"
                    aria-label="Tutup"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
                  <div className="grid gap-3">
                    <Select
                      label="Jenis"
                      value={feedbackType}
                      onValueChange={(value) => setFeedbackType(value as FeedbackType)}
                      options={[
                        { label: "Masukan", value: "Masukan", description: "Saran dan ide perbaikan" },
                        { label: "Perbaikan", value: "Perbaikan", description: "Bug, issue, dan koreksi flow" },
                      ]}
                      clearable={false}
                    />

                    <Input
                      label="Nama"
                      requiredMark
                      placeholder="Tulis nama kamu"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />

                    <Textarea
                      label="Pesan"
                      requiredMark
                      placeholder="Tulis pesannya di sini..."
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onPaste={handlePaste}
                      hint="Kamu bisa paste screenshot langsung dari clipboard."
                    />

                    <div className="rounded-2xl border border-dashed border-border-primary bg-background-primary/35 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-semibold text-neutral-800">Lampiran</div>
                          <div className="mt-1 text-[11px] leading-5 text-neutral-600">Paste gambar atau upload file.</div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} startIcon={<UploadIcon />}>
                          Upload
                        </Button>
                      </div>

                      {attachmentPreviews.length > 0 ? (
                        <div className="mt-3 max-h-[30vh] space-y-2 overflow-auto pr-1">
                          {attachmentPreviews.map((item) => (
                            <div key={item.key} className="overflow-hidden rounded-xl border border-border-primary bg-white shadow-sm">
                              <div className="flex items-center justify-between gap-3 px-3 py-2">
                                <div className="min-w-0">
                                  <div className="truncate text-[12px] font-semibold text-neutral-800">{item.file.name}</div>
                                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                                    {item.isImage ? "Image" : "File"}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(item.key)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-primary text-neutral-700 transition-colors hover:border-error-300 hover:bg-error-500/10 hover:text-error-600"
                                  aria-label={`Hapus ${item.file.name}`}
                                >
                                  <CloseIcon />
                                </button>
                              </div>
                              {item.isImage && item.url ? (
                                <img src={item.url} alt={item.file.name} className="h-20 w-full object-cover" />
                              ) : (
                                <div className="flex h-12 items-center justify-center bg-neutral-50 px-4 text-[12px] text-neutral-600">
                                  <div className="max-w-full truncate">{item.file.name}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-2 rounded-2xl border border-border-primary bg-white px-3 py-3 shadow-sm">
                      <div className="text-[12px] font-semibold text-neutral-800">Verifikasi sederhana</div>
                      <div className="text-[11px] leading-5 text-neutral-600">Jawab sebelum submit untuk mencegah spam.</div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-700">
                          {challenge.left} {challenge.operator} {challenge.right} = ?
                        </span>
                        <Input
                          placeholder="?"
                          value={mathAnswer}
                          onChange={(event) => {
                            setMathAnswer(event.target.value);
                            if (status === "error") setStatus("idle");
                          }}
                          error={status === "error" ? statusMessage : undefined}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {statusMessage && status !== "error" ? (
                      <div
                        className={[
                          "rounded-xl border px-3 py-2 text-[12px]",
                          status === "success"
                            ? "border-success-200 bg-success-50 text-success-700"
                            : "border-info-200 bg-info-50 text-info-700",
                        ].join(" ")}
                      >
                        {statusMessage}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border-primary px-4 py-3">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Batal
                  </Button>
                <Button
                  variant="primary"
                  size="sm"
                    onClick={sendFeedback}
                  disabled={!canSubmit || status === "sending"}
                  startIcon={status === "sending" ? undefined : <UploadIcon />}
                >
                    {status === "sending" ? "Mengirim..." : "Kirim"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
