import { Link } from "@tanstack/react-router";
import { DocumentsIcon, EyeIcon } from "../components/Icons";
import { ClientAuthBackdrop } from "./client/ClientChrome";

const apps = [
  {
    id: "smart-form",
    title: "Smart Form",
    description: "Pilih role dulu: Pengaju (edit/submit) atau Penyedia (review + AI + peta).",
    to: "/smart-form",
    badge: "Multi-role",
    icon: <DocumentsIcon className="h-5 w-5" />,
  },
  {
    id: "client-app",
    title: "Client App",
    description: "Portal client: login → pilih relasi → list pengajuan (review) → detail tracking.",
    to: "/client/login",
    badge: "New mockup",
    icon: <EyeIcon className="h-5 w-5" />,
  },
] as const;

export function AppSelectorPage() {
  return (
    <ClientAuthBackdrop>
      <div className="w-full max-w-3xl">
        <div className="mb-6 text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-primary-700">INSW Mockup Hub</div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-neutral-900">Pilih Aplikasi</h1>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-neutral-600">
            Satu repo, multi entry mockup. Smart Form (Pengaju/Penyedia) dan Client App review-only.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={app.to}
              className="group rounded-[22px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-700">
                  {app.icon}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                  {app.badge}
                </span>
              </div>
              <h2 className="mt-4 text-[18px] font-semibold text-neutral-900 group-hover:text-brand-primary-700">{app.title}</h2>
              <p className="mt-2 text-[12px] leading-6 text-neutral-600">{app.description}</p>
              <div className="mt-4 text-[12px] font-semibold text-brand-primary-700">Buka mockup →</div>
            </Link>
          ))}
        </div>
      </div>
    </ClientAuthBackdrop>
  );
}
