import { useState } from "react";
import { Button } from "../../components/Button";
import { Checkbox, Input, Select } from "../../components/FormControls";
import { CopyIcon, MagniferIcon } from "../../components/Icons";
import { copyDataLeafKeys, copyDataTree, COPY_HISTORY_ROWS, MANUAL_DOCUMENT_OPTIONS, type CopyDataGroup, type CopyProposalRow } from "./submissionLauncherData";
import { ModalCancelButton } from "./SubmissionModalShared";

type ModalCancelButtonProps = {
  onClick: () => void;
};

function SummaryMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-primary bg-white px-3 py-2 shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-1 text-[12px] font-semibold text-neutral-800">{value}</div>
    </div>
  );
}

type ManualDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelect: (documentType: string) => void;
};

export function ManualDocumentModal({ open, onClose, onBack, onSelect }: ManualDocumentModalProps) {
  const [query, setQuery] = useState("");
  const filtered = MANUAL_DOCUMENT_OPTIONS.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Buat Pengajuan Baru</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">Pilih jenis dokumen yang ingin dibuat sebelum masuk ke form.</p>
        </div>

        <div className="px-5 py-5 sm:px-8">
          <div className="relative mb-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari jenis dokumen..."
              prefixIcon={<MagniferIcon className="h-4 w-4" />}
              compact
            />
          </div>

          <div className="grid gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.title)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border-primary bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-sm"
              >
                <div>
                  <div className="text-[13px] font-semibold text-neutral-800">{item.title}</div>
                  <div className="mt-1 text-[12px] text-neutral-600">{item.description}</div>
                </div>
                <span className="rounded-md bg-brand-primary-50 px-3 py-1 text-[12px] font-semibold text-brand-primary-600">Pilih</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

type CopyDataModalProps = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onUse: (row: CopyProposalRow) => void;
};

