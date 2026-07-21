import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Input } from "../../components/FormControls";
import { MagniferIcon, ProgressIcon } from "../../components/Icons";
import { proposalBadgeVariant } from "../dashboard/dashboardData";
import { ClientSectionCard } from "./ClientAppLayout";
import { clientSubmittedRows } from "./clientPengajuanData";

export function ClientPengajuanPage() {
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);

  const filteredRows = useMemo(() => {
    const normalized = appliedSearchQuery.trim().toLowerCase();
    return clientSubmittedRows.filter((row) => {
      return (
        !normalized ||
        `${row.pengajuan} ${row.dokumen} ${row.kirim} ${row.perusahaan} ${row.status} ${row.progressLabel ?? ""}`
          .toLowerCase()
          .includes(normalized)
      );
    });
  }, [appliedSearchQuery]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);
  const visibleRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setPageIndex(1);
  }, [appliedSearchQuery]);

  return (
    <section className="px-3 py-4 sm:px-4 sm:py-5">
      <ClientSectionCard
        title="Daftar Pengajuan"
        subtitle="Hanya menampilkan pengajuan yang sudah diajukan. Mode client: review + tracking."
      >
        <div className="flex flex-col gap-3 border-b border-border-primary pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px] text-neutral-600">
            Menampilkan <span className="font-semibold text-neutral-800">{filteredRows.length}</span> pengajuan terkirim
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="sm:w-[280px]">
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                type="search"
                placeholder="Cari nomor / dokumen / perusahaan..."
                prefixIcon={<MagniferIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchDraft("");
                  setAppliedSearchQuery("");
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                className="!border-brand-primary-800 !bg-brand-primary-800"
                onClick={() => setAppliedSearchQuery(searchDraft)}
              >
                Cari
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border-primary">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="bg-brand-primary-500 text-white">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Nomor Pengajuan</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Jenis Dokumen</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Tanggal Kirim</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {visibleRows.map((row) => (
                  <tr key={row.pengajuan} className="border-t border-border-primary hover:bg-brand-primary-50/30">
                    <td className="px-3 py-2 text-brand-primary-600">{row.pengajuan}</td>
                    <td className="px-3 py-2 font-medium text-neutral-800">{row.dokumen}</td>
                    <td className="px-3 py-2 text-neutral-700">{row.kirim}</td>
                    <td className="px-3 py-2">
                      <Badge variant={proposalBadgeVariant[row.status]}>
                        {row.status === "Proses" ? row.progressLabel ?? "Proses" : row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end">
                        <Button
                          aria-label={`Tracking ${row.pengajuan}`}
                          size="sm"
                          variant="info"
                          className="h-8 gap-1.5 px-2.5"
                          startIcon={<ProgressIcon className="h-4 w-4" />}
                          onClick={() => void navigate({ to: "/client/tracking", search: { pengajuan: row.pengajuan } })}
                        >
                          Tracking
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px] text-neutral-600">
            Menampilkan <span className="font-semibold text-neutral-800">{visibleRows.length}</span> dari{" "}
            <span className="font-semibold text-neutral-800">{filteredRows.length}</span> data
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPageIndex((value) => Math.max(1, value - 1))}>
                Sebelumnya
              </Button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "primary" : "outline"}
                    size="sm"
                    className={page === currentPage ? "!border-brand-primary-800 !bg-brand-primary-800" : ""}
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
          <div className="mt-3 rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-6 text-center text-[12px] text-neutral-600">
            Tidak ada pengajuan terkirim dengan pencarian ini.
          </div>
        ) : null}
      </ClientSectionCard>
    </section>
  );
}
