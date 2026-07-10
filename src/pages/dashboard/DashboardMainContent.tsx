import { DashboardOverviewSection } from "./DashboardOverviewSection";
import { DashboardResourcesSection } from "./DashboardResourcesSection";
import { DashboardLaunchersModals } from "./DashboardLaunchersModals";
import { useDashboardLaunchers } from "./useDashboardLaunchers";

export function DashboardMainContent() {
  const launchers = useDashboardLaunchers();

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-primary bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5 lg:px-5">
      <DashboardOverviewSection onCreate={() => launchers.setLauncherOpen(true)} />
      <DashboardResourcesSection />
      <DashboardLaunchersModals launchers={launchers} />
    </div>
  );
}
