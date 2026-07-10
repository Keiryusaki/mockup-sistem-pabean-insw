import { Button } from "../../components/Button";
import { AddSquareIcon, CalendarIcon } from "../../components/Icons";

export function DashboardHero({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary-700 via-[#03306f] to-brand-primary-900 p-5 text-white shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#ffe07a] px-3 py-1 text-[12px] font-semibold text-[#7a5300]">Featured</span>
        <div className="inline-flex items-center gap-2 text-[12px] font-medium text-white/90">
          <CalendarIcon />
          <span>Dashboard aktif</span>
        </div>
      </div>

      <h3 className="mt-5 max-w-4xl text-left text-[28px] font-semibold leading-tight text-white sm:text-[38px]">
        Selamat datang, Admin
      </h3>

      <p className="mt-3 max-w-5xl text-[12px] leading-6 text-white/90 sm:text-[13px]">
        Ringkasan pengajuan yang sedang berjalan, lengkap dengan akses cepat untuk memulai pengajuan baru.
      </p>

      <Button
        variant="outline"
        size="lg"
        onClick={onCreate}
        startIcon={<AddSquareIcon className="h-4 w-4" />}
        className="mt-6 w-fit border-white/20 bg-white text-[16px] text-brand-primary-800 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out hover:!translate-y-0 hover:border-white/40 hover:bg-white hover:shadow-[0_16px_34px_rgba(0,0,0,0.14)] focus-visible:ring-brand-primary-100"
      >
        Pengajuan
      </Button>
    </section>
  );
}

export function DashboardSectionTitle() {
  return (
    <div className="flex flex-col gap-4 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-600">Dashboard</div>
        <h5 className="mt-1 text-left font-medium tracking-[-0.02em] text-neutral-800">Ringkasan Pengajuan</h5>
      </div>
    </div>
  );
}
