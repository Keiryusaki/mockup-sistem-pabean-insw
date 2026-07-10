import { Link } from "@tanstack/react-router";
import { stats } from "./dashboardData";

export function ProposalSummaryCards() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to="/data"
          search={{ status: stat.filter } as never}
          className={`group rounded-lg border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)] ${stat.cardTone} ${stat.hoverTone}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-700">{stat.label}</div>
              <div className={`mt-2 text-[28px] font-semibold leading-none ${stat.textTone}`}>{stat.value}</div>
            </div>
            <div className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors duration-300 ${stat.badgeTone}`}>
              {stat.label}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
