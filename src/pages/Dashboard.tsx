import { DashboardSidebar } from "./dashboard/DashboardSidebar";
import { DashboardMainContent } from "./dashboard/DashboardMainContent";

export { DashboardSidebar };

export function Dashboard() {
  return (
    <section className="px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        <DashboardSidebar />
        <DashboardMainContent />
      </div>
    </section>
  );
}









