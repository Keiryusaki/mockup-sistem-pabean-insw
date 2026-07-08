import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Badge, type BadgeVariant } from "../components/Badge";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Surface";
import {
  ArrowLeftIcon,
  CheckReadIcon,
  ClockCircleIcon,
  DocumentsIcon,
  DownloadIcon,
  EyeIcon,
  ProgressIcon,
  SparklesIcon,
  UserIcon,
} from "../components/Icons";
import { proposalRows } from "./Dashboard";

type ProposalRow = (typeof proposalRows)[number];

type TimelineKind = "activity" | "response" | "note" | "upload" | "forward" | "status";

type TimelineEvent = {
  id: string;
  time: string;
  date: string;
  title: string;
  kind: TimelineKind;
  source: string;
  meta?: string;
  responseFileId?: string;
};

type ResponseFile = {
  id: string;
  fileName: string;
  instansi: string;
  date: string;
  description: string;
  eventId: string;
};

const timelineEvents: TimelineEvent[] = [
  {
    id: "evt-response-karantina",
    time: "10:05",
    date: "07 Jul 2026",
    title: "Respon Karantina diterbitkan",
    kind: "response",
    source: "Karantina",
    meta: "1 file",
    responseFileId: "resp-karantina",
  },
  {
    id: "evt-reviewer-open",
    time: "09:55",
    date: "07 Jul 2026",
    title: "Reviewer membuka berkas",
    kind: "activity",
    source: "INSW",
  },
  {
    id: "evt-response-bea",
    time: "09:50",
    date: "07 Jul 2026",
    title: "Respon Bea Cukai diterbitkan",
    kind: "response",
    source: "Bea Cukai",
    meta: "1 file",
    responseFileId: "resp-bea-cukai",
  },
  {
    id: "evt-forward",
    time: "09:30",
    date: "07 Jul 2026",
    title: "Pengajuan diteruskan ke Bea Cukai",
    kind: "forward",
    source: "Sistem",
    meta: "Forward",
  },
  {
    id: "evt-note",
    time: "09:20",
    date: "07 Jul 2026",
    title: "Catatan reviewer ditambahkan",
    kind: "note",
    source: "Reviewer",
    meta: "Catatan",
  },
  {
    id: "evt-upload",
    time: "09:10",
    date: "07 Jul 2026",
    title: "Invoice.pdf diupload",
    kind: "upload",
    source: "User",
    meta: "Upload",
  },
  {
    id: "evt-response-insw",
    time: "08:55",
    date: "07 Jul 2026",
    title: "Respon INSW diterbitkan",
    kind: "response",
    source: "INSW",
    meta: "1 file",
    responseFileId: "resp-insw",
  },
  {
    id: "evt-draft",
    time: "08:50",
    date: "07 Jul 2026",
    title: "Draft dibuat",
    kind: "status",
    source: "Sistem",
    meta: "Draft",
  },
];

const responseFiles: ResponseFile[] = [
  {
    id: "resp-karantina",
    fileName: "Surat Pemeriksaan.pdf",
    instansi: "Karantina",
    date: "07 Jul 2026, 10:05",
    description: "Respon karantina untuk pemeriksaan lanjutan.",
    eventId: "evt-response-karantina",
  },
  {
    id: "resp-bea-cukai",
    fileName: "SPPB.pdf",
    instansi: "Bea Cukai",
    date: "07 Jul 2026, 09:50",
    description: "Dokumen respon hasil review bea cukai.",
    eventId: "evt-response-bea",
  },
  {
    id: "resp-insw",
    fileName: "Ringkasan Review.pdf",
    instansi: "INSW",
    date: "07 Jul 2026, 08:55",
    description: "Ringkasan review awal dari proses internal.",
    eventId: "evt-response-insw",
  },
];

const eventKindLabel: Record<TimelineKind, string> = {
  activity: "Aktivitas",
  response: "Respon",
  note: "Catatan",
  upload: "Upload",
  forward: "Forward",
  status: "Status",
};

const responseTone: Record<string, BadgeVariant> = {
  INSW: "secondary",
  "Bea Cukai": "info",
  Karantina: "success",
};

function getProposalStatusLabel(status: ProposalRow["status"]) {
  if (status === "Selesai") return "Selesai";
  if (status === "Proses") return "Review Bea Cukai";
  if (status === "Draft") return "Draft";
  return "Ditolak";
}

function getProposalStatusVariant(status: ProposalRow["status"]) {
  if (status === "Selesai") return "success" as const;
  if (status === "Proses") return "warning" as const;
  if (status === "Draft") return "secondary" as const;
  return "error" as const;
}

function getKindIcon(kind: TimelineKind) {
  switch (kind) {
    case "activity":
      return <UserIcon className="h-4 w-4" />;
    case "response":
      return <DocumentsIcon className="h-4 w-4" />;
    case "note":
      return <SparklesIcon className="h-4 w-4" />;
    case "upload":
      return <DocumentsIcon className="h-4 w-4" />;
    case "forward":
      return <ProgressIcon className="h-4 w-4" />;
    case "status":
      return <CheckReadIcon className="h-4 w-4" />;
    default:
      return <ClockCircleIcon className="h-4 w-4" />;
  }
}