export function CopyDataModal({ open, onClose, onBack, onUse }: CopyDataModalProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");

  if (!open) return null;

  const filtered = COPY_HISTORY_ROWS.filter((row) => {
    const haystack = `${row.nomor} ${row.dokumen} ${row.tanggal} ${row.status} ${row.perusahaan}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "Semua" || row.status === status);
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative flex h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:h-[calc(100vh-3rem)]">
        <div className="border-b border-border-primary px-5 py-5 sm:px-8">
          <h3 className="text-[24px] font-semibold text-neutral-800">Copy Data Pengajuan</h3>
          <p className="mt-1 max-w-2xl text-[12px] text-neutral-600 sm:text-[13px]">Cari pengajuan sebelumnya dan gunakan sebagai dasar draft baru.</p>
        </div>

        <div className="shrink-0 grid gap-3 px-5 py-5 sm:px-8 lg:grid-cols-[1.4fr_220px]">
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari nomor pengajuan, dokumen, atau nama..."
              prefixIcon={<MagniferIcon className="h-4 w-4" />}
              compact
            />
          </div>

          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { label: "Semua", value: "Semua" },
              { label: "Selesai", value: "Selesai" },
              { label: "Proses", value: "Proses" },
              { label: "Draft", value: "Draft" },
            ]}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-8">
          <div className="overflow-x-auto rounded-2xl border border-border-primary">
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="bg-brand-primary-500 text-white">
                <tr>
                  <th className="px-3 py-2 font-semibold">Nomor Pengajuan</th>
                  <th className="px-3 py-2 font-semibold">Jenis Dokumen</th>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Perusahaan</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.nomor} className="border-t border-border-primary hover:bg-brand-primary-50/20">
                    <td className="px-3 py-2">{row.nomor}</td>
                    <td className="px-3 py-2">{row.dokumen}</td>
                    <td className="px-3 py-2">{row.tanggal}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.perusahaan}</td>
                    <td className="px-3 py-2">
                      <Button onClick={() => onUse(row)} size="sm">
                        Gunakan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <ModalCancelButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

type CopyDataSelectionModalProps = {
  open: boolean;
  row: CopyProposalRow | null;
  value: string[];
  onClose: () => void;
  onBack: () => void;
  onChange: (keys: string[]) => void;
  onSelectAll: (checked: boolean) => void;
  onContinue: () => void;
};

export function CopyDataSelectionModal({
  open,
  row,
  value,
  onClose,
  onBack,
  onChange,
  onSelectAll,
  onContinue,
}: CopyDataSelectionModalProps) {
  if (!open || !row) return null;

  const selectedSet = new Set(value);
  const allSelected = copyDataLeafKeys.every((key) => selectedSet.has(key));

  const updateSelection = (nextKeys: string[]) => {
    onChange(Array.from(new Set(nextKeys)));
  };

  const toggleItem = (key: string) => {
    updateSelection(selectedSet.has(key) ? value.filter((item) => item !== key) : [...value, key]);
  };

  const toggleGroup = (group: CopyDataGroup) => {
    const groupKeys = group.children.map((item) => item.key);
    const groupSelected = groupKeys.every((key) => selectedSet.has(key));
    const nextKeys = groupSelected ? value.filter((item) => !groupKeys.includes(item)) : [...value, ...groupKeys];
    updateSelection(nextKeys);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="relative my-0 flex h-[calc(100vh-2rem)] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] sm:my-0 sm:h-[calc(100vh-3rem)]">
        <div className="shrink-0 border-b border-border-primary px-5 py-4 sm:px-8 sm:py-5">
          <h3 className="text-[22px] font-semibold text-neutral-800">Pilih Data yang Akan Dicopy</h3>
          <p className="mt-1 max-w-3xl text-[12px] text-neutral-600">Tentukan kelompok data mana saja yang ingin dipakai sebagai dasar draft baru sebelum lanjut ke upload dokumen.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-8">
          <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-3 shadow-sm sm:p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Ringkasan Pengajuan Terpilih</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMini label="Nomor" value={row.nomor} />
              <SummaryMini label="Jenis Dokumen" value={row.dokumen} />
              <SummaryMini label="Tanggal" value={row.tanggal} />
              <SummaryMini label="Status" value={row.status} />
            </div>
            <div className="mt-2 text-[12px] text-neutral-700">
              Perusahaan: <span className="font-semibold text-neutral-800">{row.perusahaan}</span>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border-primary bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Kelompok Data</div>
                <div className="mt-1 text-[12px] font-semibold text-neutral-800">Pilih bagian data yang akan disalin</div>
              </div>
              <Checkbox
                checked={allSelected}
                onChange={(event) => onSelectAll(event.target.checked)}
                label="Pilih Semua"
                className="min-w-[170px] rounded-xl bg-background-primary/30"
              />
            </div>

            <div className="mt-3 grid gap-2">
              {copyDataTree.map((group) => {
                const groupKeys = group.children.map((item) => item.key);
                const selectedCount = groupKeys.filter((key) => selectedSet.has(key)).length;
                const checked = selectedCount === groupKeys.length;
                const mixed = selectedCount > 0 && !checked;

                return (
                  <div
                    key={group.key}
                    className={[
                      "rounded-xl border bg-white shadow-sm transition-colors",
                      checked ? "border-brand-primary-300 bg-brand-primary-50/30" : mixed ? "border-brand-primary-200 bg-brand-primary-50/10" : "border-border-primary",
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => toggleGroup(group)} className="flex w-full items-start gap-3 px-3 py-3 text-left">
                      <span
                        className={[
                          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-semibold",
                          checked ? "border-brand-primary-500 bg-brand-primary-500 text-white" : mixed ? "border-brand-primary-500 bg-brand-primary-50 text-brand-primary-600" : "border-border-primary bg-white text-transparent",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {checked ? "✓" : mixed ? "–" : " "}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold text-neutral-800">{group.title}</span>
                          <span className="rounded-full bg-background-primary px-2 py-0.5 text-[10px] font-semibold text-brand-primary-700">
                            {selectedCount}/{groupKeys.length}
                          </span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-neutral-600">{group.description}</span>
                      </span>
                    </button>

                    <div className="border-t border-border-primary/70 px-3 py-3">
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {group.children.map((item) => {
                          const checkedChild = selectedSet.has(item.key);

                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleItem(item.key)}
                              className={[
                                "flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                                checkedChild ? "border-brand-primary-300 bg-brand-primary-50/60 shadow-sm" : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/30",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border text-[10px] font-semibold",
                                  checkedChild ? "border-brand-primary-500 bg-brand-primary-500 text-white" : "border-border-primary bg-white text-transparent",
                                ].join(" ")}
                                aria-hidden="true"
                              >
                                {checkedChild ? "✓" : " "}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[11px] font-semibold text-neutral-800">{item.title}</span>
                                <span className="mt-0.5 block text-[10px] leading-4 text-neutral-600">{item.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border-primary px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              Kembali
            </Button>
            <div className="flex items-center gap-3">
              <ModalCancelButton onClick={onClose} />
              <Button variant="primary" size="sm" onClick={onContinue} disabled={!value.length}>
                Lanjut
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
