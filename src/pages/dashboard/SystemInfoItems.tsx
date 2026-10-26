import { Link } from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { ArrowRightIcon, CalendarIcon, ClockCircleIcon } from "../../components/Icons";
import { Modal } from "../../components/Surface";
import type { SystemAnnouncement, SystemNotification } from "./dashboardData";

const itemClassName =
  "group block w-full rounded-lg border border-border-primary bg-background-primary/40 p-3 text-left transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-200";

export function NotificationItem({ item }: { item: SystemNotification }) {
  return (
    <Link to="/progress" search={{ pengajuan: item.pengajuan } as never} className={itemClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h6 className="text-[13px] font-semibold leading-5 text-neutral-800">{item.title}</h6>
          <p className="mt-2 text-[12px] leading-5 text-neutral-600">{item.note}</p>
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.badgeTone}`}>
          {item.badge}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <ClockCircleIcon className="h-3.5 w-3.5" />
            {item.time}
          </span>
          <span className="text-neutral-400">•</span>
          <span className="font-medium text-neutral-700">{item.pengajuan}</span>
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-primary-600 group-hover:text-brand-primary-700">
          Lihat Progres
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function AnnouncementItem({ item, onOpen }: { item: SystemAnnouncement; onOpen: (item: SystemAnnouncement) => void }) {
  return (
    <button type="button" onClick={() => onOpen(item)} className={itemClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h6 className="text-[13px] font-semibold leading-5 text-neutral-800">{item.title}</h6>
            <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.categoryTone}`}>
              {item.category}
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-neutral-600">{item.note}</p>
        </div>
        <div className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700">{item.date}</div>
      </div>
      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-600 group-hover:text-brand-primary-700">
          Baca Selengkapnya
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

export function AnnouncementDetailModal({ item, onClose }: { item: SystemAnnouncement | null; onClose: () => void }) {
  return (
    <Modal
      open={item !== null}
      title={item?.title ?? ""}
      onClose={onClose}
      widthClassName="w-[min(92vw,640px)]"
      footer={
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      {item ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.categoryTone}`}>{item.category}</span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-600">
              <CalendarIcon className="h-3.5 w-3.5" />
              {item.date}
            </span>
          </div>
          <div className="mt-4 space-y-3 text-[13px] leading-6 text-neutral-700">
            {item.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </>
      ) : null}
    </Modal>
  );
}
