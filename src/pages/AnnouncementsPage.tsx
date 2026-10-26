import { useState } from "react";
import { systemAnnouncements, type SystemAnnouncement } from "./dashboard/dashboardData";
import { SystemInfoIndexLayout, usePagedItems } from "./dashboard/SystemInfoIndexLayout";
import { AnnouncementDetailModal, AnnouncementItem } from "./dashboard/SystemInfoItems";

export function AnnouncementsPage() {
  const { query, setQuery, page, totalPages, totalCount, visibleItems, setPage } = usePagedItems(
    systemAnnouncements,
    (item) => `${item.title} ${item.category} ${item.note} ${item.content.join(" ")}`,
  );
  const [activeItem, setActiveItem] = useState<SystemAnnouncement | null>(null);

  return (
    <>
      <SystemInfoIndexLayout
        eyebrow="Pengumuman"
        title="Semua Pengumuman"
        subtitle="Informasi resmi terkait layanan, jadwal, dan pembaruan dokumen."
        searchPlaceholder="Cari pengumuman..."
        query={query}
        onQueryChange={setQuery}
        page={page}
        totalPages={totalPages}
        visibleCount={visibleItems.length}
        totalCount={totalCount}
        unitLabel="pengumuman"
        onPageChange={setPage}
      >
        {visibleItems.map((item) => (
          <AnnouncementItem key={item.id} item={item} onOpen={setActiveItem} />
        ))}
      </SystemInfoIndexLayout>
      <AnnouncementDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}
