import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DetailPage } from "../DetailPage";
import { penyediaProposals } from "./penyediaData";
import { AiFlagChip, PenyediaSectionCard } from "./PenyediaAppLayout";

/**
 * Detail penyedia reuse layout DetailPage pengaju,
 * plus section Ringkasan Analisis AI di atas.
 */
export function PenyediaDetailPage() {
  const { location } = useRouterState();
  const search = location.search as { pengajuan?: string } | undefined;

  const selected = useMemo(
    () => penyediaProposals.find((row) => row.pengajuan === search?.pengajuan) ?? penyediaProposals[0],
    [search?.pengajuan],
  );

  return (
    <div className="space-y-4">
      <PenyediaSectionCard
        title="Ringkasan Analisis AI"
        subtitle="Informasi pendukung monitoring. Bukan keputusan approve/reject."
      >
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-brand-primary-100 bg-brand-primary-50/40 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-700">Insight AI</div>
            <p className="mt-2 text-[13px] leading-6 text-neutral-800">{selected.aiSummary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.flags.map((flag) => (
                <AiFlagChip key={flag.id} label={flag.label} tone={flag.tone} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border-primary bg-neutral-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Flag Analisis</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.flags.map((flag) => (
                  <AiFlagChip key={`panel-${flag.id}`} label={flag.label} tone={flag.tone} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border-primary bg-neutral-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Identitas monitoring</div>
              <div className="mt-1 text-[12px] leading-5 text-neutral-700">
                {selected.countryName} · {selected.dokumen} · HS {selected.hsCode}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border-primary bg-white px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Temuan</div>
            <ul className="mt-2 space-y-1 text-[12px] leading-5 text-neutral-700">
              {selected.findings.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border-primary bg-white px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Dokumen yang perlu diperiksa</div>
            <ul className="mt-2 space-y-1 text-[12px] leading-5 text-neutral-700">
              {selected.documentsToCheck.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border-primary bg-white px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Catatan Analisis</div>
            <p className="mt-2 text-[12px] leading-5 text-neutral-700">{selected.analysisNotes}</p>
          </div>
        </div>
      </PenyediaSectionCard>

      <DetailPage />
    </div>
  );
}
