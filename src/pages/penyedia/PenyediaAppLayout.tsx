import { useEffect, useMemo, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShellFooter } from "../../components/ShellFooter";
import { ShellHeader } from "../../components/ShellHeader";
import { ArrowLeftIcon, DocumentsIcon, HomeIcon } from "../../components/Icons";
import { Tooltip } from "../../components/Tooltip";
import { IconButton } from "../../components/Button";
import { clearSmartFormRole, readSmartFormRole, writeSmartFormRole } from "../../lib/smartFormRole";
import { useState } from "react";

const BREADCRUMBS: Record<string, string> = {
  "/penyedia": "Penyedia / Dashboard Monitoring",
  "/penyedia/pengajuan": "Penyedia / Daftar Pengajuan",
  "/penyedia/detail": "Penyedia / Detail Pengajuan",
};

const MENU_ITEMS = [
  { to: "/penyedia", label: "Dashboard Analisis", icon: HomeIcon },
  { to: "/penyedia/pengajuan", label: "Daftar Pengajuan", icon: DocumentsIcon },
] as const;

export function PenyediaAppLayout() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const role = useMemo(() => readSmartFormRole(), [location.pathname]);
  const breadcrumb = BREADCRUMBS[location.pathname] ?? "Penyedia";
  const isDetail = location.pathname === "/penyedia/detail";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!role || role.role !== "penyedia") {
      writeSmartFormRole("penyedia");
    }
  }, [role]);

  const handleLogout = () => {
    clearSmartFormRole();
    void navigate({ to: "/smart-form" });
  };

  const action = isDetail ? (
    <Link
      to="/penyedia/pengajuan"
      search={{ kind: undefined, country: undefined, q: undefined }}
      className="inline-flex items-center gap-1.5 text-white/90 transition-colors hover:text-white"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span>Kembali</span>
    </Link>
  ) : undefined;

  return (
    <div className="flex min-h-full flex-col bg-background-secondary">
      <ShellHeader
        breadcrumb={breadcrumb}
        action={action}
        homeTo="/penyedia"
        onLogout={handleLogout}
        logoutDescription="Keluar role penyedia dan kembali ke pilih role Smart Form."
        showSwitchRole
      />

      <main className="flex-1 overflow-visible px-3 py-2 text-[clamp(5px,1vw,12px)] sm:px-4 sm:py-3">
        {isDetail ? (
          <Outlet />
        ) : (
          <section className="px-0 py-2 sm:py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
              <aside
                className={[
                  "sticky top-[72px] z-20 w-full shrink-0 self-start lg:top-[var(--shell-sticky-top)] lg:h-[calc(100dvh-var(--shell-sticky-top)-var(--shell-footer-height)-var(--shell-content-gap-y))]",
                  collapsed ? "lg:w-[84px]" : "lg:w-[240px]",
                ].join(" ")}
              >
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-primary bg-white p-3 shadow-sm">
                  <div className={["mb-3 flex items-center", collapsed ? "justify-center px-0" : "justify-between px-2"].join(" ")}>
                    {!collapsed ? (
                      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Menu</div>
                    ) : null}
                    <IconButton
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 w-8"
                      aria-label={collapsed ? "Buka menu sidebar" : "Ciutkan menu sidebar"}
                      onClick={() => setCollapsed((value) => !value)}
                    >
                      {collapsed ? <ArrowLeftIcon className="h-4 w-4 rotate-180" /> : <ArrowLeftIcon className="h-4 w-4" />}
                    </IconButton>
                  </div>
                  <nav
                    className={[
                      "flex flex-row gap-2 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible",
                      collapsed ? "lg:items-center" : "",
                    ].join(" ")}
                  >
                    {MENU_ITEMS.map((item) => {
                      const active =
                        item.to === "/penyedia"
                          ? location.pathname === "/penyedia"
                          : location.pathname.startsWith("/penyedia/pengajuan") || location.pathname === "/penyedia/detail";
                      const Icon = item.icon;
                      const itemClassName = [
                        "inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
                        collapsed ? "lg:justify-center lg:px-2" : "",
                        active
                          ? "bg-[#02275D] text-white"
                          : "text-neutral-700 hover:bg-brand-primary-50 hover:text-brand-primary-700",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <Tooltip key={item.to} content={item.label} placement="right" offset={10} disabled={!collapsed}>
                          <Link
                            to={item.to}
                            search={
                              item.to === "/penyedia/pengajuan"
                                ? { kind: undefined, country: undefined, q: undefined }
                                : undefined
                            }
                            className={itemClassName}
                          >
                            <span
                              className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-md",
                                active ? "bg-white text-[#02275D]" : "bg-brand-primary-50 text-brand-primary-600",
                              ].join(" ")}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            {!collapsed ? <span className="whitespace-nowrap">{item.label}</span> : null}
                          </Link>
                        </Tooltip>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <Outlet />
              </div>
            </div>
          </section>
        )}
      </main>
      <ShellFooter />
    </div>
  );
}

export function PenyediaSectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["overflow-hidden rounded-2xl border border-border-primary bg-white shadow-sm", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-neutral-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12px] leading-5 text-neutral-600">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

export function AiFlagChip({ label, tone }: { label: string; tone: "green" | "yellow" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "green"
          ? "bg-success-50 text-success-700 ring-1 ring-success-100"
          : "bg-warning-50 text-warning-700 ring-1 ring-warning-100",
      ].join(" ")}
    >
      <span aria-hidden="true">{tone === "green" ? "🟢" : "🟡"}</span>
      {label}
    </span>
  );
}
