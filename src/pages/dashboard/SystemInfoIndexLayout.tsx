import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Input } from "../../components/FormControls";
import { MagniferIcon } from "../../components/Icons";
import { Pagination } from "../../components/Pagination";
import { DashboardSidebar } from "./DashboardSidebar";

export const SYSTEM_INFO_PAGE_SIZE = 5;

type SystemInfoSearch = { page?: number; q?: string };

export function usePagedItems<T>(items: T[], toSearchText: (item: T) => string) {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const search = (location.search ?? {}) as SystemInfoSearch;
  const query = search.q ?? "";
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => toSearchText(item).toLowerCase().includes(normalizedQuery))
    : items;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / SYSTEM_INFO_PAGE_SIZE));
  const page = Math.min(Math.max(1, search.page ?? 1), totalPages);
  const startIndex = (page - 1) * SYSTEM_INFO_PAGE_SIZE;

  const updateSearch = (next: SystemInfoSearch, replace = false) =>
    navigate({
      to: location.pathname,
      search: { page: next.page && next.page > 1 ? next.page : undefined, q: next.q || undefined } as never,
      replace,
    });

  return {
    query,
    page,
    totalPages,
    totalCount: filteredItems.length,
    visibleItems: filteredItems.slice(startIndex, startIndex + SYSTEM_INFO_PAGE_SIZE),
    setPage: (target: number) => updateSearch({ page: target, q: query }),
    setQuery: (value: string) => updateSearch({ page: 1, q: value }, true),
  };
}

type SystemInfoIndexLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  page: number;
  totalPages: number;
  visibleCount: number;
  totalCount: number;
  unitLabel: string;
  onPageChange: (page: number) => void;
  children: ReactNode;
};

export function SystemInfoIndexLayout({
  eyebrow,
  title,
  subtitle,
  searchPlaceholder,
  query,
  onQueryChange,
  page,
  totalPages,
  visibleCount,
  totalCount,
  unitLabel,
  onPageChange,
  children,
}: SystemInfoIndexLayoutProps) {
  return (
    <section className="px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-primary bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5 lg:px-5">
          <div className="flex flex-col gap-4 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">{eyebrow}</div>
              <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">{title}</h5>
              <p className="mt-1 text-[12px] text-neutral-600">{subtitle}</p>
            </div>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              type="search"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              prefixIcon={<MagniferIcon className="h-4 w-4" />}
              className="w-full sm:max-w-[320px]"
            />
          </div>

          <div className="mt-4 space-y-3">{children}</div>

          {totalCount === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border-secondary bg-white p-6 text-center text-[12px] text-neutral-600">
              {query ? `Tidak ada ${unitLabel} yang cocok dengan "${query}".` : `Belum ada ${unitLabel}.`}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] text-neutral-600">
              Menampilkan <span className="font-semibold text-neutral-800">{visibleCount}</span> dari{" "}
              <span className="font-semibold text-neutral-800">{totalCount}</span> {unitLabel}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </div>
      </div>
    </section>
  );
}
