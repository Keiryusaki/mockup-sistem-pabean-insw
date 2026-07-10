import { Link, useRouterState } from "@tanstack/react-router";
import { IconButton } from "../../components/Button";
import { ArrowLeftIcon, ArrowRightIcon, DocumentsIcon, HomeIcon } from "../../components/Icons";
import { Tooltip } from "../../components/Tooltip";
import { useState } from "react";

const MENU_ITEMS = [
  { to: "/", label: "Dashboard", icon: HomeIcon },
  { to: "/data", label: "Data Pengajuan", icon: DocumentsIcon },
] as const;

function SidebarIcon({ active, Icon }: { active?: boolean; Icon: typeof HomeIcon }) {
  return (
    <span
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md",
        active ? "bg-white text-[#02275D]" : "bg-brand-primary-50 text-brand-primary-600",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function DashboardSidebar() {
  const { location } = useRouterState();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={[
        "sticky top-[72px] z-20 w-full shrink-0 self-start lg:top-[var(--shell-sticky-top)] lg:h-[calc(100dvh-var(--shell-sticky-top)-var(--shell-footer-height)-var(--shell-content-gap-y))]",
        collapsed ? "lg:w-[84px]" : "lg:w-[240px]",
      ].join(" ")}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-primary bg-white p-3 shadow-sm">
        <div className={["mb-3 flex items-center", collapsed ? "justify-center px-0" : "justify-between px-2"].join(" ")}>
          {!collapsed ? <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Menu</div> : null}
          <IconButton
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-8"
            aria-label={collapsed ? "Buka menu sidebar" : "Ciutkan menu sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ArrowRightIcon className="h-4 w-4" /> : <ArrowLeftIcon className="h-4 w-4" />}
          </IconButton>
        </div>
        <nav className={["flex flex-row gap-2 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible", collapsed ? "lg:items-center" : ""].join(" ")}>
          {MENU_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            const itemClassName = [
              "inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
              collapsed ? "lg:justify-center lg:px-2" : "",
              active ? "bg-[#02275D] text-white" : "text-neutral-700 hover:bg-brand-primary-50 hover:text-brand-primary-700",
            ]
              .filter(Boolean)
              .join(" ");
            const content = (
              <>
                <SidebarIcon Icon={Icon} active={active} />
                {!collapsed ? <span className="whitespace-nowrap">{item.label}</span> : null}
              </>
            );

            return (
              <Tooltip key={item.to} content={item.label} placement="right" offset={10} disabled={!collapsed}>
                <Link to={item.to} className={itemClassName}>
                  {content}
                </Link>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
