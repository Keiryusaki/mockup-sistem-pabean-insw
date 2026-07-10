import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Input, Select } from "../../components/FormControls";
import { AddSquareIcon, CopyIcon, EyeIcon, MagniferIcon, PenNewSquareIcon, ProgressIcon, TrashBinTrashIcon } from "../../components/Icons";
import { proposalBadgeVariant, proposalRows, proposalStatusMeta, type ProposalStatus } from "./dashboardData";

type ProposalListTableProps = {
  title?: string;
  subtitle?: string;
};

export function ProposalListTable({
  title = "Daftar Pengajuan",
  subtitle = "Berisi daftar pengajuan yang tampil pada halaman beranda operasional.",
}: ProposalListTableProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [searchDraft, setSearchDraft] = useState("");
  const [documentTypeDraft, setDocumentTypeDraft] = useState("Semua");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedDocumentTypeFilter, setAppliedDocumentTypeFilter] = useState("Semua");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const searchParams = new URLSearchParams(location.search);
  const rawStatusFilter = searchParams.get("status") as "Semua" | ProposalStatus | "Disetujui" | null;
  const statusFilter = rawStatusFilter === "Disetujui" ? "Selesai" : rawStatusFilter ?? "Semua";
  const documentTypeOptions = useMemo(() => ["Semua", ...new Set(proposalRows.map((row) => row.dokumen))], []);
  const filteredRows = useMemo(() => {
    const normalized = appliedSearchQuery.trim().toLowerCase();
    const fromDate = appliedDateFrom ? new Date(`${appliedDateFrom}T00:00:00`) : null;
    const toDate = appliedDateTo ? new Date(`${appliedDateTo}T23:59:59.999`) : null;

    return proposalRows.filter((row) => {
      const matchesStatus = statusFilter === "Semua" || row.status === statusFilter;
      const matchesDocType = appliedDocumentTypeFilter === "Semua" || row.dokumen === appliedDocumentTypeFilter;
      const rowDate = row.kirimAt ? new Date(row.kirimAt) : null;
      const matchesFrom = !fromDate || (rowDate ? rowDate >= fromDate : false);
      const matchesTo = !toDate || (rowDate ? rowDate <= toDate : false);
      const matchesQuery =
        !normalized ||
        `${row.pengajuan} ${row.dokumen} ${row.kirim} ${row.perusahaan} ${row.status}`.toLowerCase().includes(normalized);

      return matchesStatus && matchesDocType && matchesFrom && matchesTo && matchesQuery;
    });
  }, [appliedDateFrom, appliedDateTo, appliedDocumentTypeFilter, appliedSearchQuery, statusFilter]);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);
  const visibleRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows]);
  const summaryItems: Array<"Semua" | ProposalStatus> = ["Semua", "Draft", "Proses", "Selesai", "Ditolak"];
  const summaryCounts: Record<"Semua" | ProposalStatus, number> = {
    Semua: proposalRows.length,
    Draft: proposalRows.filter((row) => row.status === "Draft").length,
    Proses: proposalRows.filter((row) => row.status === "Proses").length,
    Selesai: proposalRows.filter((row) => row.status === "Selesai").length,
    Ditolak: proposalRows.filter((row) => row.status === "Ditolak").length,
  };

  useEffect(() => {
    setPageIndex(1);
  }, [appliedDateFrom, appliedDateTo, appliedDocumentTypeFilter, appliedSearchQuery, statusFilter]);

  const hasPendingFilterChanges =
    searchDraft !== appliedSearchQuery ||
    documentTypeDraft !== appliedDocumentTypeFilter ||
    dateFromDraft !== appliedDateFrom ||
    dateToDraft !== appliedDateTo;
  const hasAppliedFilters =
    appliedSearchQuery.trim() !== "" ||
    appliedDocumentTypeFilter !== "Semua" ||
    appliedDateFrom !== "" ||
    appliedDateTo !== "";
  const canResetFilters = hasPendingFilterChanges || hasAppliedFilters;

  const applyFilters = () => {
    setAppliedSearchQuery(searchDraft);
    setAppliedDocumentTypeFilter(documentTypeDraft);
    setAppliedDateFrom(dateFromDraft);
    setAppliedDateTo(dateToDraft);
  };

  const resetFilters = () => {
    setSearchDraft("");
    setDocumentTypeDraft("Semua");
    setDateFromDraft("");
    setDateToDraft("");
    setAppliedSearchQuery("");
    setAppliedDocumentTypeFilter("Semua");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-primary bg-white px-3 py-4 shadow-sm sm:px-4 sm:py-5 lg:px-5">
      <div className="flex flex-col gap-4 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Data Pengajuan</div>
          <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">{title}</h5>
          <p className="mt-1 text-[12px] text-neutral-600">{subtitle}</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {summaryItems.map((status) => {
          const meta = proposalStatusMeta[status];
          const active = statusFilter === status;
          return (
            <Link
              key={status}
              to="/data"
              search={{ status: status === "Semua" ? undefined : status } as never}
              className={`group rounded-xl border p-3 text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] ${
                active ? `${meta.activeTone} border-transparent` : `${meta.tone} ${meta.borderTone}`
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.14em] opacity-80">Filter</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight">{meta.label}</div>
                  <div className="mt-1 text-[28px] font-semibold leading-none">{summaryCounts[status]}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${active ? "bg-white/20" : "bg-white/60"}`}>
                  {active ? "Aktif" : "Lihat"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 border-b border-border-primary pb-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div className="md:col-span-2 xl:col-span-2">
            <Input
              value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            type="search"
            placeholder="Cari pengajuan..."
            prefixIcon={<MagniferIcon className="h-4 w-4" />}
          />
        </div>
          <Select
            value={documentTypeDraft}
            onValueChange={setDocumentTypeDraft}
            options={documentTypeOptions.map((item) => ({ label: item, value: item }))}
          />
          <Input
            value={dateFromDraft}
            onChange={(event) => setDateFromDraft(event.target.value)}
            type="date"
            placeholder="Tanggal awal"
          />
          <Input
            value={dateToDraft}
            onChange={(event) => setDateToDraft(event.target.value)}
            type="date"
            placeholder="Tanggal akhir"
          />
          <div className="md:col-span-2 xl:col-span-1 xl:self-end">
            <div className="flex flex-wrap justify-end gap-2 xl:pt-0">
              <Button variant="outline" size="md" className="h-11" onClick={resetFilters} disabled={!canResetFilters}>
                Reset
              </Button>
              <Button variant="primary" size="md" className="h-11" onClick={applyFilters} disabled={!hasPendingFilterChanges}>
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-b border-border-primary pb-2">
        <div className="text-[12px] text-neutral-600">
          Menampilkan <span className="font-semibold text-neutral-800">{filteredRows.length}</span> data pengajuan
        </div>
        <Button
          variant="primary"
          size="sm"
          startIcon={<AddSquareIcon className="h-4 w-4" />}
          className="!border-brand-primary-800 !bg-brand-primary-800 hover:!border-brand-primary-700 hover:!bg-brand-primary-700"
          onClick={() => navigate({ to: location.pathname, search: { launcher: "1" } as never })}
        >
          Pengajuan
        </Button>
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border border-border-primary">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-full border-collapse text-left text-[12px]">
            <thead className="bg-brand-primary-500 text-white">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Nomor Pengajuan</th>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Jenis Dokumen</th>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Tanggal Kirim Dokumen</th>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
                <th className="whitespace-nowrap px-3 py-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {visibleRows.map((row) => (
                <tr key={row.pengajuan} className="border-t border-border-primary hover:bg-brand-primary-50/30">
                  <td className="px-3 py-2 align-middle text-brand-primary-600">{row.pengajuan}</td>
                  <td className="px-3 py-2 align-middle">
                    <span className="whitespace-nowrap text-[12px] font-medium text-neutral-800">{row.dokumen}</span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className={row.status === "Draft" ? "whitespace-nowrap text-neutral-500" : "whitespace-nowrap"}>
                      {row.kirim}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Badge variant={proposalBadgeVariant[row.status]}>
                      {row.status === "Proses" ? row.progressLabel ?? "Proses" : row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        aria-label={`Detail ${row.pengajuan}`}
                        size="sm"
                        variant="info"
                        className="h-8 w-8 justify-center px-0"
                        onClick={() => navigate({ to: "/detail", search: { pengajuan: row.pengajuan } as never })}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {row.status !== "Draft" ? (
                        <Button
                          aria-label={`Progress ${row.pengajuan}`}
                          size="sm"
                          variant="info"
                          className="h-8 w-8 justify-center px-0"
                          onClick={() => navigate({ to: "/progress", search: { pengajuan: row.pengajuan } as never })}
                        >
                          <ProgressIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {row.status === "Draft" || (row.status === "Ditolak" && row.canEditAfterReject) ? (
                        <Button
                          aria-label={`Edit ${row.pengajuan}`}
                          size="sm"
                          variant="warning"
                          className="h-8 w-8 justify-center px-0"
                          onClick={() => navigate({ to: "/form" })}
                        >
                          <PenNewSquareIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button aria-label={`Copy ${row.pengajuan}`} size="sm" variant="brand" className="h-8 w-8 justify-center px-0">
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                      {row.status !== "Proses" ? (
                        <Button
                          aria-label={`Hapus ${row.pengajuan}`}
                          size="sm"
                          variant="error"
                          className="h-8 w-8 justify-center px-0"
                        >
                          <TrashBinTrashIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 px-0 py-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[12px] text-neutral-600">
          Menampilkan <span className="font-semibold text-neutral-800">{visibleRows.length}</span> dari{" "}
          <span className="font-semibold text-neutral-800">{filteredRows.length}</span> data pengajuan
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPageIndex((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </Button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              const active = page === currentPage;
              return (
                <Button
                  key={page}
                  variant={active ? "primary" : "outline"}
                  size="sm"
                  className={active ? "!border-brand-primary-800 !bg-brand-primary-800" : ""}
                  onClick={() => setPageIndex(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPageIndex((value) => Math.min(totalPages, value + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        ) : null}
      </div>

      {filteredRows.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-border-secondary bg-white p-6 text-center text-[12px] text-neutral-600">
          Tidak ada pengajuan dengan filter ini.
        </div>
      ) : null}
    </div>
  );
}
