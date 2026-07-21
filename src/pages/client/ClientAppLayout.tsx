import { useEffect, useMemo, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShellFooter } from "../../components/ShellFooter";
import { ShellHeader } from "../../components/ShellHeader";
import { ArrowLeftIcon } from "../../components/Icons";
import {
  clearClientSession,
  hasClientContext,
  readClientSession,
} from "../../lib/clientAuth";

const BREADCRUMBS: Record<string, string> = {
  "/client/pengajuan": "Client App / Daftar Pengajuan",
  "/client/tracking": "Client App / Tracking Pengajuan",
};

export function ClientAppLayout() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const session = useMemo(() => readClientSession(), [location.pathname]);
  const ready = hasClientContext(session);

  useEffect(() => {
    if (!session?.identity) {
      void navigate({ to: "/client/login" });
      return;
    }
    if (!hasClientContext(session)) {
      void navigate({ to: "/client/relasi" });
    }
  }, [navigate, session]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background-secondary px-4 text-[13px] text-neutral-600">
        Menyiapkan sesi Client App...
      </div>
    );
  }

  const breadcrumb = BREADCRUMBS[location.pathname] ?? "Client App";
  const action =
    location.pathname === "/client/tracking" ? (
      <Link
        to="/client/pengajuan"
        search={{ status: undefined }}
        className="inline-flex items-center gap-1.5 text-white/90 transition-colors hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Kembali</span>
      </Link>
    ) : undefined;

  const handleLogout = () => {
    clearClientSession();
    void navigate({ to: "/client/login" });
  };

  return (
    <div className="flex min-h-full flex-col bg-background-secondary">
      <ShellHeader
        breadcrumb={breadcrumb}
        action={action}
        homeTo="/client/pengajuan"
        onLogout={handleLogout}
        logoutDescription="Keluar dari Client App dan tampilkan proses login lagi."
      />
      <main className="flex-1 overflow-visible px-3 py-2 text-[clamp(5px,1vw,12px)] sm:px-4 sm:py-3">
        <Outlet />
      </main>
      <ShellFooter />
    </div>
  );
}

export function ClientSectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border-primary bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-neutral-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12px] leading-5 text-neutral-600">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}
