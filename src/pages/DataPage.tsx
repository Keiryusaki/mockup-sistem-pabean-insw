import { DashboardSidebar } from "./Dashboard";
import { DashboardLaunchersModals } from "./dashboard/DashboardLaunchersModals";
import { ProposalListTable } from "./dashboard/ProposalListTable";
import { useDashboardLaunchers } from "./dashboard/useDashboardLaunchers";

export function DataPage() {
  const launchers = useDashboardLaunchers();

  return (
    <section className="px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        <DashboardSidebar />
        <ProposalListTable
          title="Daftar Pengajuan"
          subtitle="Tabel daftar pengajuan yang sebelumnya tampil di beranda operasional."
        />
      </div>
      <DashboardLaunchersModals launchers={launchers} />
    </section>
  );
}
