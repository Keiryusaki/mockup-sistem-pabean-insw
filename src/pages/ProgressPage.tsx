import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Surface";
import { ClockCircleIcon, DocumentsIcon, DownloadIcon, EyeIcon, ProgressIcon } from "../components/Icons";
import { proposalRows } from "./Dashboard";

type ProposalRow = (typeof proposalRows)[number];

type StageKey =
  | "draft"
  | "validasi-sistem"
  | "review-insw"
  | "review-bea-cukai"
  | "review-karantina"
  | "approval"
  | "dokumen-terbit"
  | "selesai";

type StageStatus = "completed" | "current" | "pending";

type StageDocument = {
  name: string;
  type: string;
};

type StageActivity = {
  time: string;
  title: string;
  note: string;
};

type StageMeta = {
  key: StageKey;
  label: string;
  docs: number;
  comments: number;
  warning?: boolean;
  pic: string;
  date: string;
  sla: string;
  reviewerNotes: string[];
  documents: StageDocument[];
  activities: StageActivity[];
};

const STAGES: StageMeta[] = [
  {
    key: "draft",
    label: "Draft",
    docs: 0,
    comments: 0,
    pic: "Sistem",
    date: "04 Jul 2026, 08:15",
    sla: "0 jam",
    reviewerNotes: [],
    documents: [],
    activities: [{ time: "08:15", title: "Draft dibuat", note: "Pengajuan disimpan sebagai draft awal." }],
  },
  {
    key: "validasi-sistem",
    label: "Validasi Sistem",
    docs: 1,
    comments: 0,
    pic: "Sistem",
    date: "04 Jul 2026, 08:32",
    sla: "15 menit",
    reviewerNotes: [],
    documents: [{ name: "Log Validasi.xlsx", type: "Dokumen sistem" }],
    activities: [
      { time: "08:22", title: "Validasi dimulai", note: "Data hasil input mulai dipetakan." },
      { time: "08:32", title: "Validasi selesai", note: "Field inti lolos validasi otomatis." },
    ],
  },
  {
    key: "review-insw",
    label: "Review INSW",
    docs: 2,
    comments: 1,
    pic: "Reviewer INSW",
    date: "04 Jul 2026, 09:05",
    sla: "2 jam",
    reviewerNotes: ["Struktur data sudah sesuai, tinggal cek konsistensi lampiran."],
    documents: [
      { name: "Ringkasan Review INSW.pdf", type: "PDF" },
      { name: "Checklist Review.xlsx", type: "XLSX" },
    ],
    activities: [
      { time: "08:55", title: "Antrian review", note: "Dokumen masuk antrean INSW." },
      { time: "09:05", title: "Reviewer membuka berkas", note: "Pemeriksaan awal dimulai." },
    ],
  },
  {
    key: "review-bea-cukai",
    label: "Review Bea Cukai",
    docs: 1,
    comments: 2,
    warning: true,
    pic: "Pejabat Bea Cukai",
    date: "04 Jul 2026, 10:20",
    sla: "4 jam",
    reviewerNotes: [
      "Ada catatan pada uraian barang dan lampiran pendukung.",
      "Perlu verifikasi tambahan untuk HS Code item 3.",
    ],
    documents: [{ name: "Surat Review Bea Cukai.pdf", type: "PDF" }],
    activities: [
      { time: "09:40", title: "Review dimulai", note: "Dokumen diterima petugas." },
      { time: "10:05", title: "Catatan ditambahkan", note: "User diminta melengkapi detail tertentu." },
      { time: "10:20", title: "Dokumen review tersedia", note: "Hasil review sudah bisa dipelajari." },
    ],
  },
  {
    key: "review-karantina",
    label: "Review Karantina",
    docs: 0,
    comments: 0,
    pic: "Karantina",
    date: "-",
    sla: "Belum mulai",
    reviewerNotes: [],
    documents: [],
    activities: [],
  },
  {
    key: "approval",
    label: "Approval",
    docs: 0,
    comments: 0,
    pic: "Approver",
    date: "-",
    sla: "Belum mulai",
    reviewerNotes: [],
    documents: [],
    activities: [],
  },
  {
    key: "dokumen-terbit",
    label: "Dokumen Terbit",
    docs: 0,
    comments: 0,
    pic: "Sistem",
    date: "-",
    sla: "Belum mulai",
    reviewerNotes: [],
    documents: [],
    activities: [],
  },
  {
    key: "selesai",
    label: "Selesai",
    docs: 0,
    comments: 0,
    pic: "Sistem",
    date: "-",
    sla: "Belum mulai",
    reviewerNotes: [],
    documents: [],
    activities: [],
  },
];

