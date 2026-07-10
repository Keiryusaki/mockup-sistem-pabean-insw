import { Button } from "../../components/Button";
import { Input, Select } from "../../components/FormControls";
import { MagniferIcon } from "../../components/Icons";

type ProposalFiltersProps = {
  searchDraft: string;
  documentTypeDraft: string;
  dateFromDraft: string;
  dateToDraft: string;
  documentTypeOptions: Array<{ label: string; value: string }>;
  canResetFilters: boolean;
  hasPendingFilterChanges: boolean;
  onSearchDraftChange: (value: string) => void;
  onDocumentTypeDraftChange: (value: string) => void;
  onDateFromDraftChange: (value: string) => void;
  onDateToDraftChange: (value: string) => void;
  onReset: () => void;
  onApply: () => void;
};

export function ProposalFilters({
  searchDraft,
  documentTypeDraft,
  dateFromDraft,
  dateToDraft,
  documentTypeOptions,
  canResetFilters,
  hasPendingFilterChanges,
  onSearchDraftChange,
  onDocumentTypeDraftChange,
  onDateFromDraftChange,
  onDateToDraftChange,
  onReset,
  onApply,
}: ProposalFiltersProps) {
  return (
    <div className="mt-2 border-b border-border-primary pb-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
        <div className="md:col-span-2 xl:col-span-2">
          <Input
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            type="search"
            placeholder="Cari pengajuan..."
            prefixIcon={<MagniferIcon />}
          />
        </div>
        <Select
          value={documentTypeDraft}
          onValueChange={onDocumentTypeDraftChange}
          options={documentTypeOptions}
        />
        <Input
          value={dateFromDraft}
          onChange={(event) => onDateFromDraftChange(event.target.value)}
          type="date"
          placeholder="Tanggal awal"
        />
        <Input
          value={dateToDraft}
          onChange={(event) => onDateToDraftChange(event.target.value)}
          type="date"
          placeholder="Tanggal akhir"
        />
        <div className="md:col-span-2 xl:col-span-1 xl:self-end">
          <div className="flex flex-wrap justify-end gap-2 xl:pt-0">
            <Button variant="outline" size="md" className="h-11" onClick={onReset} disabled={!canResetFilters}>
              Reset
            </Button>
            <Button variant="primary" size="md" className="h-11" onClick={onApply} disabled={!hasPendingFilterChanges}>
              Terapkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
