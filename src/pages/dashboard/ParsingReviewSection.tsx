import { Button } from "../../components/Button";
import { EyeIcon } from "../../components/Icons";

export type ParsingReviewRow = {
  seri: string;
  uraian: string;
  hsCode: string;
  quantity: string;
  source: {
    id?: string;
    label: string;
    fileName: string;
    kind?: "pdf" | "image" | "spreadsheet";
  };
};

type ParsingReviewSectionProps = {
  parseConfidence: number;
  parseConfidenceLabel: string;
  parseConfidenceTone: string;
  parseSummaryTone: string;
  parseConfidenceHint: string;
  rows: ParsingReviewRow[];
  barangCount: number;
  supportCount: number;
  mappedFields: number;
  onReparse: () => void;
  onOpenRow: (row: ParsingReviewRow) => void;
};

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L14 10h7V3l-3.35 3.35Z" />
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-border-primary bg-white px-4 py-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className="mt-2 text-[24px] font-semibold leading-none text-neutral-800">{value}</div>
    </div>
  );
}

export function ParsingReviewSection({
  parseConfidence,
  parseConfidenceLabel,
  parseConfidenceTone,
  parseSummaryTone,
  parseConfidenceHint,
  rows,
  barangCount,
  supportCount,
  mappedFields,
  onReparse,
  onOpenRow,
}: ParsingReviewSectionProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-border-primary bg-white p-4 shadow-sm sm:p-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-primary-600">Data Parsing</div>
          <div className="mt-2 text-[20px] font-semibold text-neutral-800">Ringkasan hasil AI dan sumber data</div>
          <p className="mt-2 max-w-3xl text-[12px] leading-6 text-neutral-600">
            AI akan membaca file yang diunggah, lalu menyiapkan data untuk auto fill sebelum masuk ke form.
          </p>
        </div>

        <div className="my-4 border-t border-border-primary" />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.95fr]">
          <section className={`rounded-[24px] border bg-[#fff9e8] p-4 shadow-sm ${parseSummaryTone}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#b45309]">Confidence Global</div>
                <div className="mt-1 text-[34px] font-semibold leading-none text-[#b45309]">{parseConfidence}%</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-neutral-700 shadow-sm">{parseConfidenceLabel}</div>
            </div>

            <p className="mt-4 max-w-xl text-[12px] leading-6 text-[#c26b15]">{parseConfidenceHint}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={onReparse} startIcon={<RefreshIcon />}>
                Parse Ulang
              </Button>
              <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-neutral-600 shadow-sm">Global, bukan per field</span>
            </div>
          </section>

          <div className="grid gap-3">
            <StatCard label="Jumlah Barang Terbaca" value={barangCount} />
            <StatCard label="Jumlah Dokumen Pendukung" value={supportCount} />
            <StatCard label="Field yang Berhasil Dipetakan" value={mappedFields} />
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800">
          Data hasil OCR perlu ditinjau kembali.
        </div>
      </section>

      <section className="rounded-[24px] border border-brand-primary-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-brand-primary-100 px-4 py-4 sm:px-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-brand-primary-600">Preview Mapping</div>
            <div className="mt-2 text-[16px] font-semibold text-neutral-800">Tabel data barang hasil parse</div>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand-primary-700 shadow-sm">{rows.length} barang</div>
        </div>

        <div className="overflow-hidden rounded-b-[24px]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="bg-white text-neutral-600">
                <tr className="border-b border-border-primary">
                  <th className="px-4 py-4 font-semibold">Seri</th>
                  <th className="px-4 py-4 font-semibold">Uraian Barang</th>
                  <th className="px-4 py-4 font-semibold">HS Code</th>
                  <th className="px-4 py-4 font-semibold">Sumber OCR</th>
                  <th className="px-4 py-4 font-semibold text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.seri}-${row.uraian}`} className="border-b border-border-primary last:border-b-0 hover:bg-brand-primary-50/20">
                    <td className="px-4 py-4 align-top">
                      <div className="text-[16px] font-semibold text-neutral-800">{row.seri}</div>
                      <div className="mt-1 text-[11px] text-neutral-500">Qty {row.quantity}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-neutral-800">{row.uraian}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-neutral-700">{row.hsCode}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-neutral-800">{row.source.label}</div>
                      <div className="mt-1 text-[11px] text-neutral-500">{row.source.fileName}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <Button variant="outline" size="sm" onClick={() => onOpenRow(row)} startIcon={<EyeIcon className="h-4 w-4" />} className="whitespace-nowrap">
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
