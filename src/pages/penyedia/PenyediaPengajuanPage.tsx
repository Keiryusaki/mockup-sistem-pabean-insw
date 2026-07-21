import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Input, Select } from "../../components/FormControls";
import { EyeIcon, MagniferIcon } from "../../components/Icons";
import { filterPenyediaProposals, type PenyediaStatus } from "./penyediaData";
import { AiFlagChip, PenyediaSectionCard } from "./PenyediaAppLayout";

export function PenyediaPengajuanPage() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const search = location.search as { country?: string; q?: string; kind?: string } | undefined;

  const [searchDraft, setSearchDraft] = useState(search?.q ?? "");
  const [appliedQuery, setAppliedQuery] = useState(search?.q ?? "");
  const [statusFilter, setStatusFilter] = useState<PenyediaStatus | "Semua">("Semua");
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    setSearchDraft(search?.q ?? "");
    setAppliedQuery(search?.q ?? "");
  }, [search?.q, search?.country]);

  const rows = useMemo(
    () =>
      filterPenyediaProposals({
        countryCode: search?.country,
        query: appliedQuery,
        status: statusFilter,
      }),
    [appliedQuery, search?.country, statusFilter],
  );

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);
  const visibleRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPageIndex(1);
  }, [appliedQuery, search?.country, statusFilter]);

  return (
    <section>
      <PenyediaSectionCard
        title="Daftar Pengajuan"
        subtitle="Monitoring list. Aksi hanya Detail. Tidak ada edit, approve, atau reject."
      >
        <div className="grid gap-2 border-b border-border-primary pb-3 md:grid-cols-[1.2fr_0.7fr_auto]">
          <Input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            type="search"
            placeholder="Cari nomor / HS / negara / perusahaan..."
            prefixIcon={<MagniferIcon className="h-4 w-4" />}
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as PenyediaStatus | "Semua") || "Semua")}
            options={[
              { label: "Semua status", value: "Semua" },
              { label: "Proses", value: "Proses" },
              { label: "Selesai", value: "Selesai" },
              { label: "Perlu Perhatian", value: "Perlu Perhatian" },
            ]}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchDraft("");
                setAppliedQuery("");
                setStatusFilter("Semua");
                void navigate({
                  to: "/penyedia/pengajuan",
                  search: { kind: undefined, country: undefined, q: undefined },
                });
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="!border-brand-primary-800 !bg-brand-primary-800"
              onClick={() => {
                setAppliedQuery(searchDraft);
                void navigate({
                  to: "/penyedia/pengajuan",
                  search: {
                    kind: undefined,
                    country: search?.country,
                    q: searchDraft || undefined,
                  },
                });
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>

        {search?.country ? (
          <div className="mt-3 rounded-xl border border-brand-primary-100 bg-brand-primary-50/50 px-3 py-2 text-[12px] text-brand-primary-800">
            Filter negara aktif: <span className="font-semibold">{search.country}</span>
          </div>
        ) : null}

        <div className="mt-3 overflow-hidden rounded-2xl border border-border-primary">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="bg-brand-primary-500 text-white">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Nomor Pengajuan</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Jenis Dokumen</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Negara</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">HS Code</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Indikator AI</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {visibleRows.map((row) => (
                  <tr key={row.pengajuan} className="border-t border-border-primary hover:bg-brand-primary-50/30">
                    <td className="px-3 py-2 text-brand-primary-600">{row.pengajuan}</td>
                    <td className="px-3 py-2 font-medium text-neutral-800">{row.dokumen}</td>
                    <td className="px-3 py-2 text-neutral-700">{row.countryName}</td>
                    <td className="px-3 py-2 text-neutral-700">{row.hsCode}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          row.status === "Selesai" ? "success" : row.status === "Proses" ? "warning" : "error"
                        }
                      >
                        {row.status === "Proses" ? row.progressLabel ?? "Proses" : row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                        {row.flags.map((flag) => (
                          <AiFlagChip key={flag.id} label={flag.label} tone={flag.tone} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="info"
                          className="h-8 gap-1.5 px-2.5"
                          startIcon={<EyeIcon className="h-4 w-4" />}
                          onClick={() => void navigate({ to: "/penyedia/detail", search: { pengajuan: row.pengajuan } })}
                        >
                          Detail
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
            <span className="font-semibold text-neutral-800">{rows.length}</span> data
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPageIndex((v) => Math.max(1, v - 1))}>
                Sebelumnya
              </Button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === currentPage ? "primary" : "outline"}
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
                onClick={() => setPageIndex((v) => Math.min(totalPages, v + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-6 text-center text-[12px] text-neutral-600">
            Tidak ada pengajuan untuk filter ini.
          </div>
        ) : null}
      </PenyediaSectionCard>
    </section>
  );
}
