import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import {
  countryNodes,
  filterPenyediaProposals,
  getCountryProposalCount,
  monitoringSummary,
  projectCountry,
  type CountryNode,
  type TradeKind,
} from "./penyediaData";
import { AiFlagChip, PenyediaSectionCard } from "./PenyediaAppLayout";

function assetUrl(path: string) {
  const baseUrl = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
  if (baseUrl === "/") return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

const KIND_FILTERS: Array<TradeKind | "Semua"> = ["Semua", "Ekspor", "Impor", "KEK"];
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.2;
const ZOOM_STEP = 0.2;

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
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const mapShellRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
  const dragRef = useRef<{ active: boolean; moved: boolean; startX: number; startY: number; originX: number; originY: number }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  viewRef.current = { zoom, offset };

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

  const visibleCountries = useMemo(() => {
    return countryNodes.map((country) => {
      const exact = getCountryProposalCount(country.code, kindFilter);
      const count = kindFilter === "Semua" ? country.total : exact > 0 ? exact : Math.max(1, Math.round(country.total * 0.28));
      return { country, count, exact };
    });
  }, [kindFilter]);

  // Only auto-close detail when filter changes and selected country has no matching data.
  useEffect(() => {
    if (!selectedCountryId) return;
    const code = countryNodes.find((item) => item.id === selectedCountryId)?.code;
    if (!code) return;
    if (kindFilter !== "Semua" && getCountryProposalCount(code, kindFilter) === 0) {
      setSelectedCountryId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindFilter]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCountryId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clampOffset = (nextZoom: number, nextX: number, nextY: number) => {
    const shell = mapShellRef.current;
    if (!shell) return { x: nextX, y: nextY };
    const maxX = ((nextZoom - 1) * shell.clientWidth) / 2 + 80;
    const maxY = ((nextZoom - 1) * shell.clientHeight) / 2 + 80;
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  const applyZoomAround = (nextZoomRaw: number, clientX?: number, clientY?: number) => {
    const shell = mapShellRef.current;
    const current = viewRef.current;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));
    if (!shell || Math.abs(nextZoom - current.zoom) < 0.0001) {
      setZoom(nextZoom);
      return;
    }

    const rect = shell.getBoundingClientRect();
    const anchorX = clientX == null ? rect.left + rect.width / 2 : clientX;
    const anchorY = clientY == null ? rect.top + rect.height / 2 : clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const relX = anchorX - centerX;
    const relY = anchorY - centerY;
    const scale = nextZoom / current.zoom;
    const nextOffset = clampOffset(
      nextZoom,
      relX - (relX - current.offset.x) * scale,
      relY - (relY - current.offset.y) * scale,
    );
    setZoom(nextZoom);
    setOffset(nextOffset);
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-ui='true']") || target.closest("[data-map-marker='true']")) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
  };

  // Native non-passive wheel listener (React onWheel is passive in many browsers).
  useEffect(() => {
    const shell = mapShellRef.current;
    if (!shell) return;

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-map-ui='true']")) return;

      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoomAround(viewRef.current.zoom + direction, event.clientX, event.clientY);
    };

    shell.addEventListener("wheel", onWheel, { passive: false });
    return () => shell.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      setOffset(clampOffset(viewRef.current.zoom, dragRef.current.originX + dx, dragRef.current.originY + dy));
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setIsDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

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

  const hoveredCountry = countryNodes.find((item) => item.id === hoveredCountryId) ?? null;

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
          className={[
            "relative h-[min(74vh,580px)] min-h-[520px] w-full overflow-hidden overscroll-none bg-[#edf4fb] select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
          onMouseDown={handlePointerDown}
          onDoubleClick={(event) => {
            if ((event.target as HTMLElement).closest("[data-map-ui='true']")) return;
            if ((event.target as HTMLElement).closest("[data-map-marker='true']")) return;
            applyZoomAround(viewRef.current.zoom + ZOOM_STEP * 1.5, event.clientX, event.clientY);
          }}
          onClick={(event) => {
            if (!selectedCountryId) return;
            if (dragRef.current.moved) return;
            const target = event.target as HTMLElement;
            if (target.closest("[data-map-ui='true']") || target.closest("[data-map-marker='true']")) return;
            setSelectedCountryId(null);
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-full w-full will-change-transform"
            style={{
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={assetUrl("/world-map.png")}
              alt="Peta dunia monitoring pengajuan"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-85 brightness-110 contrast-95 saturate-70"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(237,244,251,0.22)_0%,rgba(237,244,251,0.04)_35%,rgba(237,244,251,0.08)_100%)]" />

            {visibleCountries.map(({ country, count }) => {
              const point = projectCountry(country.lat, country.lon);
              const size = Math.max(18, Math.min(44, 12 + count * 0.32));
              const active = selectedCountryId === country.id;
              return (
                <button
                  key={country.id}
                  type="button"
                  data-map-marker="true"
                  onMouseEnter={() => setHoveredCountryId(country.id)}
                  onMouseLeave={() => setHoveredCountryId(null)}
                  onMouseDown={(event) => {
                    // Prevent map pan from stealing marker click.
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragRef.current.moved = false;
                    setSelectedCountryId(country.id);
                  }}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  aria-label={`${country.name}, ${count} pengajuan`}
                >
                  <span
                    className={[
                      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                      active ? "animate-pulse bg-[#0353a4]/35" : "bg-[#6898c8]/18 group-hover:bg-[#0353a4]/28",
                    ].join(" ")}
                    style={{ width: size + (active ? 22 : 16), height: size + (active ? 22 : 16) }}
                  />
                  <span
                    className={[
                      "relative inline-flex items-center justify-center rounded-full border-white text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(2,39,93,0.28)] transition-transform",
                      active
                        ? "scale-110 border-[3px] bg-[#02275d] ring-4 ring-[#0353a4]/30"
                        : "border-2 bg-[#0353a4] group-hover:scale-110",
                    ].join(" ")}
                    style={{ width: size, height: size }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

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

          <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1.5" data-map-ui="true">
            <MapControlButton label="Zoom in" onClick={() => applyZoomAround(viewRef.current.zoom + ZOOM_STEP)}>
              +
            </MapControlButton>
            <MapControlButton label="Zoom out" onClick={() => applyZoomAround(viewRef.current.zoom - ZOOM_STEP)}>
              −
            </MapControlButton>
            <MapControlButton label="Reset view" onClick={resetView} className="h-9 w-auto px-2 text-[10px] font-semibold">
              Reset
            </MapControlButton>
          </div>

          {hoveredCountry && hoveredCountry.id !== selectedCountryId ? (
            <div
              className="pointer-events-none absolute bottom-4 left-20 z-30 max-w-[220px] rounded-xl border border-white/70 bg-white/92 px-3 py-2 shadow-lg backdrop-blur-md"
              data-map-ui="true"
            >
              <div className="text-[12px] font-semibold text-neutral-900">{hoveredCountry.name}</div>
              <div className="mt-0.5 text-[12px] text-neutral-700">
                {kindFilter === "Semua"
                  ? hoveredCountry.total
                  : Math.max(getCountryProposalCount(hoveredCountry.code, kindFilter), 1)}{" "}
                pengajuan
              </div>
              <div className="mt-1 text-[11px] text-brand-primary-700">Klik untuk melihat detail</div>
            </div>
          ) : null}

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
                    <div className="mt-0.5 text-[12px] text-neutral-600">
                      {kindFilter === "Semua"
                        ? selectedCountry.total
                        : Math.max(getCountryProposalCount(selectedCountry.code, kindFilter), relatedSource.length)}{" "}
                      pengajuan
                    </div>
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

function MapControlButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-[16px] font-semibold text-neutral-800 shadow-md backdrop-blur-md transition-colors hover:bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
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
