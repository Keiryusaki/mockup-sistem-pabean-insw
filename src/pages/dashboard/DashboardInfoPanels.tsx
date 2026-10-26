import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { DownloadIcon, EyeIcon, MagniferIcon as SearchIcon, DocumentsIcon } from "../../components/Icons";
import type { SystemAnnouncement, SystemNotification } from "./dashboardData";
import { AnnouncementDetailModal, AnnouncementItem, NotificationItem } from "./SystemInfoItems";

const DASHBOARD_PREVIEW_COUNT = 3;

export function DashboardNotifications({ items }: { items: SystemNotification[] }) {
  return (
    <section className="rounded-lg border border-border-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-600">Notifikasi Sistem</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
            Informasi terbaru untuk dipantau tim
          </h5>
          <p className="mt-1 text-[12px] text-neutral-600">
            Daftar notifikasi yang penting untuk memantau kondisi pengajuan dan layanan.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit whitespace-nowrap">
          <Link to="/notifikasi" search={{ page: undefined, q: undefined }}>Lihat Semua</Link>
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, DASHBOARD_PREVIEW_COUNT).map((item) => (
          <NotificationItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function DashboardAnnouncements({ items }: { items: SystemAnnouncement[] }) {
  const [activeItem, setActiveItem] = useState<SystemAnnouncement | null>(null);

  return (
    <section className="rounded-lg border border-border-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-600">Pengumuman</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
            Informasi resmi dari sistem
          </h5>
          <p className="mt-1 text-[12px] text-neutral-600">
            Pengumuman yang berkaitan dengan layanan, jadwal, dan pembaruan dokumen.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit whitespace-nowrap">
          <Link to="/pengumuman" search={{ page: undefined, q: undefined }}>Selengkapnya</Link>
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, DASHBOARD_PREVIEW_COUNT).map((item) => (
          <AnnouncementItem key={item.id} item={item} onOpen={setActiveItem} />
        ))}
      </div>

      <AnnouncementDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
    </section>
  );
}

export function DashboardGuides({ items }: { items: Array<{ file: string; title: string; description: string }> }) {
  return (
    <section className="mt-4 rounded-lg border border-border-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-600">Panduan Penggunaan</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
            User manual dan referensi ringkas
          </h5>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.file} className="flex h-full flex-col rounded-lg border border-border-primary bg-background-primary/35 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-primary-50 p-2 text-brand-primary-700">
                <DocumentsIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h6 className="text-[14px] font-semibold leading-snug text-neutral-800">{item.title}</h6>
                <p className="mt-2 text-[12px] leading-5 text-neutral-600">{item.description}</p>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <Button variant="outline" size="sm" startIcon={<EyeIcon />}>
                Lihat PDF
              </Button>
              <Button variant="primary" size="sm" startIcon={<DownloadIcon />}>
                Unduh
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DashboardPdfExamples({
  items,
  query,
  onQueryChange,
}: {
  items: Array<{ file: string; title: string; note: string }>;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="mt-4 rounded-lg border border-border-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-600">Contoh Dokumen PDF</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">
            Contoh file PDF yang sering dipakai
          </h5>
        </div>
        <div className="relative w-full sm:max-w-[320px]">
          <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-neutral-500">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            type="search"
            placeholder="Cari contoh PDF..."
            className="h-11 w-full rounded-md border border-border-primary bg-white pl-10 pr-3 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.file} className="flex h-full flex-col rounded-lg border border-border-primary bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-primary-600">PDF</div>
                <h6 className="mt-2 text-[16px] font-semibold leading-snug text-neutral-800">{item.title}</h6>
              </div>
              <div className="rounded-md bg-brand-primary-50 px-2 py-1 text-[11px] font-semibold text-brand-primary-600">
                File
              </div>
            </div>

            <p className="mt-3 text-[12px] leading-5 text-neutral-700">{item.note}</p>

            <div className="mt-4 rounded-md border border-border-primary bg-neutral-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-600">Nama File</div>
              <div className="mt-1 break-all text-[12px] font-medium text-neutral-800">{item.file}</div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <Button variant="outline" size="sm">
                Lihat
              </Button>
              <Button variant="primary" size="sm">
                Unduh
              </Button>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-border-secondary bg-white p-6 text-center text-[12px] text-neutral-600">
          Tidak ada contoh PDF yang cocok dengan pencarian.
        </div>
      )}
    </section>
  );
}
