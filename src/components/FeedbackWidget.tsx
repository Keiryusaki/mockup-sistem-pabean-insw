import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "./Button";
import { Input, Select, Textarea } from "./FormControls";
import { Modal } from "./Surface";
import { SparklesIcon } from "./Icons";

type FeedbackType = "Masukan" | "Perbaikan";

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

const FEEDBACK_WEBHOOK_URL = (((import.meta as unknown as { env?: { VITE_DISCORD_FEEDBACK_WEBHOOK_URL?: string } }).env?.VITE_DISCORD_FEEDBACK_WEBHOOK_URL ?? "").trim());

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

export function FeedbackWidget() {
  const { location } = useRouterState();
  const [open, setOpen] = useState(false);
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

  const currentRouteLabel = location.pathname === "/" ? "Dashboard" : location.pathname;
  const currentUrl = typeof window !== "undefined" ? window.location.href : currentRouteLabel;
  const canSubmit = Boolean(name.trim() && message.trim() && mathAnswer.trim() && status !== "sending" && FEEDBACK_WEBHOOK_URL);

  const resetChallenge = () => setChallenge(makeChallenge());

  useEffect(() => {
    if (!open) return;
    resetChallenge();
    setStatus("idle");
    setStatusMessage("");
  }, [open]);

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

  const sendWebhook = async () => {
    if (!FEEDBACK_WEBHOOK_URL) {
      setStatus("error");
      setStatusMessage("Webhook belum dikonfigurasi.");
      return;
    }

    const answer = Number.parseInt(mathAnswer.trim(), 10);
    if (!Number.isFinite(answer) || answer !== challenge.answer) {
      setStatus("error");
      setStatusMessage("Jawaban matematika belum benar.");
      return;
    }

    const embed: {
      title: string;
      description: string;
      color: number;
      fields: Array<{ name: string; value: string; inline: boolean }>;
      footer: { text: string };
      timestamp: string;
      image?: { url: string };
    } = {
      title: `${feedbackType} Baru`,
      description: message.trim(),
      color: feedbackType === "Perbaikan" ? 0xffb300 : 0x023262,
      fields: [
        { name: "Nama", value: name.trim() || "-", inline: true },
        { name: "Jenis", value: feedbackType, inline: true },
        { name: "Halaman", value: currentRouteLabel, inline: false },
        { name: "URL", value: currentUrl.slice(0, 1024), inline: false },
        { name: "Waktu", value: new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date()), inline: true },
        { name: "Phase", value: "Perubahan Kedua", inline: true },
      ],
      footer: { text: "INSW mockup feedback" },
      timestamp: new Date().toISOString(),
    };
    const payload = {
      username: "Kotak Saran",
      content: `Masukan / Perbaikan baru dari ${name.trim()}`,
      allowed_mentions: { parse: [] as string[] },
      embeds: [embed],
    };

    const imageAttachment = attachments.find((file) => isImageFile(file));
    if (imageAttachment) {
      embed.image = { url: `attachment://${imageAttachment.name}` };
    }
    const otherAttachments = attachments.filter((file) => !isImageFile(file));
    if (otherAttachments.length > 0) {
      embed.fields.push({
        name: "Lampiran",
        value: otherAttachments.map((file) => file.name).join("\n").slice(0, 1024),
        inline: false,
      });
    }

    setStatus("sending");
    setStatusMessage("Mengirim ke Discord...");

    try {
      if (attachments.length === 0) {
        const response = await fetch(FEEDBACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else {
        const formData = new FormData();
        formData.append("payload_json", JSON.stringify(payload));
        attachments.forEach((file, index) => {
          formData.append(`files[${index}]`, file, file.name);
        });

        const response = await fetch(FEEDBACK_WEBHOOK_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }

      setStatus("success");
      setStatusMessage("Masukan berhasil dikirim.");
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
        className="fixed bottom-4 right-4 z-[80] inline-flex items-center gap-2 rounded-full border border-brand-primary-300 bg-brand-primary-500 px-4 py-3 text-[12px] font-semibold text-white shadow-[0_14px_32px_rgba(2,39,93,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-primary-600 hover:shadow-[0_18px_36px_rgba(2,39,93,0.34)]"
      >
        <SparklesIcon className="h-4 w-4" />
        <span>Masukan</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pusat Masukan"
        description="Kirim masukan atau perbaikan cepat ke tim internal lewat Discord webhook."
        widthClassName="w-[min(92vw,640px)]"
        bodyClassName="space-y-4"
        footerClassName="flex items-center justify-between gap-3"
        footer={
          <>
            <div className="min-w-0 text-[11px] leading-5 text-neutral-500">
              {FEEDBACK_WEBHOOK_URL ? "Tersambung ke webhook Discord." : "Webhook belum dikonfigurasi."}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={sendWebhook}
                disabled={!canSubmit || status === "sending"}
                startIcon={status === "sending" ? undefined : <UploadIcon />}
              >
                {status === "sending" ? "Mengirim..." : "Kirim Pesan"}
              </Button>
            </div>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFeedbackType("Masukan")}
              className={[
                "rounded-xl border px-4 py-3 text-left transition-colors",
                feedbackType === "Masukan"
                  ? "border-brand-primary-500 bg-brand-primary-50 text-brand-primary-700"
                  : "border-border-primary bg-white text-neutral-700 hover:border-brand-primary-300",
              ].join(" ")}
            >
              <div className="text-[12px] font-semibold">Masukan</div>
              <div className="mt-1 text-[11px] leading-5 text-neutral-600">Ide, saran, atau catatan umum.</div>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType("Perbaikan")}
              className={[
                "rounded-xl border px-4 py-3 text-left transition-colors",
                feedbackType === "Perbaikan"
                  ? "border-warning-500 bg-warning-50 text-warning-700"
                  : "border-border-primary bg-white text-neutral-700 hover:border-warning-300",
              ].join(" ")}
            >
              <div className="text-[12px] font-semibold">Perbaikan</div>
              <div className="mt-1 text-[11px] leading-5 text-neutral-600">Bug, error, atau alur yang perlu dibenahi.</div>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nama" requiredMark placeholder="Tulis nama kamu" value={name} onChange={(event) => setName(event.target.value)} />
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
          </div>

          <Textarea
            label="Pesan"
            requiredMark
            placeholder="Tulis masukan atau perbaikannya di sini..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onPaste={handlePaste}
            hint="Kamu bisa paste screenshot langsung dari clipboard."
          />

          <div className="rounded-2xl border border-dashed border-border-primary bg-background-primary/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold text-neutral-800">Lampiran</div>
                <div className="mt-1 text-[11px] leading-5 text-neutral-600">Paste gambar dari clipboard atau upload file.</div>
              </div>
              <div className="flex items-center gap-2">
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
                <Button variant="ghost" size="sm" onClick={() => setAttachments([])} disabled={attachments.length === 0}>
                  Hapus semua
                </Button>
              </div>
            </div>

            {attachmentPreviews.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {attachmentPreviews.map((item) => (
                  <div key={item.key} className="overflow-hidden rounded-xl border border-border-primary bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border-primary px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-semibold text-neutral-800">{item.file.name}</div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                          {item.isImage ? "Image" : "File"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(item.key)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-primary text-neutral-700 transition-colors hover:border-error-300 hover:bg-error-500/10 hover:text-error-600"
                        aria-label={`Hapus ${item.file.name}`}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    {item.isImage && item.url ? (
                      <img src={item.url} alt={item.file.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-neutral-50 px-4 text-[12px] text-neutral-600">
                        <div className="max-w-full truncate">{item.file.name}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
            <div className="rounded-2xl border border-border-primary bg-white px-4 py-3 shadow-sm">
              <div className="text-[12px] font-semibold text-neutral-800">Verifikasi sederhana</div>
              <div className="mt-1 text-[11px] leading-5 text-neutral-600">Jawab pertanyaan ini sebelum submit untuk mencegah spam.</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-neutral-700">
                <span className="rounded-full bg-brand-primary-50 px-3 py-1 font-semibold text-brand-primary-700">
                  {challenge.left} {challenge.operator} {challenge.right} = ?
                </span>
                <span className="text-neutral-500">Masukkan jawabannya di kolom sebelah kanan.</span>
              </div>
            </div>
            <Input
              label="Jawaban"
              placeholder="?"
              value={mathAnswer}
              onChange={(event) => {
                setMathAnswer(event.target.value);
                if (status === "error") setStatus("idle");
              }}
              error={status === "error" ? statusMessage : undefined}
            />
          </div>

          {statusMessage && status !== "error" ? (
            <div
              className={[
                "rounded-xl border px-4 py-3 text-[12px]",
                status === "success"
                  ? "border-success-200 bg-success-50 text-success-700"
                  : "border-info-200 bg-info-50 text-info-700",
              ].join(" ")}
            >
              {statusMessage}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
