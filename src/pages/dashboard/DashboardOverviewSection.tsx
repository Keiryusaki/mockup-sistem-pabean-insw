import { ProposalSummaryCards } from "./ProposalSummaryCards";
import {
  DashboardAnnouncements,
  DashboardHero,
  DashboardNotifications,
  DashboardSectionTitle,
} from "./DashboardPanels";
import { systemAnnouncements, systemNotifications } from "./dashboardData";

type DashboardOverviewSectionProps = {
  onCreate: () => void;
};

export function DashboardOverviewSection({ onCreate }: DashboardOverviewSectionProps) {
  return (
    <>
      <DashboardHero onCreate={onCreate} />

      <DashboardSectionTitle />

      <ProposalSummaryCards />

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardNotifications items={systemNotifications} />
        <DashboardAnnouncements items={systemAnnouncements} />
      </div>
    </>
  );
}
