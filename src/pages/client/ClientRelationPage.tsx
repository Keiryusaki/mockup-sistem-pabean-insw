import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/Button";
import {
  clearClientSession,
  clientRelations,
  getAccessesForRelation,
  isClientAuthenticated,
  readClientSession,
  writeClientSession,
} from "../../lib/clientAuth";
import { ClientAuthBackdrop, ClientAuthCard } from "./ClientChrome";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-4 w-4 fill-none stroke-current transition-transform", open && "rotate-180")}>
      <path d="m6 9 6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
      <path d="M12 10.5v5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClientRelationPage() {
  const navigate = useNavigate();
  const session = useMemo(() => readClientSession(), []);
  const [relationId, setRelationId] = useState(session?.relationId ?? "");
  const [accessId, setAccessId] = useState(session?.accessId ?? "");
  const [openMenu, setOpenMenu] = useState<"relation" | "access" | null>(null);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!isClientAuthenticated(session)) {
      void navigate({ to: "/client/login" });
    }
  }, [navigate, session]);

  const accessOptions = useMemo(() => {
    void reloadTick;
    return relationId ? getAccessesForRelation(relationId) : [];
  }, [relationId, reloadTick]);

  const selectedRelation = clientRelations.find((item) => item.id === relationId) ?? null;
  const selectedAccess = accessOptions.find((item) => item.id === accessId) ?? null;
  const canContinue = Boolean(relationId && accessId);

  const handleExit = () => {
    clearClientSession();
    void navigate({ to: "/client/login" });
  };

  const handleContinue = () => {
    if (!session?.identity) {
      void navigate({ to: "/client/login" });
      return;
    }

    if (!relationId || !accessId) {
      setError("Pilih hubungan relasi dan hak akses terlebih dahulu.");
      return;
    }

    writeClientSession({
      ...session,
      relationId,
      accessId,
    });
    setError("");
    void navigate({ to: "/client/pengajuan", search: { status: undefined } });
  };

  return (
    <ClientAuthBackdrop>
      <ClientAuthCard backLabel="Batal & Keluar" onBack={handleExit}>
        <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-900">Pilih Relasi</h1>
        <p className="mt-1 text-[13px] leading-6 text-neutral-600">Pilih hubungan relasi yang akan Anda gunakan</p>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((current) => (current === "relation" ? null : "relation"))}
              className={cn(
                "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-neutral-50 px-4 text-left text-[12px] transition-colors",
                openMenu === "relation" ? "border-brand-primary-400 ring-2 ring-brand-primary-100" : "border-border-primary",
              )}
            >
              <span className={cn("min-w-0 flex-1 truncate", selectedRelation ? "font-medium text-neutral-800" : "text-neutral-500")}>
                {selectedRelation
                  ? selectedRelation.title.length > 34
                    ? `${selectedRelation.title.slice(0, 34)}...`
                    : selectedRelation.title
                  : `Pilih hubungan relasi (${clientRelations.length})`}
              </span>
              <ChevronIcon open={openMenu === "relation"} />
            </button>

            {openMenu === "relation" ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 overflow-hidden rounded-xl border border-border-primary bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                {clientRelations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRelationId(item.id);
                      setAccessId("");
                      setOpenMenu(null);
                      setError("");
                    }}
                    className="block w-full px-4 py-3 text-left transition-colors hover:bg-brand-primary-50"
                  >
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.02em] text-neutral-800">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-neutral-500">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              disabled={!relationId}
              onClick={() => setOpenMenu((current) => (current === "access" ? null : "access"))}
              className={cn(
                "flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left text-[12px] transition-colors",
                !relationId && "cursor-not-allowed bg-neutral-50 text-neutral-400",
                relationId && (openMenu === "access" ? "border-brand-primary-400 bg-white ring-2 ring-brand-primary-100" : "border-border-primary bg-neutral-50 text-neutral-700"),
              )}
            >
              <span className={cn("min-w-0 flex-1 truncate", selectedAccess ? "font-medium text-neutral-800" : "")}>
                {selectedAccess ? selectedAccess.label : `Pilih Hak Akses (${accessOptions.length})`}
              </span>
              <ChevronIcon open={openMenu === "access"} />
            </button>

            {openMenu === "access" && relationId ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 overflow-hidden rounded-xl border border-border-primary bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                {accessOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAccessId(item.id);
                      setOpenMenu(null);
                      setError("");
                    }}
                    className="block w-full px-4 py-3 text-left text-[12px] font-medium text-neutral-800 transition-colors hover:bg-brand-primary-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!relationId ? (
            <button type="button" className="inline-flex items-center gap-2 text-[12px] font-medium text-brand-primary-600 hover:text-brand-primary-700">
              <InfoIcon />
              Informasi layanan terkait Role Akses
            </button>
          ) : null}

          {error ? <p className="text-[12px] font-medium text-error-600">{error}</p> : null}

          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={!canContinue}
            onClick={handleContinue}
            className={cn(
              "!h-12",
              canContinue
                ? "!border-[#082d69] !bg-[#082d69] hover:!border-[#0b3d86] hover:!bg-[#0b3d86]"
                : "!border-neutral-300 !bg-neutral-300 !text-white",
            )}
          >
            Selanjutnya
          </Button>

          <p className="text-center text-[12px] text-neutral-600">
            Relasi tidak muncul?{" "}
            <button
              type="button"
              onClick={() => {
                setRelationId("");
                setAccessId("");
                setOpenMenu(null);
                setReloadTick((value) => value + 1);
              }}
              className="font-medium text-brand-primary-600 hover:text-brand-primary-700"
            >
              Muat Ulang
            </button>
            .
          </p>
        </div>
      </ClientAuthCard>
    </ClientAuthBackdrop>
  );
}
