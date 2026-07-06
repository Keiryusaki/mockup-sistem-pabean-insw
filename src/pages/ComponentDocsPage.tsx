import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, IconButton } from "../components/Button";
import { Checkbox, Input, Select, Switch, Textarea } from "../components/FormControls";
import { Card, CardBody, CardFooter, CardHeader, Modal } from "../components/Surface";
import {
  ArrowRightIcon,
  DocumentsIcon,
  HamburgerMenuIcon,
  MagniferIcon,
} from "../components/Icons";

type TocSection = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: ReactNode;
};

const sections: TocSection[] = [
  {
    id: "colors",
    title: "Color System",
    description: "Struktur warna inti: primary blue, accent yellow, neutral, dan semantic colors.",
    badge: "source",
    icon: <DocumentsIcon className="h-4 w-4" />,
  },
  {
    id: "button",
    title: "Button System",
    description: "Fondasi aksi utama. Semua varian, ukuran, dan state tombol harus konsisten dari sini.",
    badge: "blocker",
    icon: <ArrowRightIcon className="h-4 w-4" />,
  },
  {
    id: "form-controls",
    title: "Form Controls",
    description: "Input, textarea, select, checkbox, switch, card, dan modal lokal yang bisa dipakai ulang.",
    badge: "foundation",
    icon: <DocumentsIcon className="h-4 w-4" />,
  },
  {
    id: "icons",
    title: "Icon Sample",
    description: "Preview kecil untuk ngecek ukuran, stroke, dan interaction sebelum buka icon library penuh.",
    badge: "blocker",
    icon: <MagniferIcon className="h-4 w-4" />,
  },
];

type ColorSwatch = {
  name: string;
  token: string;
  value: string;
  usage: string;
  tone: "light" | "dark";
};

type ColorScale = {
  title: string;
  description: string;
  swatches: ColorSwatch[];
};

type SemanticTone = {
  name: "Success" | "Warning" | "Error" | "Info";
  token: string;
  value: string;
  background: string;
  icon: string;
  description: string;
};

const colorScales: ColorScale[] = [
  {
    title: "Primary Blue Scale",
    description: "Core brand color representing authority and trustworthiness.",
    swatches: [
      {
        name: "Blue 900",
        token: "colors.brand.primary[900]",
        value: "#00172f",
        usage: "Primary headers, navigation",
        tone: "dark",
      },
      {
        name: "Blue 700",
        token: "colors.brand.primary[700]",
        value: "#023262",
        usage: "Primary buttons, links",
        tone: "dark",
      },
      {
        name: "Blue 100",
        token: "colors.brand.primary[100]",
        value: "#cddded",
        usage: "Subtle backgrounds",
        tone: "light",
      },
      {
        name: "Blue 50",
        token: "colors.brand.primary[50]",
        value: "#f2f7fb",
        usage: "Page backgrounds, tints",
        tone: "light",
      },
    ],
  },
  {
    title: "Accent Yellow Scale",
    description: "Secondary brand color adding warmth and visibility.",
    swatches: [
      {
        name: "Yellow 500",
        token: "colors.brand.secondary[500]",
        value: "#ffb300",
        usage: "Primary accent, CTAs",
        tone: "light",
      },
      {
        name: "Yellow 100",
        token: "colors.brand.secondary[100]",
        value: "#fff0c2",
        usage: "Subtle backgrounds",
        tone: "light",
      },
      {
        name: "Yellow 50",
        token: "colors.brand.secondary[50]",
        value: "#fff7df",
        usage: "Alert backgrounds, tints",
        tone: "light",
      },
    ],
  },
  {
    title: "Neutral Scale",
    description: "Supporting colors for text, backgrounds, and UI elements.",
    swatches: [
      {
        name: "Neutral 900",
        token: "colors.neutral[900]",
        value: "#1e1e1e",
        usage: "Primary text, headings",
        tone: "dark",
      },
      {
        name: "Neutral 700",
        token: "colors.neutral[700]",
        value: "#5f5f5f",
        usage: "Body text",
        tone: "dark",
      },
      {
        name: "Neutral 300",
        token: "colors.neutral[300]",
        value: "#c5c5c5",
        usage: "Borders, separators",
        tone: "light",
      },
      {
        name: "Neutral 200",
        token: "colors.neutral[200]",
        value: "#dbd8d8",
        usage: "Dividers, light borders",
        tone: "light",
      },
      {
        name: "Neutral 100",
        token: "colors.neutral[100]",
        value: "#ececec",
        usage: "Card backgrounds",
        tone: "light",
      },
      {
        name: "Neutral 50",
        token: "colors.neutral[50]",
        value: "#fafaf9",
        usage: "Page backgrounds",
        tone: "light",
      },
    ],
  },
];

