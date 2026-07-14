import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import {
  CalendarIcon,
  ClockCircleIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  MagniferIcon,
  ProgressIcon,
  UserIcon,
} from "../components/Icons";
import { Card, CardBody, CardHeader } from "../components/Surface";
import {
  DEMO_FEEDBACK_RECORDS,
  loadFeedbackRecords,
  resolveFeedbackAttachmentPreviewUrl,
  type FeedbackRecord,
} from "../lib/feedbackFeed";

type FilterType = "Semua" | "Masukan" | "Perbaikan";
type FilterStatus = "Semua" | FeedbackRecord["status"];
const FEEDBACK_FEED_URL = (((import.meta as unknown as { env?: { VITE_FEEDBACK_FEED_URL?: string } }).env?.VITE_FEEDBACK_FEED_URL ?? "").trim());
const FEEDBACK_API_URL = (((import.meta as unknown as { env?: { VITE_DISCORD_FEEDBACK_SUBMIT_URL?: string } }).env?.VITE_DISCORD_FEEDBACK_SUBMIT_URL ?? "").trim());
const ATTACHMENT_PROXY_BASE_URL = FEEDBACK_API_URL || FEEDBACK_FEED_URL;

const typeLabelClass: Record<FeedbackRecord["type"], string> = {
  Masukan: "bg-info-50 text-info-700 border-info-200",
  Perbaikan: "bg-warning-50 text-warning-700 border-warning-200",
};

const statusLabelClass: Record<FeedbackRecord["status"], string> = {
  Baru: "bg-brand-primary-50 text-brand-primary-700 border-brand-primary-200",
  Dibaca: "bg-neutral-100 text-neutral-700 border-border-primary",
  Ditindaklanjuti: "bg-success-50 text-success-700 border-success-200",
  Selesai: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

const roleLabelClass: Record<FeedbackRecord["authorRole"], string> = {
  user: "bg-brand-primary-50 text-brand-primary-700 border-brand-primary-200",
  reviewer: "bg-success-50 text-success-700 border-success-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={["h-4 w-4 fill-none stroke-current", className].filter(Boolean).join(" ")}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 4v6h-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={["h-4 w-4 fill-none stroke-current", className].filter(Boolean).join(" ")}>
      <path d="M12 5v14" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 12h14" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={["h-4 w-4 fill-none stroke-current", className].filter(Boolean).join(" ")}>
      <path d="M5 12h14" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={["h-4 w-4 fill-none stroke-current", className].filter(Boolean).join(" ")}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 4v6h-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={["h-4 w-4 fill-none stroke-current", className].filter(Boolean).join(" ")}>
      <path d="M14 5h5v5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 19 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AttachmentCard({
  attachment,
  previewUrl,
}: {
  attachment: FeedbackRecord["attachments"][number];
  previewUrl?: string;
}) {
  const isPreviewableImage = attachment.kind === "image" && Boolean(previewUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-primary px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-neutral-800">{attachment.name}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            {attachment.kind === "image" ? "Image" : "File"}
          </div>
        </div>
        {attachment.kind === "image" ? (
          <span className="rounded-full bg-brand-primary-50 px-2.5 py-1 text-[10px] font-semibold text-brand-primary-700">Preview</span>
        ) : (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">Lampiran</span>
        )}
      </div>
      {isPreviewableImage ? (
        <div className="group relative overflow-hidden bg-neutral-950">
          <img
            src={previewUrl}
            alt={attachment.name}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] group-hover:brightness-105"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-950/0 opacity-0 transition-all duration-300 group-hover:bg-neutral-950/25 group-hover:opacity-100">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-lg">
              <EyeIcon className="h-3.5 w-3.5" />
              Lihat
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-neutral-50 px-4 text-center text-[12px] text-neutral-600">
          <span className="max-w-full truncate">{attachment.mimeType ? `${attachment.mimeType}` : "Lampiran file"}</span>
        </div>
      )}
    </div>
  );
}

