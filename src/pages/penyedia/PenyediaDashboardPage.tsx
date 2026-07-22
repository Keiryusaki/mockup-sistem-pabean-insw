import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import {
  countryNodes,
  filterPenyediaProposals,
  getCountryFilterCount,
  monitoringSummary,
  type CountryNode,
  type TradeKind,
} from "./penyediaData";
import { AiFlagChip, PenyediaSectionCard } from "./PenyediaAppLayout";
import { PenyediaWorldMap } from "./PenyediaWorldMap";

const KIND_FILTERS: Array<TradeKind | "Semua"> = ["Semua", "Ekspor", "Impor", "KEK"];

const STAT_ACCENT: Record<string, string> = {
  total: "border-l-[#02275d]",
  proses: "border-l-[#d69400]",
  selesai: "border-l-[#0d9a6b]",
  perhatian: "border-l-[#c73838]",
};

const STAT_DOT: Record<string, string> = {
  total: "bg-[#02275d]",
  proses: "bg-[#d69400]",
  selesai: "bg-[#0d9a6b]",
  perhatian: "bg-[#c73838]",
};

export function PenyediaDashboardPage() {
  const navigate = useNavigate();
  const [kindFilter, setKindFilter] = useState<TradeKind | "Semua">("Semua");
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(
    () => countryNodes.find((item) => item.id === selectedCountryId) ?? null,
    [selectedCountryId],
  );

  const relatedSource = useMemo(() => {
    if (!selectedCountry) {
      return filterPenyediaProposals({ kind: kindFilter });
    }
    return filterPenyediaProposals({ countryCode: selectedCountry.code, kind: kindFilter });
  }, [kindFilter, selectedCountry]);

  const relatedRows = useMemo(() => relatedSource.slice(0, 5), [relatedSource]);

  const selectedCount = selectedCountry ? getCountryFilterCount(selectedCountry, kindFilter) : 0;

  // Drop selection if filter leaves the country with zero volume.
  useEffect(() => {
    if (!selectedCountryId) return;
    const country = countryNodes.find((item) => item.id === selectedCountryId);
    if (!country) return;
    if (getCountryFilterCount(country, kindFilter) === 0) {
      setSelectedCountryId(null);
    }
  }, [kindFilter, selectedCountryId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCountryId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Click outside detail panel closes selection (map zoom/pan preserved by chart viewRef).
  useEffect(() => {
    if (!selectedCountryId) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (detailPanelRef.current?.contains(target)) return;
      if (target.closest("[data-map-ui='true']")) return;
      // Clicks on chart canvas also select countries via ECharts events; ignore them here.
      if (mapShellRef.current?.contains(target) && target.closest("canvas")) return;
      setSelectedCountryId(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selectedCountryId]);

  const openList = (country?: CountryNode | null) => {
    void navigate({
      to: "/penyedia/pengajuan",
      search: {
        kind: kindFilter === "Semua" ? undefined : kindFilter,
        country: country?.code,
        q: undefined,
      },
    });
  };

  const tableTitle = selectedCountry
    ? `Pengajuan Terkait · ${selectedCountry.name}${kindFilter !== "Semua" ? ` · ${kindFilter}` : ""}`
    : "Pengajuan Terbaru";

  return (
    <section className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-700">
              Monitoring Center
            </div>
            <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-neutral-900">
              Peta Distribusi Pengajuan Nasional
            </h1>
            <p className="mt-0.5 text-[12px] text-neutral-600">
              Geser, perbesar, lalu pilih negara untuk melihat detail dan daftar terkait.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" data-map-ui="true">
            {KIND_FILTERS.map((kind) => {
              const active = kindFilter === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setKindFilter(kind)}
                  className={[
                    "inline-flex h-9 items-center rounded-full border px-3.5 text-[12px] font-semibold transition-colors",
                    active
                      ? "border-brand-primary-800 bg-brand-primary-800 text-white"
                      : "border-border-primary bg-white text-neutral-700 hover:border-brand-primary-300 hover:text-brand-primary-700",
                  ].join(" ")}
                >
                  {kind}
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={mapShellRef}
          className="relative h-[min(74vh,580px)] min-h-[520px] w-full overflow-hidden bg-[#edf4fb]"
        >
          <PenyediaWorldMap
            kindFilter={kindFilter}
            selectedCountryId={selectedCountryId}
            onSelectCountry={setSelectedCountryId}
            onBlankClick={() => setSelectedCountryId(null)}
          />

          <div
            data-map-ui="true"
            className="pointer-events-none absolute inset-x-3 top-3 z-30 grid grid-cols-2 gap-2 sm:inset-x-4 sm:grid-cols-4"
          >
            {monitoringSummary.map((card) => (
              <div
                key={card.id}
                className={[
                  "pointer-events-auto min-w-0 rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-md border-l-4",
                  STAT_ACCENT[card.id] ?? "border-l-brand-primary-700",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <span
                    className={["inline-block h-2 w-2 shrink-0 rounded-full", STAT_DOT[card.id] ?? "bg-brand-primary-700"].join(" ")}
                  />
                  <span className="truncate">{card.label}</span>
                </div>
                <div className="mt-1 text-[20px] font-semibold leading-none text-neutral-900">{card.value}</div>
              </div>
            ))}
          </div>

          {selectedCountry ? (
            <div
              ref={detailPanelRef}
              data-map-ui="true"
              className="absolute bottom-4 right-3 top-24 z-40 flex w-[min(360px,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/75 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md sm:right-4"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 border-b border-border-primary bg-white px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">
                      Detail Negara
                    </div>
                    <div className="mt-0.5 truncate text-[16px] font-semibold text-neutral-900">
                      {selectedCountry.name}{" "}
                      <span className="text-[12px] font-medium text-neutral-500">({selectedCountry.code})</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-neutral-600">{selectedCount} pengajuan</div>
                  </div>
                  <button
                    type="button"
                    aria-label="Tutup detail negara"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-primary bg-white text-[16px] text-neutral-600 hover:bg-neutral-50"
                    onClick={() => setSelectedCountryId(null)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3">
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label="Impor" value={selectedCountry.import} />
                  <MiniStat label="Ekspor" value={selectedCountry.export} />
                  <MiniStat label="KEK" value={selectedCountry.kek} />
                </div>

                <InfoRow label="HS Code dominan" value={selectedCountry.topHsCode} />
                <InfoRow label="Jenis pengajuan dominan" value={selectedCountry.topDocument} />

                <div className="rounded-xl border border-border-primary bg-white px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">Status pengajuan</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="success">Selesai {selectedCountry.statusBreakdown.selesai}</Badge>
                    <Badge variant="warning">Proses {selectedCountry.statusBreakdown.proses}</Badge>
                    <Badge variant="error">Perlu perhatian {selectedCountry.statusBreakdown.perluPerhatian}</Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-primary-100 bg-brand-primary-50/50 px-2.5 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-primary-700">Insight AI</div>
                  <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-neutral-700">
                    {selectedCountry.aiInsights.slice(0, 3).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border-primary bg-white px-2.5 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Perlu Perhatian</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedCountry.attention.slice(0, 4).map((item) => (
                      <AiFlagChip
                        key={item.id}
                        label={item.count != null ? `${item.label} (${item.count})` : item.label}
                        tone={item.tone}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  fullWidth
                  size="sm"
                  variant="primary"
                  className="!border-brand-primary-800 !bg-brand-primary-800"
                  onClick={() => openList(selectedCountry)}
                >
                  Lihat Daftar Pengajuan
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <PenyediaSectionCard
        title={tableTitle}
        subtitle={
          selectedCountry
            ? "Preview pengajuan dari negara terpilih. Klik Detail untuk membuka halaman detail."
            : "Belum ada negara terpilih. Menampilkan pengajuan terbaru sesuai filter aktif."
        }
        action={
          <Button size="sm" variant="outline" onClick={() => openList(selectedCountry)}>
            Lihat Semua
          </Button>
        }
      >
        {relatedRows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border-primary">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-[12px]">
                <thead className="bg-brand-primary-500 text-white">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">Nomor Pengajuan</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">Jenis Dokumen</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">Negara</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">Flag AI</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {relatedRows.map((row) => (
                    <tr key={row.pengajuan} className="border-t border-border-primary hover:bg-brand-primary-50/30">
                      <td className="px-3 py-2 text-brand-primary-600">{row.pengajuan}</td>
                      <td className="px-3 py-2 font-medium text-neutral-800">{row.dokumen}</td>
                      <td className="px-3 py-2 text-neutral-700">{row.countryName}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            row.status === "Selesai" ? "success" : row.status === "Proses" ? "warning" : "error"
                          }
                        >
                          {row.status === "Proses" ? row.progressLabel ?? "Proses" : row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {row.flags.slice(0, 2).map((flag) => (
                            <AiFlagChip key={flag.id} label={flag.label} tone={flag.tone} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to="/penyedia/detail"
                          search={{ pengajuan: row.pengajuan }}
                          className="inline-flex h-8 items-center rounded-md border border-brand-primary-200 bg-white px-2.5 text-[11px] font-semibold text-brand-primary-700 hover:bg-brand-primary-50"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-6 text-center text-[12px] text-neutral-600">
            Tidak ada pengajuan untuk filter saat ini.
          </div>
        )}
      </PenyediaSectionCard>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-primary bg-white px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-primary bg-white px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-[12px] font-medium text-neutral-800">{value}</div>
    </div>
  );
}
