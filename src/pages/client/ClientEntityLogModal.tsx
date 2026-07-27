import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Surface";
import type { EntityAuditLogEntry } from "./clientPengajuanData";

type ClientEntityLogModalProps = {
  pengajuan: string | null;
  entries: EntityAuditLogEntry[];
  onClose: () => void;
};

export function ClientEntityLogModal({ pengajuan, entries, onClose }: ClientEntityLogModalProps) {
  return (
    <Modal
      open={Boolean(pengajuan)}
      onClose={onClose}
      title="Log Activity"
      description={pengajuan ? `Riwayat perubahan data entitas pada pengajuan ${pengajuan}.` : undefined}
      widthClassName="w-[min(92vw,640px)]"
      bodyClassName="max-h-[60vh] overflow-y-auto px-5 py-4"
    >
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-secondary bg-neutral-50 px-4 py-6 text-center text-[12px] text-neutral-600">
          Belum ada perubahan data entitas yang tercatat untuk pengajuan ini.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry, index) => (
            <li key={`${entry.pengajuan}-${entry.field}-${index}`} className="rounded-xl border border-border-primary bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{entry.section}</Badge>
                <span className="text-[11px] text-neutral-500">{entry.changedAt}</span>
              </div>
              <div className="mt-2 text-[13px] font-semibold text-neutral-800">{entry.field}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="rounded-md bg-error-50 px-2 py-1 text-error-700 line-through">{entry.oldValue}</span>
                <span className="text-neutral-400">→</span>
                <span className="rounded-md bg-success-50 px-2 py-1 text-success-700">{entry.newValue}</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Diubah oleh <span className="font-medium text-neutral-800">{entry.changedBy}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
