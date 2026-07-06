import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/Button";
import { MagniferIcon } from "../components/Icons";

const REMOTE_ICON_CSS = "http://10.239.19.47/assets/index-BqmRyuLl.css";
const ICON_STYLE_ID = "insw-icon-page-style";
const ICON_LINK_ID = "insw-icon-page-link";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getCardHeader(card: HTMLElement) {
  return card.firstElementChild as HTMLElement | null;
}

function getIconButtons(card: HTMLElement) {
  const body = card.querySelector(".insw-icon-card-body") || card;
  return Array.from(body.querySelectorAll<HTMLButtonElement>("button[data-icon-name]"));
}

function getRawIconButtons(card: HTMLElement) {
  const body = card.querySelector(".insw-icon-card-body") || card;
  return Array.from(body.querySelectorAll<HTMLButtonElement>("button[title]"));
}

function getCountNode(card: HTMLElement) {
  const header = getCardHeader(card);
  if (!header) return null;
  return Array.from(header.querySelectorAll<HTMLParagraphElement>("p")).find((node) => /^\d+$/.test(node.textContent || "")) || null;
}

function ensureCardStructure(card: HTMLElement) {
  if (card.dataset.enhanced === "true") return;
  const header = getCardHeader(card);
  if (!header) return;

  const children = Array.from(card.children);
  const headerNodes = children.slice(0, 1);
  const bodyNodes = children.slice(1);
  const body = document.createElement("div");
  body.className = "insw-icon-card-body";
  bodyNodes.forEach((node) => body.appendChild(node));

  headerNodes.forEach((node) => node.classList.add("insw-icon-card-header"));
  const headerRow = header.querySelector('[data-flex="true"]') as HTMLElement | null;
  const titleGroup = header.querySelector("h2")?.parentElement as HTMLElement | null;
  if (headerRow && titleGroup && !header.querySelector(".insw-icon-card-toolbar")) {
    const toolbar = document.createElement("div");
    toolbar.className = "insw-icon-card-toolbar";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "insw-icon-card-toggle";
    toggle.setAttribute("aria-label", "Toggle icon category");
    toggle.textContent = "-";
    toggle.addEventListener("click", () => {
      const collapsed = body.classList.toggle("is-collapsed");
      toggle.textContent = collapsed ? "+" : "-";
    });

    toolbar.appendChild(toggle);
    headerRow.appendChild(toolbar);
  }

  card.appendChild(body);
  card.dataset.enhanced = "true";

  const buttons = getRawIconButtons(card);
  buttons.forEach((button) => {
    const iconName = button.getAttribute("title") || button.getAttribute("aria-label") || "";
    if (!iconName) return;

    button.dataset.iconName = iconName;
    button.removeAttribute("title");
    button.classList.add("insw-icon-copy-button");

    const tip = button.lastElementChild as HTMLElement | null;
    if (tip) {
      tip.classList.add("insw-icon-tooltip");
      tip.dataset.tooltipDefault = iconName;
      tip.textContent = iconName;
    }

    if (!button.dataset.copyBound) {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(iconName);
          if (tip) {
            tip.textContent = "Copied";
            window.setTimeout(() => {
              tip.textContent = iconName;
            }, 1200);
          }
        } catch {
          if (tip) tip.textContent = iconName;
        }
      });
      button.dataset.copyBound = "true";
    }
  });
}

function applyIconSearch(root: HTMLElement, query: string) {
  const q = normalize(query);
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-card="true"]'));
  let visibleIcons = 0;

  cards.forEach((card) => {
    ensureCardStructure(card);

    const buttons = getIconButtons(card);
    let cardMatches = 0;

    buttons.forEach((button) => {
      const iconName = normalize(button.dataset.iconName || button.getAttribute("title") || button.getAttribute("aria-label") || "");
      const match = !q || iconName.includes(q);
      button.classList.toggle("insw-icon-hidden", !match);
      button.classList.toggle("insw-icon-match", match && Boolean(q));
      if (match) cardMatches += 1;
    });

    card.classList.toggle("insw-icon-hidden", cardMatches === 0);
    const countNode = getCountNode(card);
    if (countNode) countNode.textContent = String(cardMatches);
    visibleIcons += cardMatches;
  });

  const existingEmpty = root.querySelector("#insw-icon-empty");
  if (q && visibleIcons === 0) {
    let empty = existingEmpty as HTMLDivElement | null;
    if (!empty) {
      empty = document.createElement("div");
      empty.id = "insw-icon-empty";
      empty.className = "insw-icon-empty";
      root.appendChild(empty);
    }
    empty.textContent = `No icons found matching "${query}"`;
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
}

