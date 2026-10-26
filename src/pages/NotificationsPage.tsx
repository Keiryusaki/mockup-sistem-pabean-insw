import { systemNotifications } from "./dashboard/dashboardData";
import { SystemInfoIndexLayout, usePagedItems } from "./dashboard/SystemInfoIndexLayout";
import { NotificationItem } from "./dashboard/SystemInfoItems";

export function NotificationsPage() {
  const { query, setQuery, page, totalPages, totalCount, visibleItems, setPage } = usePagedItems(
    systemNotifications,
    (item) => `${item.title} ${item.note} ${item.badge} ${item.pengajuan}`,
  );

  return (
    <SystemInfoIndexLayout
      eyebrow="Notifikasi Sistem"
      title="Semua Notifikasi"
      subtitle="Klik notifikasi untuk membuka progres pengajuan terkait."
      searchPlaceholder="Cari notifikasi atau nomor pengajuan..."
      query={query}
      onQueryChange={setQuery}
      page={page}
      totalPages={totalPages}
      visibleCount={visibleItems.length}
      totalCount={totalCount}
      unitLabel="notifikasi"
      onPageChange={setPage}
    >
      {visibleItems.map((item) => (
        <NotificationItem key={item.id} item={item} />
      ))}
    </SystemInfoIndexLayout>
  );
}