const statusToStage: Record<ProposalRow["status"], StageKey> = {
  Draft: "draft",
  Proses: "review-bea-cukai",
  Disetujui: "selesai",
  Ditolak: "review-bea-cukai",
};

const stageTone: Record<StageStatus, string> = {
  completed: "border-success-100 bg-success-50 text-success-700",
  current: "border-warning-100 bg-warning-50 text-warning-700",
  pending: "border-neutral-200 bg-white text-neutral-500",
};

function getStageState(index: number, currentIndex: number): StageStatus {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "pending";
}

function getStatusText(stage: StageMeta, state: StageStatus) {
  if (state === "completed") return stage.key === "selesai" ? "Selesai" : "Terselesaikan";
  if (state === "current") return stage.key === "selesai" ? "Selesai" : "Sedang Berjalan";
  return "Belum Diproses";
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-5 text-[13px] text-neutral-500">{text}</div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-primary bg-white px-4 py-4 text-left shadow-sm">
      <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">{label}</p>
      <p className="mt-2 break-words text-[14px] font-semibold leading-6 text-neutral-800">{value}</p>
    </div>
  );
}

export function ProgressPage() {
  const { location } = useRouterState();
  const search = location.search as { pengajuan?: string } | undefined;

  const selectedProposal = useMemo<ProposalRow>(() => {
    return proposalRows.find((row) => row.pengajuan === search?.pengajuan) ?? proposalRows[0];
  }, [search?.pengajuan]);

  const initialStageKey = statusToStage[selectedProposal.status];
  const [activeStageKey, setActiveStageKey] = useState<StageKey>(initialStageKey);

  useEffect(() => {
    setActiveStageKey(initialStageKey);
  }, [initialStageKey]);

  const currentStageKey = statusToStage[selectedProposal.status];
  const currentStageIndex = STAGES.findIndex((stage) => stage.key === currentStageKey);
  const activeStageIndex = STAGES.findIndex((stage) => stage.key === activeStageKey);
  const activeStage = STAGES[activeStageIndex] ?? STAGES[0];
  const currentStage = STAGES[currentStageIndex] ?? STAGES[0];
  const currentStageDone = currentStage.key === "selesai";

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
      <Card className="overflow-hidden">
        <CardBody className="bg-gradient-to-br from-brand-primary-600 via-brand-primary-700 to-brand-primary-500 px-5 py-6 text-white sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-warning-300 px-4 py-1.5 text-[12px] font-semibold text-warning-900">
              <ProgressIcon className="h-4 w-4" />
              Progress Pengajuan
            </div>
            <div>
              <h1 className="text-[clamp(22px,3vw,38px)] font-semibold tracking-[-0.04em]">{selectedProposal.pengajuan}</h1>
              <p className="mt-2 max-w-3xl text-[14px] leading-7 text-white/85">
                Fokus halaman ini adalah perjalanan proses pengajuan, review, approval, dokumen yang dihasilkan, dan catatan reviewer.
                Halaman ini berbeda dari detail pengajuan.
              </p>
            </div>
            <div className="grid gap-3 xl:grid-cols-5">
              <SummaryCard label="Nomor Pengajuan" value={selectedProposal.pengajuan} />
              <SummaryCard label="Jenis Dokumen" value={selectedProposal.dokumen} />
              <SummaryCard label="Nama Perusahaan" value={selectedProposal.perusahaan} />
              <SummaryCard label="Status Saat Ini" value={currentStageDone ? "Selesai" : currentStage.label} />
              <SummaryCard label="Terakhir Diperbarui" value="04 Jul 2026, 10:20" />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="items-start">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-800">Progress Timeline</h2>
              <p className="mt-1 text-[12px] leading-6 text-neutral-600">Klik tahapan untuk melihat detail proses pada panel kanan.</p>
            </div>
          </CardHeader>
          <CardBody className="px-4 py-4">
            <div className="relative">
              <div className="absolute left-4 top-3 bottom-3 w-px bg-border-primary/80" />
              <div className="space-y-2">
                {STAGES.map((stage, index) => {
                  const state = getStageState(index, currentStageIndex);
                  const active = stage.key === activeStageKey;
                  const stateLabel = getStatusText(stage, state);
                  return (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => setActiveStageKey(stage.key)}
                      className={`group relative w-full rounded-2xl py-2.5 pl-10 pr-3 text-left transition-all duration-300 ${
                        active ? "bg-brand-primary-50/70 ring-1 ring-brand-primary-200" : "hover:bg-neutral-50"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-semibold ${stageTone[state]} ${
                          active ? "ring-4 ring-brand-primary-50" : ""
                        }`}
                      >
                        {state === "completed" ? "✓" : index + 1}
                      </span>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-neutral-800">{stage.label}</p>
                          <p className="mt-1 text-[12px] text-neutral-500">{stateLabel}</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${active ? "bg-white text-brand-primary-600 shadow-sm" : "text-neutral-300"}`}>
                          →
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-semibold text-neutral-600 shadow-sm ring-1 ring-border-primary/70">
                          <DocumentsIcon className="h-3.5 w-3.5" />
                          {stage.docs}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-50 px-2.5 py-1 font-semibold text-brand-primary-700 ring-1 ring-brand-primary-100">
                          <ClockCircleIcon className="h-3.5 w-3.5" />
                          {stage.comments}
                        </span>
                        {stage.warning ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 font-semibold text-warning-700 ring-1 ring-warning-100">
                            ⚠
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-800">Detail Tahapan</h2>
                <p className="mt-1 text-[12px] leading-6 text-neutral-600">Informasi pada panel ini mengikuti tahapan yang dipilih dari timeline.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-brand-primary-50 px-3 py-1.5 text-[12px] font-semibold text-brand-primary-700">
                {activeStage.label}
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              <Card className="border-border-primary/80 bg-brand-primary-50/30">
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Status Tahapan</p>
                      <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-neutral-800">{activeStage.label}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        activeStageIndex < currentStageIndex
                          ? "border-success-100 bg-success-50 text-success-700"
                          : activeStageIndex === currentStageIndex
                            ? currentStageDone
                              ? "border-success-100 bg-success-50 text-success-700"
                              : "border-warning-100 bg-warning-50 text-warning-700"
                            : "border-neutral-200 bg-white text-neutral-500"
                      }`}
                    >
                      {activeStageIndex < currentStageIndex
                        ? "Selesai"
                        : activeStageIndex === currentStageIndex
                          ? currentStageDone
                            ? "Selesai"
                            : "Sedang Berjalan"
                          : "Belum Diproses"}
                    </span>
                  </div>

                  {activeStage.documents.length === 0 && activeStage.reviewerNotes.length === 0 && activeStage.activities.length === 0 ? (
                    <EmptyState text="Tahapan ini belum diproses." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border-primary bg-white px-4 py-3">
                        <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">PIC / Instansi</p>
                        <p className="mt-2 text-[14px] font-semibold text-neutral-800">{activeStage.pic}</p>
                      </div>
                      <div className="rounded-xl border border-border-primary bg-white px-4 py-3">
                        <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Tanggal</p>
                        <p className="mt-2 text-[14px] font-semibold text-neutral-800">{activeStage.date}</p>
                      </div>
                      <div className="rounded-xl border border-border-primary bg-white px-4 py-3">
                        <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">SLA</p>
                        <p className="mt-2 text-[14px] font-semibold text-neutral-800">{activeStage.sla}</p>
                      </div>
                      <div className="rounded-xl border border-border-primary bg-white px-4 py-3">
                        <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Dokumen</p>
                        <p className="mt-2 text-[14px] font-semibold text-neutral-800">{activeStage.documents.length} file</p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="h-full">
                  <CardHeader>
                    <div>
                      <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-800">Catatan Reviewer</h3>
                      <p className="mt-1 text-[12px] leading-6 text-neutral-600">Catatan ringkas dari tahapan yang sedang dipilih.</p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {activeStage.reviewerNotes.length > 0 ? (
                      <div className="space-y-3">
                        {activeStage.reviewerNotes.map((note) => (
                          <div key={note} className="rounded-xl border border-border-primary bg-neutral-50 px-4 py-3 text-[13px] leading-6 text-neutral-700">
                            {note}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Belum ada catatan reviewer pada tahapan ini." />
                    )}
                  </CardBody>
                </Card>

                <Card className="h-full">
                  <CardHeader>
                    <div>
                      <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-800">Dokumen</h3>
                      <p className="mt-1 text-[12px] leading-6 text-neutral-600">Dokumen yang dihasilkan pada tahapan ini.</p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {activeStage.documents.length > 0 ? (
                      <div className="space-y-3">
                        {activeStage.documents.map((doc) => (
                          <div
                            key={doc.name}
                            className="flex flex-col gap-3 rounded-xl border border-border-primary bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-neutral-800">{doc.name}</p>
                              <p className="mt-1 text-[12px] leading-6 text-neutral-500">{doc.type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" startIcon={<DownloadIcon className="h-4 w-4" />}>
                                Download
                              </Button>
                              <Button size="sm" variant="info" startIcon={<EyeIcon className="h-4 w-4" />}>
                                Preview
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Belum ada dokumen pada tahapan ini." />
                    )}
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div>
                    <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-800">Aktivitas</h3>
                    <p className="mt-1 text-[12px] leading-6 text-neutral-600">Urutan aktivitas utama pada tahapan yang dipilih.</p>
                  </div>
                </CardHeader>
                <CardBody>
                  {activeStage.activities.length > 0 ? (
                    <div className="space-y-3">
                      {activeStage.activities.map((activity) => (
                        <div key={`${activity.time}-${activity.title}`} className="grid grid-cols-[72px_16px_1fr] gap-3">
                          <div className="pt-0.5 text-right text-[12px] font-semibold text-brand-primary-700">{activity.time}</div>
                          <div className="relative">
                            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border-primary" />
                            <div className="relative mt-1 h-3 w-3 rounded-full bg-brand-primary-500 ring-4 ring-brand-primary-50" />
                          </div>
                          <div className="rounded-xl border border-border-primary bg-neutral-50 px-4 py-3">
                            <p className="text-[13px] font-semibold text-neutral-800">{activity.title}</p>
                            <p className="mt-1 text-[12px] leading-6 text-neutral-600">{activity.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="Tahapan ini belum diproses." />
                  )}
                </CardBody>
              </Card>
            </CardBody>
          </Card>

          <Card className="border-brand-primary-100 bg-brand-primary-50/25">
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[12px] tracking-[0.18em] text-neutral-500 uppercase">Ringkasan cepat</p>
                <p className="mt-1 text-[13px] leading-6 text-neutral-700">
                  Pengajuan ini sedang berada di tahapan <span className="font-semibold text-brand-primary-700">{activeStage.label}</span>.
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
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-primary bg-white px-4 py-3 text-[12px] text-neutral-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span>Tampilan progress pengajuan dirancang ringkas agar cepat dipakai buat review bisnis.</span>
        <Link to="/data" search={{ status: undefined } as never} className="text-brand-primary-700 transition-colors hover:text-brand-primary-600">
          Kembali ke Data Pengajuan
        </Link>
      </div>
    </div>
  );
}
