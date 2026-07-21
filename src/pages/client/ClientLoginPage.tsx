import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { Input } from "../../components/FormControls";
import { hasClientContext, readClientSession, writeClientSession } from "../../lib/clientAuth";
import { ClientAuthBackdrop, ClientAuthCard } from "./ClientChrome";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.5" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M3 12s3.5-7 9-7c2 0 3.8.7 5.3 1.7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 12s-3.5 7-9 7c-2 0-3.8-.7-5.3-1.7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m4 4 16 16" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClientLoginPage() {
  const navigate = useNavigate();
  const existing = useMemo(() => readClientSession(), []);
  const [identity, setIdentity] = useState(existing?.identity || "nurcholisas05@gmail.com");
  const [password, setPassword] = useState("password");
  const [remember, setRemember] = useState(existing?.remember ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasClientContext(existing)) {
      void navigate({ to: "/client/pengajuan", search: { status: undefined } });
    }
  }, [existing, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identity.trim() || !password.trim()) {
      setError("Lengkapi identitas dan kata sandi terlebih dahulu.");
      return;
    }

    writeClientSession({
      identity: identity.trim(),
      remember,
      authenticatedAt: new Date().toISOString(),
      relationId: existing?.relationId,
      accessId: existing?.accessId,
    });

    setError("");
    void navigate({ to: "/client/relasi" });
  };

  return (
    <ClientAuthBackdrop>
      <ClientAuthCard backLabel="Kembali" onBack={() => void navigate({ to: "/" })}>
        <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-900">
          Masukkan “Kata Sandi” Anda
        </h1>
        <p className="mt-1 text-[13px] leading-6 text-neutral-600">
          Masuk dengan kata sandi akun{" "}
          <span className="font-semibold text-neutral-800">
            NSW<span className="text-error-500">id</span>
          </span>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label='Nomor Identitas/Email/No. Hp'
            requiredMark
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            autoComplete="username"
            placeholder="email@domain.com"
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-700">
              Kata Sandi <span className="text-error-500">*</span>
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-md border border-border-primary bg-white px-3 pr-11 text-[12px] text-neutral-800 outline-none transition-colors focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-neutral-500 hover:text-neutral-800"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-[12px] text-neutral-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-border-primary text-brand-primary-600 focus:ring-brand-primary-300"
              />
              Ingat saya
            </label>
            <button type="button" className="text-[12px] font-medium text-brand-primary-600 hover:text-brand-primary-700">
              Lupa kata sandi?
            </button>
          </div>

          {error ? <p className="text-[12px] font-medium text-error-600">{error}</p> : null}

          <Button type="submit" size="lg" fullWidth className="!h-12 !border-[#082d69] !bg-[#082d69] hover:!border-[#0b3d86] hover:!bg-[#0b3d86]">
            Selanjutnya
          </Button>
        </form>
      </ClientAuthCard>
    </ClientAuthBackdrop>
  );
}
