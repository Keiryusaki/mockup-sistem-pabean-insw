import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { EffectScatterChart, MapChart, ScatterChart } from "echarts/charts";
import {
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsType } from "echarts";
import {
  countryNodes,
  getCountryByGeoName,
  getCountryFilterCount,
  type CountryNode,
  type TradeKind,
} from "./penyediaData";

echarts.use([
  MapChart,
  ScatterChart,
  EffectScatterChart,
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const MAP_NAME = "world";
const DEFAULT_CENTER: [number, number] = [20, 10];
const DEFAULT_ZOOM = 1.15;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 1.35;

let mapRegistered = false;
let cachedGeoJson: object | null = null;
let geoJsonPromise: Promise<object> | null = null;

function assetUrl(path: string) {
  const baseUrl =
    ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") ||
    "/";
  if (baseUrl === "/") return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function loadWorldGeoJson(): Promise<object> {
  if (cachedGeoJson) return cachedGeoJson;
  if (!geoJsonPromise) {
    geoJsonPromise = fetch(assetUrl("/maps/world.json"))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Gagal memuat peta dunia (${response.status})`);
        }
        const data = (await response.json()) as object;
        cachedGeoJson = data;
        return data;
      })
      .catch((error) => {
        geoJsonPromise = null;
        throw error;
      });
  }
  return geoJsonPromise;
}

function ensureMapRegistered(geoJson: object) {
  if (mapRegistered) return;
  echarts.registerMap(MAP_NAME, geoJson as Parameters<typeof echarts.registerMap>[1]);
  mapRegistered = true;
}

type MarkerDatum = {
  country: CountryNode;
  value: [number, number, number];
  total: number;
  export: number;
  import: number;
  kek: number;
};

type PenyediaWorldMapProps = {
  kindFilter: TradeKind | "Semua";
  selectedCountryId: string | null;
  onSelectCountry: (countryId: string | null) => void;
  onBlankClick?: () => void;
};

export function PenyediaWorldMap({ kindFilter, selectedCountryId, onSelectCountry, onBlankClick }: PenyediaWorldMapProps) {
  const chartRef = useRef<ReactECharts | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ zoom: DEFAULT_ZOOM, center: DEFAULT_CENTER as [number, number] });
  const hoverKeyRef = useRef<string | null>(null);
  const clearHoverTimerRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(mapRegistered);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!mapRegistered);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (mapRegistered) {
      setMapReady(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadWorldGeoJson()
      .then((geoJson) => {
        if (cancelled) return;
        ensureMapRegistered(geoJson);
        setMapReady(true);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Gagal memuat GeoJSON peta dunia.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const shell = containerRef.current;
    if (!shell) return;

    const resize = () => {
      const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
      instance?.resize();
    };

    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(shell);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [mapReady]);

  useEffect(() => {
    return () => {
      if (clearHoverTimerRef.current != null) {
        window.clearTimeout(clearHoverTimerRef.current);
      }
    };
  }, []);

  const markers = useMemo<MarkerDatum[]>(() => {
    return countryNodes
      .map((country) => {
        const total = getCountryFilterCount(country, kindFilter);
        return {
          country,
          value: [country.coordinates[0], country.coordinates[1], total] as [number, number, number],
          total,
          export: country.export,
          import: country.import,
          kek: country.kek,
        };
      })
      .filter((item) => item.total > 0);
  }, [kindFilter]);

  const selectedCountry = useMemo(
    () => countryNodes.find((item) => item.id === selectedCountryId) ?? null,
    [selectedCountryId],
  );

  const markerIndexByCountryId = useMemo(() => {
    const map = new Map<string, number>();
    markers.forEach((item, index) => map.set(item.country.id, index));
    return map;
  }, [markers]);

  const formatCountryTooltip = (country: CountryNode) => {
    const total = getCountryFilterCount(country, kindFilter);
    if (total <= 0) {
      return [
        `<div style="font-weight:700;margin-bottom:4px">${country.name}</div>`,
        `<div style="color:#64748b">Belum ada data pengajuan</div>`,
      ].join("");
    }
    return [
      `<div style="font-weight:700;margin-bottom:4px">${country.name}</div>`,
      `<div>${total} Pengajuan</div>`,
      `<div>Impor: ${country.import}</div>`,
      `<div>Ekspor: ${country.export}</div>`,
      `<div>KEK: ${country.kek}</div>`,
      `<div style="margin-top:6px;color:#0353a4">Klik untuk melihat detail</div>`,
    ].join("");
  };

  const option = useMemo(() => {
    const maxValue = Math.max(1, ...markers.map((item) => item.total));
    const regions = countryNodes.map((country) => {
      const selected = selectedCountryId === country.id;
      const hovered = hoveredCountryCode === country.code;
      return {
        name: country.geoName,
        selected,
        itemStyle:
          selected || hovered
            ? {
                areaColor: selected ? "#4f86c6" : "#8fb7de",
                borderColor: "#ffffff",
                borderWidth: selected ? 1.2 : 1,
              }
            : undefined,
        emphasis: {
          itemStyle: {
            areaColor: selected ? "#3b74b8" : "#8fb7de",
          },
        },
      };
    });

    return {
      backgroundColor: "transparent",
      animation: true,
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove|click",
        showDelay: 40,
        hideDelay: 160,
        confine: true,
        enterable: false,
        position: (point: number[]) => [point[0] + 18, Math.max(12, point[1] - 24)],
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "rgba(148,163,184,0.45)",
        borderWidth: 1,
        textStyle: {
          color: "#0f172a",
          fontSize: 12,
        },
        extraCssText: "box-shadow:0 12px 28px rgba(15,23,42,0.14); border-radius:12px; padding:10px 12px;",
        formatter: (params: unknown) => {
          const p = params as {
            seriesType?: string;
            name?: string;
            data?: MarkerDatum;
          };

          if (p.seriesType === "effectScatter" || p.seriesType === "scatter") {
            return p.data?.country ? formatCountryTooltip(p.data.country) : "";
          }

          const country = getCountryByGeoName(p.name ?? "");
          if (country) return formatCountryTooltip(country);
          return p.name ? `<div style="font-weight:700;margin-bottom:4px">${p.name}</div><div style="color:#64748b">Belum ada data pengajuan</div>` : "";
        },
      },
      geo: {
        map: MAP_NAME,
        tooltip: {
          show: true,
          formatter: (params: unknown) => {
            const p = params as { name?: string };
            const country = getCountryByGeoName(p.name ?? "");
            if (country) return formatCountryTooltip(country);
            return p.name
              ? `<div style="font-weight:700;margin-bottom:4px">${p.name}</div><div style="color:#64748b">Belum ada data pengajuan</div>`
              : "";
          },
        },
        roam: true,
        zoom: viewRef.current.zoom,
        center: viewRef.current.center,
        scaleLimit: { min: MIN_ZOOM, max: MAX_ZOOM },
        selectedMode: "single",
        itemStyle: {
          areaColor: "#d7e6f4",
          borderColor: "#f8fafc",
          borderWidth: 0.8,
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: "#9fc3e5",
            borderColor: "#ffffff",
            borderWidth: 1,
          },
        },
        select: {
          label: { show: false },
          itemStyle: {
            areaColor: "#4f86c6",
            borderColor: "#ffffff",
            borderWidth: 1.2,
          },
        },
        label: { show: false },
        regions,
      },
      series: [
        {
          id: "country-markers",
          name: "Pengajuan",
          type: "effectScatter",
          tooltip: {
            show: true,
            formatter: (params: unknown) => {
              const data = (params as { data?: MarkerDatum }).data;
              return data?.country ? formatCountryTooltip(data.country) : "";
            },
          },
          coordinateSystem: "geo",
          geoIndex: 0,
          data: markers.map((item) => ({
            ...item,
            name: item.country.name,
            selected: selectedCountryId === item.country.id || hoveredCountryCode === item.country.code,
          })),
          symbolSize: (val: number | number[]) => {
            const total = Array.isArray(val) ? Number(val[2] ?? 0) : Number(val ?? 0);
            return Math.max(16, Math.min(42, 12 + (total / maxValue) * 30));
          },
          showEffectOn: "emphasis",
          rippleEffect: {
            scale: 2.4,
            brushType: "stroke",
            color: "rgba(3, 83, 164, 0.35)",
          },
          label: {
            show: true,
            formatter: (params: unknown) => {
              const data = (params as { data?: MarkerDatum }).data;
              return String(data?.total ?? "");
            },
            position: "inside",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
          },
          itemStyle: {
            color: "#02275d",
            borderColor: "#ffffff",
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: "rgba(2, 39, 93, 0.28)",
          },
          emphasis: {
            scale: true,
            itemStyle: {
              color: "#02275d",
              borderColor: "#ffffff",
              borderWidth: 3,
              shadowBlur: 16,
              shadowColor: "rgba(3, 83, 164, 0.4)",
            },
          },
          zlevel: 2,
        },
        {
          id: "selected-marker-ring",
          type: "effectScatter",
          coordinateSystem: "geo",
          geoIndex: 0,
          silent: true,
          data: selectedCountry
            ? [
                {
                  name: selectedCountry.name,
                  value: [
                    selectedCountry.coordinates[0],
                    selectedCountry.coordinates[1],
                    getCountryFilterCount(selectedCountry, kindFilter),
                  ],
                },
              ]
            : [],
          symbolSize: (val: number | number[]) => {
            const total = Array.isArray(val) ? Number(val[2] ?? 0) : Number(val ?? 0);
            return Math.max(28, Math.min(54, 22 + (total / maxValue) * 34));
          },
          showEffectOn: "render",
          rippleEffect: {
            scale: 2.8,
            brushType: "stroke",
            period: 3.2,
            color: "rgba(3, 83, 164, 0.35)",
          },
          itemStyle: {
            color: "rgba(3, 83, 164, 0.12)",
            borderColor: "rgba(3, 83, 164, 0.55)",
            borderWidth: 1.5,
          },
          zlevel: 1,
        },
      ],
    };
  }, [hoveredCountryCode, kindFilter, markers, selectedCountry, selectedCountryId]);

  const captureViewState = () => {
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
    if (!instance) return;
    const optionState = instance.getOption() as {
      geo?: Array<{ zoom?: number; center?: [number, number] }> | { zoom?: number; center?: [number, number] };
    };
    const geo = Array.isArray(optionState.geo) ? optionState.geo[0] : optionState.geo;
    if (geo?.zoom != null) viewRef.current.zoom = Number(geo.zoom);
    if (geo?.center && Array.isArray(geo.center) && geo.center.length >= 2) {
      viewRef.current.center = [Number(geo.center[0]), Number(geo.center[1])];
    }
  };

  const applyGeoView = (nextZoom: number, nextCenter?: [number, number]) => {
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
    if (!instance) return;
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const center = nextCenter ?? viewRef.current.center;
    viewRef.current = { zoom, center };
    instance.setOption(
      {
        geo: {
          zoom,
          center,
        },
      },
      { lazyUpdate: true },
    );
  };

  const handleZoomIn = () => {
    captureViewState();
    applyGeoView(viewRef.current.zoom * ZOOM_FACTOR);
  };

  const handleZoomOut = () => {
    captureViewState();
    applyGeoView(viewRef.current.zoom / ZOOM_FACTOR);
  };

  const handleReset = () => {
    viewRef.current = { zoom: DEFAULT_ZOOM, center: DEFAULT_CENTER };
    applyGeoView(DEFAULT_ZOOM, DEFAULT_CENTER);
  };

  const clearInteraction = () => {
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
    if (!instance) return;
    instance.dispatchAction({ type: "hideTip" });
    instance.dispatchAction({ type: "downplay", seriesId: "country-markers" });
    instance.dispatchAction({ type: "downplay", geoIndex: 0 });
    if (selectedCountry) {
      const selectedMarkerIndex = markerIndexByCountryId.get(selectedCountry.id);
      instance.dispatchAction({ type: "highlight", geoIndex: 0, name: selectedCountry.geoName });
      if (selectedMarkerIndex != null) {
        instance.dispatchAction({ type: "highlight", seriesId: "country-markers", dataIndex: selectedMarkerIndex });
      }
    }
  };

  const clearScheduledHover = () => {
    if (clearHoverTimerRef.current != null) {
      window.clearTimeout(clearHoverTimerRef.current);
      clearHoverTimerRef.current = null;
    }
  };

  const scheduleClearHover = (countryCode?: string) => {
    clearScheduledHover();
    clearHoverTimerRef.current = window.setTimeout(() => {
      if (countryCode && hoverKeyRef.current !== countryCode) return;
      hoverKeyRef.current = null;
      setHoveredCountryCode(null);
      clearInteraction();
    }, 120);
  };

  const syncInteraction = (country: CountryNode, showTooltip = true) => {
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
    if (!instance) return;
    const markerIndex = markerIndexByCountryId.get(country.id);

    instance.dispatchAction({ type: "downplay", seriesId: "country-markers" });
    instance.dispatchAction({ type: "downplay", geoIndex: 0 });
    instance.dispatchAction({ type: "highlight", geoIndex: 0, name: country.geoName });
    if (markerIndex != null) {
      instance.dispatchAction({ type: "highlight", seriesId: "country-markers", dataIndex: markerIndex });
    }
    if (showTooltip) {
      if (markerIndex != null) {
        instance.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: markerIndex });
      } else {
        instance.dispatchAction({ type: "showTip", geoIndex: 0, name: country.geoName });
      }
    }
  };

  const getCountryFromParams = (params: {
    componentType?: string;
    seriesType?: string;
    name?: string;
    data?: MarkerDatum;
  }) => {
    if (params.seriesType === "effectScatter" || params.seriesType === "scatter") {
      return params.data?.country ?? null;
    }
    if (params.componentType === "geo") {
      return getCountryByGeoName(params.name ?? "");
    }
    return null;
  };

  const handleChartClick = (params: {
    componentType?: string;
    seriesType?: string;
    name?: string;
    data?: MarkerDatum;
  }) => {
    const country = getCountryFromParams(params);
    if (!country) {
      onBlankClick?.();
      return;
    }
    if (getCountryFilterCount(country, kindFilter) <= 0) return;
    clearScheduledHover();
    hoverKeyRef.current = country.code;
    setHoveredCountryCode(country.code);
    onSelectCountry(country.id);
    syncInteraction(country);
  };

  const handleChartMouseOver = (params: {
    componentType?: string;
    seriesType?: string;
    name?: string;
    data?: MarkerDatum;
  }) => {
    const country = getCountryFromParams(params);
    if (!country) return;
    clearScheduledHover();
    hoverKeyRef.current = country.code;
    setHoveredCountryCode(country.code);
    syncInteraction(country);
  };

  const handleChartMouseOut = (params: {
    componentType?: string;
    seriesType?: string;
    name?: string;
    data?: MarkerDatum;
  }) => {
    const country = getCountryFromParams(params);
    scheduleClearHover(country?.code);
  };

  const onEvents = useMemo(
    () => ({
      click: handleChartClick,
      mouseover: handleChartMouseOver,
      mouseout: handleChartMouseOut,
      georoam: () => {
        captureViewState();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kindFilter, markers, onSelectCountry, selectedCountryId],
  );

  useEffect(() => {
    if (!mapReady) return;
    const timer = window.setTimeout(() => {
      if (selectedCountry) syncInteraction(selectedCountry, false);
      else clearInteraction();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, selectedCountryId, kindFilter]);

  useEffect(() => {
    if (!mapReady) return;
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined;
    if (!instance) return;
    const zr = instance.getZr();
    const handleBlankClick = (event: { target?: unknown }) => {
      if (!event.target) onBlankClick?.();
    };
    zr.on("click", handleBlankClick);
    return () => {
      zr.off("click", handleBlankClick);
    };
  }, [mapReady, onBlankClick]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[520px] w-full overflow-hidden bg-[#edf4fb]">
      {loading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#edf4fb]/90">
          <div className="rounded-xl border border-border-primary bg-white px-4 py-3 text-[12px] text-neutral-700 shadow-sm">
            Memuat peta dunia interaktif…
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#edf4fb]">
          <div className="max-w-md rounded-xl border border-error-100 bg-white px-4 py-3 text-center shadow-sm">
            <div className="text-[13px] font-semibold text-error-700">Peta gagal dimuat</div>
            <div className="mt-1 text-[12px] text-neutral-600">{loadError}</div>
            <div className="mt-1 text-[11px] text-neutral-500">Pastikan file `/maps/world.json` tersedia.</div>
          </div>
        </div>
      ) : null}

      {mapReady && !loadError ? (
        <ReactECharts
          ref={chartRef}
          echarts={echarts}
          option={option}
          notMerge
          lazyUpdate
          style={{ width: "100%", height: "100%", minHeight: 520 }}
          opts={{ renderer: "canvas" }}
          onEvents={onEvents}
        />
      ) : null}

      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1.5" data-map-ui="true">
        <MapControlButton label="Zoom in" onClick={handleZoomIn}>
          +
        </MapControlButton>
        <MapControlButton label="Zoom out" onClick={handleZoomOut}>
          −
        </MapControlButton>
        <MapControlButton label="Reset view" onClick={handleReset} className="h-9 w-auto px-2 text-[10px] font-semibold">
          Reset
        </MapControlButton>
      </div>
    </div>
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