function formatTimeLabel(time: string) {
  return time;
}

function formatTimelineMeta(event: TimelineEvent) {
  return event.meta ? `${event.source} • ${event.date} • ${event.meta}` : `${event.source} • ${event.date}`;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-5 text-[13px] text-neutral-500">{text}</div>;
}

export function ProgressPage() {
  const { location } = useRouterState();
  const search = location.search as { pengajuan?: string } | undefined;

  const selectedProposal = useMemo<ProposalRow>(() => {
    return proposalRows.find((row) => row.pengajuan === search?.pengajuan) ?? proposalRows[0];
  }, [search?.pengajuan]);

  const [activeTimelineEventId, setActiveTimelineEventId] = useState(timelineEvents[0]?.id ?? "");
  const [activeResponseId, setActiveResponseId] = useState(responseFiles[0]?.id ?? "");
  const [flashTimelineEventId, setFlashTimelineEventId] = useState<string | null>(null);
  const [flashResponseId, setFlashResponseId] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const timelineRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const responseRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setActiveTimelineEventId(timelineEvents[0]?.id ?? "");
    setActiveResponseId(responseFiles[0]?.id ?? "");
    setFlashTimelineEventId(null);
    setFlashResponseId(null);
  }, [selectedProposal.pengajuan]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const triggerFlash = (timelineEventId: string, responseId?: string) => {
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }

    setFlashTimelineEventId(timelineEventId);
    if (responseId) {
      setFlashResponseId(responseId);
    }

    flashTimerRef.current = window.setTimeout(() => {
      setFlashTimelineEventId(null);
      setFlashResponseId(null);
    }, 1800);
  };

  const focusTimelineEvent = (event: TimelineEvent) => {
    setActiveTimelineEventId(event.id);
    if (event.responseFileId) {
      setActiveResponseId(event.responseFileId);
      const response = responseFiles.find((file) => file.id === event.responseFileId);
      triggerFlash(event.id, response?.id);
      if (response) {
        responseRefs.current[response.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      triggerFlash(event.id);
    }

    timelineRefs.current[event.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const focusResponse = (response: ResponseFile) => {
    setActiveResponseId(response.id);
    setActiveTimelineEventId(response.eventId);
    triggerFlash(response.eventId, response.id);
    timelineRefs.current[response.eventId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    responseRefs.current[response.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const latestResponse = responseFiles[0];

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
      <Card className="overflow-hidden">
        <CardBody className="bg-gradient-to-br from-brand-primary-600 via-brand-primary-700 to-brand-primary-500 px-5 py-6 text-white sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-warning-300 px-4 py-1.5 text-[12px] font-semibold text-warning-900">
              <ProgressIcon className="h-4 w-4" />
              Progress Pengajuan
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-[clamp(22px,3vw,38px)] font-semibold tracking-[-0.04em]">Riwayat Proses Pengajuan</h1>
                <p className="mt-2 max-w-3xl text-[14px] leading-7 text-white/85">
                  Halaman ini memusatkan riwayat proses global dan semua respon instansi agar reviewer bisa cepat menelusuri kronologi serta
                  hasil respon yang diterbitkan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white ring-1 ring-white/15">
                  {selectedProposal.pengajuan}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white ring-1 ring-white/15">
                  {selectedProposal.dokumen}
                </Badge>
                <Badge variant={getProposalStatusVariant(selectedProposal.status)}>{getProposalStatusLabel(selectedProposal.status)}</Badge>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-left text-neutral-900 shadow-sm">
                <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Nomor Pengajuan</p>
                <p className="mt-2 break-words text-[14px] font-semibold leading-6 text-neutral-800">{selectedProposal.pengajuan}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-left text-neutral-900 shadow-sm">
                <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Jenis Dokumen</p>
                <p className="mt-2 break-words text-[14px] font-semibold leading-6 text-neutral-800">{selectedProposal.dokumen}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-left text-neutral-900 shadow-sm">
                <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Status Saat Ini</p>
                <p className="mt-2 break-words text-[14px] font-semibold leading-6 text-neutral-800">{getProposalStatusLabel(selectedProposal.status)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]">
        <Card className="min-w-0">
          <CardHeader className="items-start">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-800">Riwayat Proses Pengajuan</h2>
              <p className="mt-1 text-[12px] leading-6 text-neutral-600">
                Aktivitas terbaru ditampilkan paling atas. Klik event respon untuk menyorot respon terkait di panel kanan.
              </p>
            </div>
            <Badge variant="info">{timelineEvents.length} event</Badge>
          </CardHeader>

          <CardBody className="px-4 py-4">
            <div className="space-y-0">
              {timelineEvents.map((event, index) => {
                const isActive = activeTimelineEventId === event.id;
                const isFlash = flashTimelineEventId === event.id;
                const isFirst = index === 0;
                const isLast = index === timelineEvents.length - 1;
                return (
                  <button
                    key={event.id}
                    type="button"
                    ref={(node) => {
                      timelineRefs.current[event.id] = node;
                    }}
                    onClick={() => focusTimelineEvent(event)}
                    className={[
                      "timeline-event group relative w-full rounded-2xl px-0 py-1 text-left transition-all duration-300",
                      isActive ? "bg-brand-primary-50/70 shadow-[inset_0_0_0_1px_rgba(3,83,164,0.18)]" : "bg-white hover:bg-neutral-50",
                      isFlash ? "timeline-event--flash" : "",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "absolute left-[108px] z-0 w-[3px] bg-brand-primary-300/90",
                        isFirst ? "top-1/2" : "-top-1",
                        isLast ? "bottom-1/2" : "-bottom-1",
                      ].join(" ")}
                    />

                    <div className="relative z-10 grid min-h-[42px] grid-cols-[72px_28px_minmax(0,1fr)] items-start gap-x-2.5 gap-y-0.5 pl-3 sm:grid-cols-[72px_28px_minmax(0,1fr)]">
                      <div className="pt-0.5 text-[12px] font-semibold leading-5 text-brand-primary-700">{formatTimeLabel(event.time)}</div>

                      <div className="relative row-span-2 flex h-full items-start justify-center pt-0.5">
                        <span
                          aria-hidden="true"
                          className={[
                            "relative z-10 inline-flex h-5 w-5 items-center justify-center rounded-full border-[2px] border-white shadow-[0_0_0_2px_rgba(3,83,164,0.72)] transition-all duration-300",
                            isActive
                              ? "bg-brand-primary-700 text-white shadow-[0_0_0_2px_rgba(2,50,98,0.95)]"
                              : "bg-white text-brand-primary-700",
                            isFlash ? "timeline-dot--flash" : "",
                          ].join(" ")}
                        >
                          <span className="scale-[0.85]">{getKindIcon(event.kind)}</span>
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 pt-0.5">
                        <p className="truncate text-[13px] font-semibold leading-5 text-neutral-800">{event.title}</p>
                        <Badge variant="secondary" className="bg-neutral-100 px-2 py-0.5 text-[10px] leading-none text-neutral-600">
                          {eventKindLabel[event.kind]}
                        </Badge>
                      </div>

                      <div className="col-start-3 min-w-0">
                        <div className="truncate text-[11px] leading-5 text-neutral-600">{formatTimelineMeta(event)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="min-w-0 lg:sticky lg:top-[var(--shell-sticky-top)] lg:self-start">
          <CardHeader className="items-start">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-800">Respon Instansi</h2>
              <p className="mt-1 text-[12px] leading-6 text-neutral-600">
                Semua respon yang pernah diterbitkan tampil di sini. Klik file untuk loncat ke event terkait di timeline.
              </p>
            </div>
            <Badge variant="secondary">{responseFiles.length} file</Badge>
          </CardHeader>

          <CardBody className="space-y-1.5 px-3 py-3">
            {responseFiles.length > 0 ? (
              responseFiles.map((file) => {
                const active = activeResponseId === file.id;
                const flash = flashResponseId === file.id;
                const tone = responseTone[file.instansi] ?? "info";
                return (
                  <div
                    key={file.id}
                    ref={(node) => {
                      responseRefs.current[file.id] = node;
                    }}
                    className={[
                      "rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-300",
                      active ? "border-brand-primary-200 bg-brand-primary-50/50" : "border-border-primary hover:border-brand-primary-150",
                      flash ? "ring-2 ring-warning-300" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => focusResponse(file)}
                      className="flex w-full items-start justify-between gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-neutral-800">{file.fileName}</p>
                          <Badge variant={tone} className="whitespace-nowrap px-2 py-0.5 text-[10px]">
                            {file.instansi}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-neutral-600">{file.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 font-semibold text-neutral-600 ring-1 ring-border-primary/70">
                            <DocumentsIcon className="h-3.5 w-3.5" />
                            {file.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-700 ring-1 ring-brand-primary-100">
                          <DocumentsIcon className="h-4 w-4" />
                        </span>
                      </div>
                    </button>

                    <div className="mt-1.5 flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-[11px]"
                        startIcon={<DownloadIcon className="h-3.5 w-3.5" />}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Belum ada respon instansi pada pengajuan ini." />
            )}

            <div className="rounded-2xl border border-dashed border-border-primary bg-neutral-50 px-3 py-2 text-[11px] leading-5 text-neutral-500">
              File yang dipilih di panel kanan akan menyorot event respon yang sama di timeline.
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="border-brand-primary-100 bg-brand-primary-50/25">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Ringkasan cepat</p>
            <p className="mt-1 text-[13px] leading-6 text-neutral-700">
              Respon terakhir: <span className="font-semibold text-brand-primary-700">{latestResponse.fileName}</span> dari {latestResponse.instansi}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />}>
              Detail Pengajuan
            </Button>
            <Button size="sm" variant="primary" startIcon={<DocumentsIcon className="h-4 w-4" />}>
              Lihat Dokumen
            </Button>
          </div>
        </CardBody>
      </Card>

    </div>
  );
}