function ensureIconStyles() {
  if (!document.getElementById(ICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = ICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = REMOTE_ICON_CSS;
    document.head.appendChild(link);
  }

  if (!document.getElementById(ICON_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = ICON_STYLE_ID;
    style.textContent = `
      .insw-icon-embed {
        padding: 8px 12px 12px;
      }
      .insw-icon-embed > div:first-child {
        max-width: 100%;
      }
      .insw-icon-embed [data-container="true"] {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }
      .insw-icon-embed input[placeholder="Search icons by name..."] {
        display: none !important;
      }
      .insw-icon-embed input[placeholder="Search icons by name..."] + [data-text="true"] {
        display: none !important;
      }
      .insw-icon-embed .insw-icon-empty {
        margin: 16px 0 18px;
        padding: 18px;
        border: 1px dashed #dbd8d8;
        border-radius: 16px;
        color: #5f5f5f;
        background: #fafaf9;
        font-size: 12px;
      }
      .insw-icon-embed .insw-icon-hidden {
        display: none !important;
      }
      .insw-icon-embed .insw-icon-match {
        outline: 2px solid rgba(3, 83, 164, 0.12);
        outline-offset: 2px;
        border-radius: 12px;
      }
      .insw-icon-embed [data-badge="true"] {
        padding: 0.3rem 0.65rem !important;
        border-radius: 9999px !important;
        border: 1px solid #dbeafe !important;
        background: #eff6ff !important;
        color: #0353a4 !important;
        font-size: 0.75rem !important;
        line-height: 1 !important;
      }
      .insw-icon-embed [data-card="true"] {
        margin-bottom: 12px;
        border: 1px solid #ececec !important;
        border-radius: 24px !important;
        background: #fff !important;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
        overflow: hidden;
      }
      .insw-icon-embed .insw-icon-card-header {
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 12px 16px 10px;
        background: linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(255,255,255,0.92));
        backdrop-filter: blur(10px);
      }
      .insw-icon-embed .insw-icon-card-header h2 {
        margin: 0;
        font-size: 20px !important;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: #1f2937;
      }
      .insw-icon-embed .insw-icon-card-header p {
        margin: 0;
      }
      .insw-icon-embed .insw-icon-card-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .insw-icon-embed .insw-icon-card-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #dbeafe;
        border-radius: 12px;
        background: #f8fbff;
        color: #0353a4;
        cursor: pointer;
      }
      .insw-icon-embed .insw-icon-card-body {
        padding: 0 16px 14px;
      }
      .insw-icon-embed .insw-icon-card-body.is-collapsed {
        display: none !important;
      }
      .insw-icon-embed .insw-icon-grid {
        gap: 14px 16px !important;
      }
      .insw-icon-embed .insw-icon-copy-button {
        cursor: copy;
      }
      .insw-icon-embed .insw-icon-tooltip {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
}

export function IconPage() {
  const [markup, setMarkup] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureIconStyles();
  }, []);

  useEffect(() => {
    let alive = true;

    fetch("/iconhtml.txt")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load iconhtml.txt (${response.status})`);
        }
        return response.text();
      })
      .then((text) => {
        if (alive) setMarkup(text);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Gagal memuat iconhtml.txt");
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root || !markup) return;

    const remoteSearchInput = root.querySelector<HTMLInputElement>('input[placeholder="Search icons by name..."]');
    const searchRow = remoteSearchInput?.closest("div") as HTMLElement | null;
    if (searchRow) searchRow.style.display = "none";

    const firstBlock = root.querySelector<HTMLElement>('[data-card="true"]');
    if (firstBlock) firstBlock.style.marginTop = "0";

    applyIconSearch(root, search);
  }, [markup, search]);

  return (
    <div className="min-w-0 flex-1 space-y-4 px-1 py-1 sm:px-0 sm:py-0">
      <div className="rounded-2xl border border-border-primary bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Icon Library</div>
            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] text-neutral-800 sm:text-[36px]">
              Full Icon Set
            </h1>
            <p className="mt-3 text-[12px] leading-6 text-neutral-600">
              Ini halaman penuh untuk cek semua ikon yang ditarik dari DS client. `/component` tetap jadi sample,
              sedangkan halaman ini khusus buat icon browsing dan validasi visual.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/component">Kembali ke component</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <a href="http://10.239.19.47/icon" target="_blank" rel="noreferrer">
                Buka sumber asli
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-700">Search icons</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex w-10 items-center justify-center text-neutral-500">
                <MagniferIcon className="h-4 w-4" />
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search icons by name..."
                className="h-10 w-full rounded-md border border-border-primary bg-white pl-10 pr-3 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
              />
            </div>
          </div>
          <div className="text-[12px] text-neutral-600">Cari nama icon lalu preview yang cocok akan langsung terfilter.</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-neutral-700">
          <span className="inline-flex items-center rounded-full bg-brand-primary-50 px-3 py-1 font-semibold text-brand-primary-700">
            loaded from iconhtml.txt
          </span>
          <span className="inline-flex items-center rounded-full bg-success-300/30 px-3 py-1 font-semibold text-success-600">
            local preview
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error-500 bg-error-500/10 p-4 text-[12px] text-error-600">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-sm">
          <div className="border-b border-border-primary px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">Library preview</div>
            <div className="mt-1 text-[12px] text-neutral-600">
              Satu halaman penuh, tanpa iframe, jadi scroll dan interaksi icon lebih natural.
            </div>
          </div>
          <div ref={shellRef} className="insw-icon-embed" dangerouslySetInnerHTML={{ __html: markup }} />
        </div>
      )}
    </div>
  );
}
