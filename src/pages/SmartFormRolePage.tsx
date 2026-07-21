import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { writeSmartFormRole, type SmartFormRole } from "../lib/smartFormRole";
import { ClientAuthBackdrop } from "./client/ClientChrome";
import { DocumentsIcon, EyeIcon, UserIcon } from "../components/Icons";

const roles: Array<{
  id: SmartFormRole;
  title: string;
  description: string;
  to: "/dashboard" | "/penyedia";
  badge: string;
  icon: ReactNode;
}> = [
  {
    id: "pengaju",
    title: "Pengaju",
    description: "Buat, edit, dan submit pengajuan. Akses full ke form, data, dan dashboard operasional.",
    to: "/dashboard",
    badge: "Existing",
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    id: "penyedia",
    title: "Penyedia",
    description: "Review & analisis. Dashboard AI + peta, list pengajuan readonly, detail pengajuan + insight AI.",
    to: "/penyedia",
    badge: "New mockup",
    icon: <EyeIcon className="h-5 w-5" />,
  },
];

export function SmartFormRolePage() {
  return (
    <ClientAuthBackdrop>
      <div className="w-full max-w-3xl">
        <div className="mb-6 text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-primary-700">Smart Form</div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-neutral-900">Pilih Role</h1>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-neutral-600">
            Pilih peran yang akan dipakai di mockup Smart Form. Role menentukan menu dan kemampuan aksi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Link
              key={role.id}
              to={role.to}
              onClick={() => writeSmartFormRole(role.id)}
              className="group rounded-[22px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-700">
                  {role.icon}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                  {role.badge}
                </span>
              </div>
              <h2 className="mt-4 text-[18px] font-semibold text-neutral-900 group-hover:text-brand-primary-700">{role.title}</h2>
              <p className="mt-2 text-[12px] leading-6 text-neutral-600">{role.description}</p>
              <div className="mt-4 text-[12px] font-semibold text-brand-primary-700">Masuk sebagai {role.title} →</div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[12px] font-medium text-neutral-600 hover:text-brand-primary-700">
            <DocumentsIcon className="h-4 w-4" />
            Kembali ke pilih aplikasi
          </Link>
        </div>
      </div>
    </ClientAuthBackdrop>
  );
}