const semanticColors: SemanticTone[] = [
  {
    name: "Success",
    token: "colors.feedback.success.{background, text, border}",
    value: "#d9f7ec",
    background: "#d9f7ec",
    icon: "#0d9a6b",
    description: "Success messages, confirmations",
  },
  {
    name: "Warning",
    token: "colors.feedback.warning.{background, text, border}",
    value: "#fff1c7",
    background: "#fff1c7",
    icon: "#996b00",
    description: "Warning messages, caution",
  },
  {
    name: "Error",
    token: "colors.feedback.error.{background, text, border}",
    value: "#fde2e2",
    background: "#fde2e2",
    icon: "#c73838",
    description: "Error messages, destructive actions",
  },
  {
    name: "Info",
    token: "colors.feedback.info.{background, text, border}",
    value: "#b2e4f4",
    background: "#b2e4f4",
    icon: "#1e88b3",
    description: "Informational messages",
  },
];

function Section({
  id,
  title,
  description,
  badge,
  children,
}: {
  id: string;
  title: string;
  description: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-border-primary bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border-primary pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">{badge}</div>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-neutral-800">{title}</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-600">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TocItem({
  active,
  section,
  onClick,
}: {
  active: boolean;
  section: TocSection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm"
          : "border-border-primary bg-white hover:border-brand-primary-300 hover:bg-brand-primary-50/60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {section.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-neutral-800">{section.title}</span>
        <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{section.description}</span>
      </span>
    </button>
  );
}