function AttachmentLightbox({
  attachment,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onClose,
}: {
  attachment: { name: string; url: string; source: string } | null;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!attachment || typeof document === "undefined") return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") onZoomIn();
      if (event.key === "-" || event.key === "_") onZoomOut();
      if (event.key === "0") onResetZoom();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [attachment, onClose, onResetZoom, onZoomIn, onZoomOut]);

  if (!attachment || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] bg-neutral-950/95 text-white">
      <button
        type="button"
        aria-label="Tutup preview"
        onClick={onClose}
        className="absolute inset-0 z-0 cursor-zoom-out"
      />

      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950/95 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold leading-5">{attachment.name}</div>
            <div className="mt-0.5 text-[11px] text-white/70">{attachment.source}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 sm:block">
              Zoom {Math.round(zoom * 100)}%
            </div>
            <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={onZoomOut}>
              <MinusIcon />
            </Button>
            <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={onResetZoom}>
              <ResetIcon />
            </Button>
            <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={onZoomIn}>
              <PlusIcon />
            </Button>
            <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/15" asChild>
              <a href={attachment.url} target="_blank" rel="noreferrer">
                <ExternalIcon />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="border-white/15 bg-white text-neutral-800 hover:bg-white/90" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <img
              src={attachment.url}
              alt={attachment.name}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              className="max-h-[calc(100vh-10rem)] max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ThreadMessageCard({
  record,
  compact,
  onPreviewAttachment,
}: {
  record: FeedbackRecord;
  compact?: boolean;
  onPreviewAttachment: (attachment: { name: string; previewUrl?: string }, source: string) => void;
}) {
  const isReply = record.kind === "reply";
  const threadLabel = isReply
    ? record.source === "local"
      ? "Balasan lokal"
      : record.authorRole === "reviewer"
        ? "Balasan TW"
        : "Balasan Discord"
    : "Feedback utama";

  return (
    <div className={["rounded-2xl border bg-white shadow-sm", isReply ? "border-success-200" : "border-border-primary"].join(" ")}>
      <div className="flex items-start justify-between gap-3 border-b border-border-primary px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${typeLabelClass[record.type]}`}>{record.type}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusLabelClass[record.status]}`}>{record.status}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${roleLabelClass[record.authorRole]}`}>
              {record.authorRole === "reviewer" ? "Reviewer" : "Pelapor"}
            </span>
          </div>
          <div className="mt-2 text-[13px] font-semibold text-neutral-800">{threadLabel}</div>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-primary text-brand-primary-600">
          <UserIcon className="h-4 w-4" />
        </span>
      </div>

      <div className={compact ? "px-4 py-3" : "px-4 py-4"}>
        <div className="text-[12px] font-semibold text-neutral-800">{record.reporter}</div>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-neutral-700">{record.message}</p>
        {record.attachments.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {record.attachments.map((attachment) => {
              const previewUrl = resolveFeedbackAttachmentPreviewUrl(record, attachment, ATTACHMENT_PROXY_BASE_URL);
              const isPreviewableImage = attachment.kind === "image" && Boolean(previewUrl);

              return (
                <div
                  key={`${record.id}-${attachment.name}`}
                  role={isPreviewableImage ? "button" : undefined}
                  tabIndex={isPreviewableImage ? 0 : undefined}
                  onClick={() => onPreviewAttachment({ ...attachment, previewUrl }, threadLabel)}
                  onKeyDown={(event) => {
                    if (!isPreviewableImage) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onPreviewAttachment({ ...attachment, previewUrl }, threadLabel);
                    }
                  }}
                  className={isPreviewableImage ? "cursor-zoom-in" : undefined}
                >
                  <AttachmentCard attachment={attachment} previewUrl={previewUrl} />
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDate(record.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
            <ClockCircleIcon className="h-3.5 w-3.5" />
            {record.page}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
            <ProgressIcon className="h-3.5 w-3.5" />
            {record.attachments.length} lampiran
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "primary" | "info" | "warning" | "success";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClasses: Record<"primary" | "info" | "warning" | "success", string> = {
    primary: "border-brand-primary-200 bg-brand-primary-50 text-brand-primary-700",
    info: "border-info-200 bg-info-50 text-info-700",
    warning: "border-warning-200 bg-warning-50 text-warning-700",
    success: "border-success-200 bg-success-50 text-success-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex min-h-28 flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        active ? "border-brand-primary-500 ring-2 ring-brand-primary-100" : "border-border-primary",
      ].join(" ")}
    >
      <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="text-[30px] font-semibold leading-none text-neutral-800">{value}</div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}>{hint}</span>
      </div>
    </button>
  );
}

export function FeedbackInboxPage() {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [sourceLabel, setSourceLabel] = useState("memuat...");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("Semua");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("Semua");
  const [attachmentsOnly, setAttachmentsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(DEMO_FEEDBACK_RECORDS.find((item) => !item.parentId)?.id ?? "");
  const [previewAttachment, setPreviewAttachment] = useState<{
    name: string;
    url: string;
    source: string;
  } | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);

  const loadFeedback = useCallback(async () => {
    setRefreshing(true);
    try {
      const { source, records: nextRecords } = await loadFeedbackRecords(FEEDBACK_FEED_URL);
      setRecords(nextRecords);
      setSourceLabel(source);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
    const interval = window.setInterval(() => {
      void loadFeedback();
    }, 10000);

    const handleFocus = () => {
      void loadFeedback();
    };

    const handleVisibility = () => {
      if (!document.hidden) void loadFeedback();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadFeedback]);

  const rootRecords = useMemo(() => records.filter((item) => !item.parentId), [records]);

  const repliesByParent = useMemo(() => {
    const map = new Map<string, FeedbackRecord[]>();
    records.forEach((item) => {
      if (!item.parentId) return;
      const current = map.get(item.parentId) ?? [];
      current.push(item);
      map.set(item.parentId, current);
    });

    for (const [parentId, list] of map.entries()) {
      map.set(parentId, list.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()));
    }

    return map;
  }, [records]);

  const collectThreadReplies = useMemo(() => {
    const visit = (parentId: string, seen: Set<string>, output: FeedbackRecord[]) => {
      const children = repliesByParent.get(parentId) ?? [];

      for (const child of children) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        output.push(child);
        visit(child.id, seen, output);
      }
    };

    return (parentId: string) => {
      const seen = new Set<string>();
      const output: FeedbackRecord[] = [];
      visit(parentId, seen, output);
      return output.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    };
  }, [repliesByParent]);

  const visibleRoots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rootRecords.filter((record) => {
      const thread = [record, ...collectThreadReplies(record.id)];
      const matchesType = typeFilter === "Semua" || record.type === typeFilter;
      const matchesStatus = statusFilter === "Semua" || record.status === statusFilter;
      const matchesAttachments = !attachmentsOnly || thread.some((item) => item.attachments.length > 0);
      const haystack = thread
        .flatMap((item) => [
          item.reporter,
          item.message,
          item.page,
          item.phase,
          item.status,
          item.type,
          item.authorRole,
          item.channel ?? "",
          ...item.tags,
          ...item.attachments.map((attachment) => attachment.name),
        ])
        .join(" ")
        .toLowerCase();

      return matchesType && matchesStatus && matchesAttachments && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [attachmentsOnly, collectThreadReplies, query, rootRecords, statusFilter, typeFilter]);

  const selectedRecord = useMemo(() => visibleRoots.find((record) => record.id === selectedId) ?? visibleRoots[0] ?? null, [selectedId, visibleRoots]);
  const selectedReplies = useMemo(() => (selectedRecord ? collectThreadReplies(selectedRecord.id) : []), [collectThreadReplies, selectedRecord]);

  useEffect(() => {
    if (visibleRoots.length === 0) return;
    const exists = visibleRoots.some((record) => record.id === selectedId);
    if (!exists) setSelectedId(visibleRoots[0].id);
  }, [selectedId, visibleRoots]);

  useEffect(() => {
    setPreviewZoom(1);
  }, [previewAttachment?.url]);

  const stats = useMemo(() => {
    const total = rootRecords.length;
    const masukan = rootRecords.filter((item) => item.type === "Masukan").length;
    const perbaikan = rootRecords.filter((item) => item.type === "Perbaikan").length;
    const attachmentCount = records.filter((item) => item.attachments.length > 0).length;
    return { total, masukan, perbaikan, attachmentCount };
  }, [records, rootRecords]);

  const filteredCount = visibleRoots.length;
  const threadItems = useMemo(() => {
    if (!selectedRecord) return [];
    return [selectedRecord, ...selectedReplies];
  }, [selectedRecord, selectedReplies]);

  const copyRawPayload = async () => {
    if (!selectedRecord) return;
    const payload = {
      root: selectedRecord,
      replies: selectedReplies,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  const downloadRawPayload = () => {
    if (!selectedRecord) return "";
    const payload = {
      root: selectedRecord,
      replies: selectedReplies,
    };
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  };

  const openAttachmentPreview = (attachment: { name: string; previewUrl?: string }, source: string) => {
    if (!attachment.previewUrl) return;
    setPreviewAttachment({
      name: attachment.name,
      url: attachment.previewUrl,
      source,
    });
  };

  const zoomStep = 0.15;
  const zoomIn = () => setPreviewZoom((current) => Math.min(3, Number((current + zoomStep).toFixed(2))));
  const zoomOut = () => setPreviewZoom((current) => Math.max(0.5, Number((current - zoomStep).toFixed(2))));
  const resetZoom = () => setPreviewZoom(1);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
      <section className="rounded-2xl bg-gradient-to-br from-brand-primary-500 via-[#03306f] to-[#0756a7] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">Feedback mirror</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90">Thread ready</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90">Source: {sourceLabel}</span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[34px]">Feedback / Masukan Inbox</h1>
            <p className="mt-3 text-[13px] leading-6 text-white/90">
              Halaman ini dipakai TW untuk baca masukan, lihat thread balasan, dan preview lampiran tanpa perlu buka Discord.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/30 bg-white text-brand-primary-700 hover:bg-white/90">
              <Link to="/">Ke Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/30 bg-white text-brand-primary-700 hover:bg-white/90">
              <Link to="/changelog">Buka Change Log</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/30 bg-white text-brand-primary-700 hover:bg-white/90"
              startIcon={<RefreshIcon className={["h-4 w-4", refreshing ? "animate-spin" : ""].join(" ")} />}
              onClick={() => void loadFeedback()}
              disabled={refreshing}
            >
              Fetch ulang
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Semua feedback" value={stats.total} hint="Root" tone="primary" active={typeFilter === "Semua"} onClick={() => setTypeFilter("Semua")} />
        <StatCard label="Masukan" value={stats.masukan} hint="Saran" tone="info" active={typeFilter === "Masukan"} onClick={() => setTypeFilter("Masukan")} />
        <StatCard label="Perbaikan" value={stats.perbaikan} hint="Bugfix" tone="warning" active={typeFilter === "Perbaikan"} onClick={() => setTypeFilter("Perbaikan")} />
        <StatCard
          label="Berlampiran"
          value={stats.attachmentCount}
          hint="File / gambar"
          tone="success"
          active={attachmentsOnly}
          onClick={() => setAttachmentsOnly((current) => !current)}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <main className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Filter inbox</div>
                <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Cari masukan yang masuk</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={typeFilter === "Semua" ? "primary" : "outline"} onClick={() => setTypeFilter("Semua")}>
                  Semua
                </Button>
                <Button size="sm" variant={typeFilter === "Masukan" ? "primary" : "outline"} onClick={() => setTypeFilter("Masukan")}>
                  Masukan
                </Button>
                <Button size="sm" variant={typeFilter === "Perbaikan" ? "primary" : "outline"} onClick={() => setTypeFilter("Perbaikan")}>
                  Perbaikan
                </Button>
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex items-center gap-2 rounded-2xl border border-border-primary bg-white px-3 py-3 shadow-sm">
                  <MagniferIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, pesan, halaman, atau lampiran..."
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-neutral-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant={statusFilter === "Semua" ? "primary" : "outline"} onClick={() => setStatusFilter("Semua")}>
                    Semua status
                  </Button>
                  <Button size="sm" variant={statusFilter === "Baru" ? "primary" : "outline"} onClick={() => setStatusFilter("Baru")}>
                    Baru
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border-primary bg-background-primary/30 px-4 py-3 text-[12px] leading-6 text-neutral-700">
                Data ini bisa jadi mirror dari Discord channel khusus. Kalau endpoint mirror belum diisi, halaman hanya menampilkan data lokal
                yang tersimpan saat testing.
              </div>
            </CardBody>
          </Card>

          {loading ? (
            <Card>
              <CardBody className="py-10 text-center text-[13px] text-neutral-600">Memuat feedback mirror...</CardBody>
            </Card>
          ) : visibleRoots.length > 0 ? (
            <div className="space-y-3">
              {visibleRoots.map((record) => {
                const selected = record.id === selectedRecord?.id;
                const replyCount = collectThreadReplies(record.id).length;

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedId(record.id)}
                    className={[
                      "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                      selected ? "border-brand-primary-500 ring-2 ring-brand-primary-100" : "border-border-primary",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${typeLabelClass[record.type]}`}>
                            {record.type}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusLabelClass[record.status]}`}>
                            {record.status}
                          </span>
                          <span className="rounded-full bg-background-primary px-2.5 py-1 text-[10px] font-semibold text-brand-primary-700">
                            {record.phase}
                          </span>
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                            {replyCount} balasan
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
                          <UserIcon className="h-4 w-4 text-brand-primary-600" />
                          <span>{record.reporter}</span>
                        </div>
                        <p className="mt-2 max-w-4xl text-[13px] leading-6 text-neutral-700">{record.message}</p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(record.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
                          <ClockCircleIcon className="h-3.5 w-3.5" />
                          {record.page}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-background-primary px-2.5 py-1 text-brand-primary-700">
                          <ProgressIcon className="h-3.5 w-3.5" />
                          {record.attachments.length} lampiran
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardBody className="py-10 text-center text-[13px] text-neutral-600">Tidak ada feedback yang cocok dengan filter.</CardBody>
            </Card>
          )}
        </main>

        <aside className="min-w-0 xl:sticky xl:top-[116px] xl:h-fit">
          <Card className="overflow-hidden">
            <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Detail thread</div>
                <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">
                  {selectedRecord ? `${selectedRecord.type} dari ${selectedRecord.reporter}` : "Belum ada item"}
                </h2>
              </div>

              {selectedRecord ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" startIcon={<CopyIcon className="h-4 w-4" />} onClick={copyRawPayload}>
                    Copy JSON
                  </Button>
                  <Button size="sm" variant="outline" startIcon={<DownloadIcon className="h-4 w-4" />} asChild>
                    <a href={downloadRawPayload()} download={`${selectedRecord.id}.json`}>
                      Download JSON
                    </a>
                  </Button>
                  {selectedRecord.url && selectedRecord.url !== "-" ? (
                    <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} asChild>
                      <a href={selectedRecord.url} target="_blank" rel="noreferrer">
                        Buka sumber
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardHeader>

            <CardBody>
              {selectedRecord ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border-primary bg-background-primary/25 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Nama</div>
                        <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedRecord.reporter}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Jenis</div>
                        <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedRecord.type}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Halaman</div>
                        <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedRecord.page}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Waktu</div>
                        <div className="mt-1 text-[13px] font-semibold text-neutral-800">{formatDate(selectedRecord.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Source</div>
                        <div className="mt-1 text-[13px] font-semibold text-neutral-800">{selectedRecord.source}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Status</div>
                        <div className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusLabelClass[selectedRecord.status]}`}>
                          {selectedRecord.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">Thread</div>
                    <div className="mt-3 space-y-3">
                      {threadItems.map((item, index) => (
                        <div key={item.id} className="relative">
                          {index > 0 ? <div className="absolute -top-3 left-7 h-3 w-px bg-border-primary" /> : null}
                          <ThreadMessageCard
                            record={item}
                            compact={item.kind === "reply"}
                            onPreviewAttachment={openAttachmentPreview}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">Tag</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRecord.tags.length > 0 ? (
                        selectedRecord.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-background-primary px-3 py-1 text-[11px] font-semibold text-brand-primary-700">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-600">Tidak ada tag</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border-primary bg-background-primary/25 p-6 text-[13px] text-neutral-600">
                  Pilih salah satu feedback di kiri untuk melihat detail, lampiran, thread balasan, dan raw payload yang siap dipakai TW.
                </div>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>

      <AttachmentLightbox
        attachment={previewAttachment}
        zoom={previewZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}

