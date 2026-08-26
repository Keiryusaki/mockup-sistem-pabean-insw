import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { DynamicFormField, type DynamicFieldDefinition } from "./DynamicFormField";
import { PencilIcon, TrashBinTrashIcon } from "./Icons";

export type ConfigurableRecord = Record<string, string>;

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11 5h2v14h-2z" /><path d="M5 11h14v2H5z" /></svg>;
}

function RecordEditor({ title, subtitle, fields, value, validationMessage, onChange, onSave, onCancel }: {
  title: string;
  subtitle?: string;
  fields: DynamicFieldDefinition[];
  value: ConfigurableRecord;
  validationMessage: string;
  onChange: (fieldId: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-primary bg-background-primary/25 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">{title}</div>
      {subtitle ? <p className="mt-1 text-[11px] leading-5 text-neutral-600">{subtitle}</p> : null}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div key={field.id}>
            {field.id === "nomorDokumen" ? (
              <div className="mb-3 rounded-xl border border-dashed border-border-primary bg-white p-3">
                <div className="text-[11px] font-semibold text-brand-primary-600">Input File</div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(event) => onChange(field.id, event.target.files?.[0]?.name ?? "")} className="mt-2 block w-full text-[11px] text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary-500 file:px-3 file:py-2 file:font-semibold file:text-white" />
              </div>
            ) : null}
            <DynamicFormField field={field} value={value[field.id] ?? ""} onChange={(nextValue) => onChange(field.id, nextValue)} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-primary pt-3">
        <div className="text-[11px] text-error-600">{validationMessage}</div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Batal</Button>
          <Button variant="primary" size="sm" onClick={onSave}>Simpan</Button>
        </div>
      </div>
    </div>
  );
}

export function ConfigurableRecordTable({ title, fields, rows, onChange, onMessage, addLabel = "Tambah", headerActions }: {
  title: string;
  fields: DynamicFieldDefinition[];
  rows: ConfigurableRecord[];
  onChange: (rows: ConfigurableRecord[]) => void;
  onMessage?: (message: string) => void;
  addLabel?: string;
  headerActions?: ReactNode;
}) {
  const [editor, setEditor] = useState<{ mode: "add" | "edit"; index: number; row: ConfigurableRecord } | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const usesHorizontalScroll = fields.length > 4;
  const tableMinWidth = usesHorizontalScroll ? 56 + fields.length * 180 + 176 : undefined;
  const emptyRow = useMemo(() => ({
    _recordId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${rows.length + 1}`,
    ...Object.fromEntries(fields.map((field) => [field.id, field.id === "seri" ? String(rows.length + 1) : ""])),
  }), [fields, rows.length]);

  const updateEditor = (fieldId: string, value: string) => {
    setValidationMessage("");
    setEditor((current) => current ? { ...current, row: { ...current.row, [fieldId]: value } } : current);
  };
  const openAdd = () => { setValidationMessage(""); setEditor({ mode: "add", index: rows.length, row: emptyRow }); };
  const openEdit = (index: number) => { setValidationMessage(""); setEditor({ mode: "edit", index, row: { ...rows[index] } }); };
  const saveEditor = () => {
    if (!editor) return;
    const missingFields = fields.filter((field) => field.required && !field.readOnly && !editor.row[field.id]?.trim());
    if (missingFields.length > 0) {
      setValidationMessage(`Lengkapi field wajib: ${missingFields.slice(0, 3).map((field) => field.label).join(", ")}${missingFields.length > 3 ? ` dan ${missingFields.length - 3} lainnya` : ""}.`);
      return;
    }
    const nextRows = [...rows];
    if (editor.mode === "add") nextRows.push(editor.row); else nextRows[editor.index] = editor.row;
    onChange(nextRows);
    onMessage?.(`${title} berhasil ${editor.mode === "add" ? "ditambahkan" : "diperbarui"}.`);
    setEditor(null);
  };
  const removeRow = (index: number) => { onChange(rows.filter((_, rowIndex) => rowIndex !== index)); onMessage?.(`Record ${title} berhasil dihapus.`); };
  const display = (field: DynamicFieldDefinition, value?: string) => !value ? "-" : field.inputType === "checkbox" ? (value === "true" ? "Ya" : "Tidak") : value;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap justify-end gap-2">{headerActions}<Button variant="primary" size="sm" onClick={openAdd} startIcon={<PlusIcon />}>{addLabel}</Button></div>
      {editor?.mode === "add" ? <RecordEditor title={`Tambah ${title}`} subtitle="Record baru akan muncul di bagian bawah tabel setelah disimpan." fields={fields} value={editor.row} validationMessage={validationMessage} onChange={updateEditor} onSave={saveEditor} onCancel={() => setEditor(null)} /> : null}
      <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-border-primary">
        <table
          className={`w-full border-collapse text-left text-[12px] ${usesHorizontalScroll ? "table-auto" : "table-fixed"}`}
          style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}
        >
          <colgroup>
            <col className="w-14" />
            {fields.map((field) => <col key={field.id} style={usesHorizontalScroll ? { width: 180 } : undefined} />)}
            <col className="w-[176px]" />
          </colgroup>
          <thead className="bg-brand-primary-500 text-white"><tr><th className="px-3 py-2">#</th>{fields.map((field) => <th key={field.id} className={`px-3 py-2 font-semibold leading-4 ${usesHorizontalScroll ? "whitespace-nowrap" : "break-words whitespace-normal"}`}>{field.label}</th>)}<th className="whitespace-nowrap px-3 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={fields.length + 2} className="px-4 py-8 text-center text-neutral-500">Belum ada record {title.toLowerCase()}.</td></tr> : rows.map((row, index) => {
              const editing = editor?.mode === "edit" && editor.index === index;
              return (
                <Fragment key={row._recordId ?? `${title}-${index}`}>
                  <tr className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                    <td className="px-3 py-3 font-medium text-neutral-600">{index + 1}</td>
                    {fields.map((field) => <td key={field.id} className="max-w-[260px] truncate px-3 py-3 text-neutral-700" title={display(field, row[field.id])}>{display(field, row[field.id])}</td>)}
                    <td className="px-3 py-3"><div className="flex flex-nowrap items-center justify-end gap-2"><Button variant="warning" size="sm" startIcon={<PencilIcon className="h-3.5 w-3.5" />} onClick={() => openEdit(index)}>Edit</Button><Button variant="error" size="sm" startIcon={<TrashBinTrashIcon className="h-3.5 w-3.5" />} onClick={() => removeRow(index)}>Hapus</Button></div></td>
                  </tr>
                  {editing && editor ? <tr><td colSpan={fields.length + 2} className="border-t border-border-primary bg-background-primary/30 px-3 py-3"><RecordEditor title={`Edit ${title}`} subtitle="Perubahan akan menggantikan record yang dipilih." fields={fields} value={editor.row} validationMessage={validationMessage} onChange={updateEditor} onSave={saveEditor} onCancel={() => setEditor(null)} /></td></tr> : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