function ColorScaleCard({ scale }: { scale: ColorScale }) {
  return (
    <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-brand-primary-700">{scale.title}</h3>
        <p className="mt-2 text-[12px] leading-6 text-neutral-700">{scale.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scale.swatches.map((swatch) => (
          <article key={swatch.name} className="min-w-0">
            <div
              className="h-32 rounded-xl border border-border-primary shadow-sm"
              style={{ backgroundColor: swatch.value }}
              aria-hidden="true"
            />
            <div className="mt-3">
              <div className="text-[13px] font-semibold text-brand-primary-700">{swatch.name}</div>
              <div className="mt-1 font-mono text-[11px] text-neutral-700">{swatch.token}</div>
              <div className="mt-2 text-[12px] leading-5 text-neutral-600">{swatch.usage}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SemanticCard({ tone }: { tone: SemanticTone }) {
  return (
    <article
      className="rounded-2xl border border-border-primary p-4 shadow-sm"
      style={{ backgroundColor: tone.background }}
    >
      <div className="flex items-start gap-3">
        <div
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
          style={{ backgroundColor: tone.icon }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M15 6.66699L8.33333 13.3337L5 10.0003"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-brand-primary-700">{tone.name}</div>
          <div className="mt-1 font-mono text-[11px] text-neutral-700">{tone.token}</div>
          <div className="mt-2 text-[12px] leading-5 text-neutral-700">{tone.description}</div>
        </div>
      </div>
    </article>
  );
}

function TocPanel({
  dockLeft,
  tocCollapsed,
  mobileOpen,
  tocMode,
  search,
  setSearch,
  filteredSections,
  onToggleCollapse,
  onMobileToggle,
  onMobileClose,
  onDockLeft,
  onDockRight,
}: {
  dockLeft: boolean;
  tocCollapsed: boolean;
  mobileOpen: boolean;
  tocMode: "sidebar" | "drawer";
  search: string;
  setSearch: (value: string) => void;
  filteredSections: TocSection[];
  onToggleCollapse: () => void;
  onMobileToggle: () => void;
  onMobileClose: () => void;
  onDockLeft: () => void;
  onDockRight: () => void;
}) {
  const sideClass = dockLeft ? "left-3" : "right-3";
  const hiddenClass = dockLeft ? "-translate-x-[110%]" : "translate-x-[110%]";
  const drawerSideClass = dockLeft ? "left-3" : "right-3";
  const drawerBottomClass = tocMode === "drawer" ? "bottom-16" : "bottom-4";
  const collapseIconClass = [
    "h-4 w-4 transition-transform",
    tocCollapsed ? (dockLeft ? "" : "rotate-180") : dockLeft ? "rotate-180" : "",
  ].join(" ");

  return (
    <>
      <div className={["fixed bottom-4 z-[65] lg:hidden", sideClass].join(" ")}>
        <button
          type="button"
          onClick={onMobileToggle}
          aria-label={mobileOpen ? "Tutup TOC" : "Buka TOC"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
        >
          <HamburgerMenuIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onMobileClose}
        aria-label="Close TOC overlay"
        className={[
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed top-[calc(var(--shell-sticky-top)+56px)] z-[70] w-[min(92vw,360px)] lg:hidden",
          drawerBottomClass,
          sideClass,
          "transition-all duration-200",
          mobileOpen ? "translate-x-0 opacity-100" : `${hiddenClass} opacity-0`,
        ].join(" ")}
      >
        <div className="flex h-full flex-col rounded-2xl border border-border-primary bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
          <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Table of Content</div>
              <div className="mt-1 text-[12px] text-neutral-700">Cari section dan lompat cepat</div>
            </div>
            <Button variant="ghost" size="sm" onClick={onMobileClose} aria-label="Dismiss drawer TOC">
              ×
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-md bg-background-primary text-neutral-500">
              <MagniferIcon className="h-4 w-4" />
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search toc..."
              className="h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDockLeft}
              className={dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}
            >
              Kiri
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDockRight}
              className={!dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}
            >
              Kanan
            </Button>
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <TocItem
                  key={section.id}
                  active={false}
                  section={section}
                  onClick={() => {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    onMobileClose();
                  }}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-4 text-[12px] text-neutral-600">
                Tidak ada section yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>
      </aside>

      {tocMode === "drawer" && (
        <>
          <div className={["fixed top-1/2 z-[65] hidden lg:block -translate-y-1/2", drawerSideClass].join(" ")}>
            <button
              type="button"
              onClick={onMobileToggle}
              aria-label={mobileOpen ? "Tutup drawer TOC" : "Buka drawer TOC"}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-transform hover:scale-105"
            >
              <HamburgerMenuIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close desktop TOC overlay"
            className={[
              "fixed inset-0 z-[60] hidden bg-black/15 backdrop-blur-[1px] transition-opacity lg:block",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
          />
        </>
      )}

      <aside
        className={[
          "hidden min-w-0 lg:block",
          tocMode === "sidebar" ? (tocCollapsed ? "lg:w-[72px]" : "lg:w-[320px]") : `fixed top-[calc(var(--shell-sticky-top)+56px)] ${drawerBottomClass} w-[min(92vw,360px)] z-[70]`,
          tocMode === "drawer" ? drawerSideClass : "",
          "transition-all duration-200",
          mobileOpen ? "translate-x-0 opacity-100" : tocMode === "drawer" ? `${hiddenClass} opacity-0` : "",
        ].join(" ")}
      >
        <div className={tocMode === "drawer" ? "flex h-full flex-col rounded-2xl border border-border-primary bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.24)]" : "sticky top-[104px] rounded-2xl border border-border-primary bg-white p-3 shadow-sm"}>
          {tocMode === "drawer" ? (
            <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Table of Content</div>
                <div className="mt-1 text-[12px] text-neutral-700">Cari section dan lompat cepat</div>
              </div>
              <Button variant="ghost" size="sm" onClick={onMobileClose} aria-label="Dismiss drawer TOC">
                ×
              </Button>
            </div>
          ) : tocCollapsed ? (
            <div className="flex items-center justify-end gap-2 border-b border-border-primary pb-3">
              <Button variant="ghost" size="sm" onClick={onToggleCollapse} aria-label="Expand TOC">
                <ArrowRightIcon className={collapseIconClass} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Table of Content</div>
                <div className="mt-1 text-[12px] text-neutral-700">Cari section dan lompat cepat</div>
              </div>
              <Button variant="ghost" size="sm" onClick={onToggleCollapse} aria-label="Collapse TOC">
                <ArrowRightIcon className={collapseIconClass} />
              </Button>
            </div>
          )}

          {!tocCollapsed ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <div className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-md bg-background-primary text-neutral-500">
                  <MagniferIcon className="h-4 w-4" />
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder="Search toc..."
                  className="h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDockLeft}
                  className={dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}
                >
                  Kiri
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDockRight}
                  className={!dockLeft ? "border-brand-primary-500 bg-brand-primary-50" : ""}
                >
                  Kanan
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {filteredSections.length > 0 ? (
                  filteredSections.map((section) => (
                    <TocItem
                      key={section.id}
                      active={false}
                      section={section}
                      onClick={() => {
                        document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        if (tocMode === "drawer") {
                          onMobileClose();
                        }
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-4 text-[12px] text-neutral-600">
                    Tidak ada section yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex h-14 w-full items-center justify-center rounded-xl border border-border-primary bg-background-primary/40 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700 transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-50"
                >
                  {section.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
export function ComponentDocsPage() {
  const [search, setSearch] = useState("");
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [tocMode, setTocMode] = useState<"sidebar" | "drawer">("sidebar");
  const [tocSide, setTocSide] = useState<"left" | "right">("left");
  const [isPressed, setIsPressed] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoChecked, setDemoChecked] = useState(true);
  const [demoSwitch, setDemoSwitch] = useState(false);
  const dockLeft = tocSide === "left";
  const dockRight = !dockLeft;

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter((section) => `${section.title} ${section.description} ${section.badge}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 px-1 py-1 sm:px-0 sm:py-0">
      <div className="rounded-2xl border border-border-primary bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Live Docs</div>
            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] text-neutral-800 sm:text-[36px]">
              Komponen Lokal INSW
            </h1>
            <p className="mt-3 text-[12px] leading-6 text-neutral-600">
              Halaman ini dipakai buat cek komponen inti sebelum masuk ke mockup utama. Fokusnya jelas:
              button system, icon set, dan token warna.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsPressed((current) => !current)}>
              {isPressed ? "Reset demo" : "Toggle state"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTocMode((current) => (current === "sidebar" ? "drawer" : "sidebar"))}>
              Mode {tocMode === "sidebar" ? "Sidebar" : "Drawer"}
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link to="/icon">Open Icon Set</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTocSide((current) => (current === "left" ? "right" : "left"))}
            >
              Dock {tocSide === "left" ? "kanan" : "kiri"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-neutral-700">
          <span className="inline-flex items-center rounded-full bg-error-500/10 px-3 py-1 font-semibold text-error-600">
            blocker
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 font-semibold text-brand-primary-700">
            reusable
          </span>
          <span className="inline-flex items-center rounded-full bg-success-300/30 px-3 py-1 font-semibold text-success-600">
            source tokens ready
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className={["min-w-0 space-y-4", dockLeft ? "lg:order-2 lg:flex-1" : "lg:order-1 lg:flex-1"].join(" ")}>
          <Section
            id="colors"
            title="Color System"
            badge="source"
            description="Struktur warna yang paling sering dipakai di project: primary blue, accent yellow, neutral, dan semantic colors."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border-primary bg-gradient-to-br from-brand-primary-700 via-[#03306f] to-brand-primary-900 p-5 text-white shadow-sm sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/65">Primary: Dark Blue</div>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">Trust, stability, and professional tone.</h3>
                <p className="mt-3 max-w-2xl text-[12px] leading-6 text-brand-primary-100">
                  Dipakai untuk header utama, navigasi, dan aksi primer supaya visual project tetap terasa tegas dan
                  konsisten.
                </p>
              </div>
              <div className="rounded-2xl border border-border-primary bg-brand-secondary-500 p-5 shadow-sm sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-primary-600">Accent: Yellow</div>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-brand-primary-700 sm:text-[28px]">
                  Warm accent for CTA and highlights.
                </h3>
                <p className="mt-3 max-w-2xl text-[12px] leading-6 text-brand-secondary-700">
                  Dipakai buat CTA, highlight, dan penanda penting agar tampilan tetap hidup tanpa ngalahin primary
                  blue.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {colorScales.map((scale) => (
                <ColorScaleCard key={scale.title} scale={scale} />
              ))}

              <section className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-brand-primary-700">
                    Semantic Colors
                  </h3>
                  <p className="mt-2 text-[12px] leading-6 text-neutral-700">
                    Warna status untuk feedback users. Background, text, dan border-nya dipakai berpasangan supaya
                    kontrasnya tetap aman.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {semanticColors.map((tone) => (
                    <SemanticCard key={tone.name} tone={tone} />
                  ))}
                </div>
              </section>
            </div>
          </Section>

          <Section
            id="button"
            title="Button System"
            badge="blocker"
            description="Kalau tombol belum rapi, seluruh project ikut terasa flat. Karena itu base class ditaruh di satu tempat dan konsumen cukup pilih varian."
          >
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="error">Error</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled={isPressed}>Disabled</Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button fullWidth variant="primary">
                  Full width
                </Button>
                <Button fullWidth variant="outline" endIcon={<ArrowRightIcon className="h-4 w-4" />}>
                  Continue
                </Button>
              </div>

              <div className="rounded-2xl border border-dashed border-border-primary bg-background-primary/35 p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">API kecil</div>
                <p className="mt-2 text-[12px] leading-6 text-neutral-700">
                  DevTools memang tetap menampilkan class internal, tapi konsumen komponen idealnya cuma lihat:
                  `variant`, `size`, `fullWidth`, `disabled`, dan handler. Sekarang `secondary` dipakai buat netral,
                  sedangkan aksen kuning pindah ke `accent`.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="form-controls"
            title="Form Controls"
            badge="foundation"
            description="Batch awal komponen form dan surface yang paling sering dipakai: input, textarea, select, checkbox, switch, card, dan modal."
          >
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Local primitives</div>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-neutral-800">Field set yang konsisten</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(true)}>
                    Preview modal
                  </Button>
                </CardHeader>
                <CardBody>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Nama perusahaan"
                      placeholder="PT Contoh Nusantara"
                      hint="Contoh input standar dengan label dan hint."
                      prefixIcon={<MagniferIcon className="h-4 w-4" />}
                    />
                    <Input
                      label="Nomor referensi"
                      placeholder="Masukkan nomor referensi"
                      warning="Pastikan format sesuai sebelum lanjut."
                      prefixIcon={<MagniferIcon className="h-4 w-4" />}
                    />
                    <Input
                      label="Kode dokumen"
                      placeholder="Wajib diisi"
                      error="Field ini tidak boleh kosong."
                      prefixIcon={<MagniferIcon className="h-4 w-4" />}
                    />
                    <Select
                      label="Select Custom"
                      placeholder="Select a country..."
                      defaultValue=""
                      options={[
                        { label: "United States", value: "united-states", description: "North America" },
                        { label: "Canada", value: "canada", description: "North America" },
                        { label: "Mexico", value: "mexico", description: "North America" },
                        { label: "United Kingdom", value: "united-kingdom", description: "Europe" },
                        { label: "Germany", value: "germany", description: "Europe" },
                      ]}
                      searchable
                    />
                    <Select
                      label="Selected State"
                      placeholder="Select a country..."
                      defaultValue="united-states"
                      clearable
                      searchable
                      options={[
                        { label: "United States", value: "united-states", description: "North America" },
                        { label: "Canada", value: "canada", description: "North America" },
                        { label: "Mexico", value: "mexico", description: "North America" },
                        { label: "United Kingdom", value: "united-kingdom", description: "Europe" },
                        { label: "Germany", value: "germany", description: "Europe" },
                      ]}
                    />
                    <Textarea className="md:col-span-2" label="Keterangan" placeholder="Tulis catatan singkat..." hint="Textarea dipakai buat komentar atau catatan proses." />
                    <Checkbox
                      label="Aktifkan notifikasi perubahan"
                      hint="Pattern checkbox dibuat satuan supaya behavior dan spacing konsisten."
                      checked={demoChecked}
                      onChange={(event) => setDemoChecked(event.target.checked)}
                    />
                    <Switch
                      label="Auto save draft"
                      hint="Switch dipakai untuk state boolean yang lebih cepat dipahami."
                      checked={demoSwitch}
                      onChange={setDemoSwitch}
                    />
                  </div>
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm" onClick={() => setDemoChecked((current) => !current)}>
                    Toggle checkbox
                  </Button>
                  <Button variant="accent" size="sm" onClick={() => setDemoSwitch((current) => !current)}>
                    Toggle switch
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Surface</div>
                      <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-neutral-800">Card dasar</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-[12px] leading-6 text-neutral-700">
                      Card ini sengaja dibuat ringan: border lembut, radius konsisten, dan shadow tipis. Cocok buat
                      section, panel, atau summary kecil.
                    </p>
                  </CardBody>
                </Card>

                <Card className="border-brand-primary-100 bg-brand-primary-50/50">
                  <CardHeader>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-brand-primary-600">Modal</div>
                      <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-brand-primary-700">Dialog lokal</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-[12px] leading-6 text-neutral-700">
                      Modal dipisah sebagai primitive sendiri supaya flow panjang bisa dikontrol tanpa numpuk logika di
                      halaman.
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Modal
              open={demoModalOpen}
              onClose={() => setDemoModalOpen(false)}
              title="Preview Modal"
              description="Contoh dialog lokal yang nanti bisa dipakai ulang untuk flow panjang."
              footer={
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(false)}>
                    Tutup
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setDemoModalOpen(false)}>
                    Simpan
                  </Button>
                </div>
              }
            >
              <div className="space-y-3">
                <p className="text-[12px] leading-6 text-neutral-700">
                  Modal ini sengaja sederhana dulu, biar kita punya baseline buat ngerapihin dialog, confirm, dan
                  workflow yang lebih panjang ke depannya.
                </p>
                <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/40 p-3 text-[12px] text-neutral-700">
                  Status preview:
                  <span className="ml-1 font-semibold text-brand-primary-700">
                    checkbox {demoChecked ? "on" : "off"}, switch {demoSwitch ? "on" : "off"}
                  </span>
                </div>
              </div>
            </Modal>
          </Section>

          <Section
            id="icons"
            title="Icon Sample"
            badge="blocker"
            description="Preview kecil untuk ngecek ukuran icon dan stroke. Full library-nya ada di halaman /icon."
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="rounded-2xl border border-border-primary bg-background-primary/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-brand-primary-600">ArrowRightIcon</div>
                    <div className="mt-1 text-[11px] leading-5 text-neutral-600">Arah / navigasi</div>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-primary-600 shadow-sm">
                    <ArrowRightIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <IconButton aria-label="Preview ArrowRightIcon" variant="outline" size="sm">
                    <ArrowRightIcon className="h-4 w-4" />
                  </IconButton>
                  <div className="text-[11px] text-neutral-600">Ikon sample saja, bukan full library.</div>
                </div>
              </div>

              <Button asChild variant="outline" size="lg">
                <Link to="/icon">Buka full icon set</Link>
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-brand-primary-100 bg-brand-primary-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-primary-600 shadow-sm">
                  <MagniferIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-brand-primary-700">Pola pemakaian</div>
                  <p className="mt-1 text-[12px] leading-6 text-neutral-700">
                    Ke depan, icon sebaiknya dipakai sebagai komponen lokal juga, jadi halaman lain tinggal pilih nama
                    ikon tanpa nulis path SVG manual.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <section className="rounded-2xl border border-border-primary bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Quick Context</div>
                <h2 className="mt-1 text-[20px] font-semibold text-neutral-800">Kenapa halaman ini penting</h2>
                <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-600">
                  Supaya sebelum masuk ke mockup, kita punya tempat cek komponen inti, token, dan icon set. Jadi
                  setiap perubahan bisa dibandingkan di satu halaman yang sama.
                </p>
              </div>
              <div className="rounded-2xl bg-background-primary px-4 py-3 text-[12px] text-neutral-700">
                <div className="font-semibold text-brand-primary-700">Blocking focus</div>
                <div className="mt-1">Button, icon, token, lalu modal menyusul.</div>
              </div>
            </div>
          </section>
        </div>

        {dockRight && (
          <TocPanel
            dockLeft={dockLeft}
            tocCollapsed={tocCollapsed}
            mobileOpen={mobileTocOpen}
            tocMode={tocMode}
            search={search}
            setSearch={setSearch}
            filteredSections={filteredSections}
            onToggleCollapse={() => setTocCollapsed((current) => !current)}
            onMobileToggle={() => setMobileTocOpen((current) => !current)}
            onMobileClose={() => setMobileTocOpen(false)}
            onDockLeft={() => setTocSide("left")}
            onDockRight={() => setTocSide("right")}
          />
        )}

        {dockLeft && (
          <TocPanel
            dockLeft={dockLeft}
            tocCollapsed={tocCollapsed}
            mobileOpen={mobileTocOpen}
            tocMode={tocMode}
            search={search}
            setSearch={setSearch}
            filteredSections={filteredSections}
            onToggleCollapse={() => setTocCollapsed((current) => !current)}
            onMobileToggle={() => setMobileTocOpen((current) => !current)}
            onMobileClose={() => setMobileTocOpen(false)}
            onDockLeft={() => setTocSide("left")}
            onDockRight={() => setTocSide("right")}
          />
        )}
      </div>
    </div>
  );
}

