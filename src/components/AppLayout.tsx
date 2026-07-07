import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShellFooter } from "./ShellFooter";
import { ShellHeader } from "./ShellHeader";
import { FeedbackWidget } from "./FeedbackWidget";

const BREADCRUMBS: Record<string, string> = {
  "/": "Dashboard / Ringkasan Pengajuan",
  "/data": "Data Pengajuan / Daftar Pengajuan",
  "/progress": "Data Pengajuan / Progress Pengajuan",
  "/form": "Form Pengajuan",
  "/loading": "Loading State",
  "/component": "Live Docs / Komponen Lokal",
  "/icon": "Live Docs / Icon Set",
  "/feedback": "Info / Feedback Inbox",
  "/changelog": "Info / Change Log",
};

export function AppLayout() {
  const { location } = useRouterState();
  const breadcrumb = BREADCRUMBS[location.pathname] ?? "Mockup";
  const action =
    location.pathname === "/form" || location.pathname === "/progress" ? (
      <Link to="/data" search={{ status: undefined } as never} className="text-white/90 transition-colors hover:text-white">
        &lt; Kembali
      </Link>
    ) : undefined;

  return (
    <div className="flex min-h-full flex-col bg-background-secondary">
      <ShellHeader breadcrumb={breadcrumb} action={action} />
      <main className="flex-1 overflow-visible px-3 py-2 text-[clamp(5px,1vw,12px)] sm:px-4 sm:py-3">
        <Outlet />
      </main>
      <ShellFooter />
      <FeedbackWidget />
    </div>
  );
}
