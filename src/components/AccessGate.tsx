import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

const ACCESS_KEY = "insw-pages-access";
const metaEnv = import.meta as unknown as { env?: { PROD?: boolean; VITE_PAGES_ACCESS_CODE?: string; VITE_REQUIRE_PASSKEY?: string } };
const ACCESS_CODE = metaEnv.env?.VITE_PAGES_ACCESS_CODE?.trim() || "insw2026";
const REQUIRE_PASSPHRASE = Boolean(metaEnv.env?.PROD) && metaEnv.env?.VITE_REQUIRE_PASSKEY === "true";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.732V19h-2v-2.268A2 2 0 0 1 12 13Z" />
    </svg>
  );
}

export function AccessGate({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const protectedBuild = REQUIRE_PASSPHRASE && !isLocalHost(window.location.hostname);
    if (!protectedBuild) {
      setUnlocked(true);
      return;
    }

    const stored = window.localStorage.getItem(ACCESS_KEY);
    setUnlocked(stored === "unlocked");
  }, []);

  const protectedBuild = useMemo(() => {
    if (!isMounted) return false;
    return REQUIRE_PASSPHRASE && !isLocalHost(window.location.hostname);
  }, [isMounted]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      window.localStorage.setItem(ACCESS_KEY, "unlocked");
      setUnlocked(true);
      setError("");
      return;
    }

    setError("Passkey salah. Coba lagi.");
  };

  const handleReset = () => {
    window.localStorage.removeItem(ACCESS_KEY);
    setUnlocked(false);
    setCode("");
    setError("");
  };

  if (!protectedBuild || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-[520px] rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.38)]">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-500 text-white">
            <LockIcon />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-800">Akses Terbatas</h1>
            <p className="mt-1 text-[12px] leading-5 text-neutral-600">
              Masukkan passkey untuk membuka halaman publik mockup ini.
            </p>
          </div>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-[12px] font-medium text-neutral-700">Passkey</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
              placeholder="Masukkan passkey"
            />
          </label>

          {error ? (
            <p className="mt-2 text-[12px] font-medium text-error-600">{error}</p>
          ) : (
            <p className="mt-2 text-[12px] text-neutral-500">
              Akses lokal tidak dibatasi. Di GitHub Pages, halaman akan terkunci sampai passkey benar.
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border-primary px-4 text-[12px] font-medium text-neutral-700 transition-colors hover:border-error-400 hover:bg-error-500/10 hover:text-error-600"
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-brand-primary-500 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-primary-600"
            >
              Buka Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
