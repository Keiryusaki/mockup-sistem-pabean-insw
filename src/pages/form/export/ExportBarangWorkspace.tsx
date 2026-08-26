import { useMemo, useRef, useState } from "react";
import { AnimatedDrawer } from "../../../components/AnimatedDrawer";
import { DrawerTocIcon, DrawerTocLayout } from "../../../components/DrawerTocLayout";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ConfigurableRecordTable, type ConfigurableRecord } from "../../../components/ConfigurableRecordTable";
import { DynamicFormField, type DynamicFieldDefinition } from "../../../components/DynamicFormField";
import { ArrowRightIcon, HamburgerMenuIcon, Pen2Icon } from "../../../components/Icons";
import { SectionStatusIconBadge, type SectionStatus } from "../../../components/SectionStatusIconBadge";
import type { ExportSourceField, ExportSourceSection } from "../../../form-config/export/export-mapping-types";

type WorkspaceField = ExportSourceField & { displayLabel: string };
type WorkspaceSection = Omit<ExportSourceSection, "fields"> & { fields: WorkspaceField[] };

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11 5h2v14h-2z" /><path d="M5 11h14v2H5z" /></svg>;
}

const fieldDefinition = (field: WorkspaceField): DynamicFieldDefinition => ({
  id: field.id,
  label: field.displayLabel,
  inputType: field.inputType,
  readOnly: field.readOnly,
  required: field.required,
  options: field.options,
});

export function ExportBarangWorkspace({ barangSection, childSections, rowsBySection, onChangeSection, onMessage }: {
  barangSection: WorkspaceSection;
  childSections: WorkspaceSection[];
  rowsBySection: Record<string, ConfigurableRecord[]>;
  onChangeSection: (sectionId: string, rows: ConfigurableRecord[]) => void;
  onMessage: (message: string) => void;
}) {
  const barangRows = rowsBySection[barangSection.id] ?? [];
  const barangHasMissingMandatory = barangRows.some((row) => barangSection.fields.some((field) => field.required && !field.readOnly && !row[field.id]?.trim()));
  const barangAllFieldsFilled = barangRows.length > 0 && barangRows.every((row) => barangSection.fields.every((field) => field.readOnly || Boolean(row[field.id]?.trim())));
  const barangStatus = barangRows.length === 0
    ? { label: "Belum Diisi", tone: "warning" as const }
    : barangHasMissingMandatory
      ? { label: "Wajib Dilengkapi", tone: "error" as const }
      : barangAllFieldsFilled
        ? { label: "Lengkap", tone: "success" as const }
        : { label: "Belum Lengkap", tone: "warning" as const };
  const [editor, setEditor] = useState<{ mode: "add" | "edit"; index: number; row: ConfigurableRecord } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const discardDraftOnExitRef = useRef(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"data-barang" | "compliance">("data-barang");
  const [tocOpen, setTocOpen] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const selectedRecordId = editor?.row._recordId ?? "";
  const barangTableUsesScroll = barangSection.fields.length > 5;
  const barangTableMinWidth = barangTableUsesScroll ? barangSection.fields.length * 180 + 160 : undefined;

  const openAdd = () => {
    const row: ConfigurableRecord = {
      _recordId: globalThis.crypto?.randomUUID?.() ?? `barang-${Date.now()}`,
      ...Object.fromEntries(barangSection.fields.map((field) => [field.id, ""])),
    };
    setValidationMessage("");
    setActiveDrawerTab("data-barang");
    setTocOpen(true);
    setEditor({ mode: "add", index: barangRows.length, row });
    setDrawerOpen(true);
  };
  const openEdit = (index: number) => {
    const source = barangRows[index];
    setValidationMessage("");
    setActiveDrawerTab("data-barang");
    setTocOpen(true);
    setEditor({ mode: "edit", index, row: { ...source, _recordId: source._recordId || `barang-${Date.now()}-${index}` } });
    setDrawerOpen(true);
  };
  const saveBarang = () => {
    if (!editor) return;
    const missing = barangSection.fields.filter((field) => field.required && !field.readOnly && !editor.row[field.id]?.trim());
    if (missing.length > 0) {
      setValidationMessage(`Lengkapi field wajib: ${missing.slice(0, 3).map((field) => field.displayLabel).join(", ")}${missing.length > 3 ? ` dan ${missing.length - 3} lainnya` : ""}.`);
      return;
    }
    const rows = [...barangRows];
    if (editor.mode === "add") rows.push(editor.row); else rows[editor.index] = editor.row;
    onChangeSection(barangSection.id, rows);
    onMessage(`Barang berhasil ${editor.mode === "add" ? "ditambahkan" : "diperbarui"}.`);
    discardDraftOnExitRef.current = false;
    setDrawerOpen(false);
  };
  const clearBarangData = () => {
    childSections.forEach((section) => onChangeSection(section.id, []));
    onChangeSection(barangSection.id, []);
    onMessage("Seluruh data barang dan child data ekspor sudah dihapus.");
  };

  const scopedBahanAsalRows = useMemo(
    () => (rowsBySection["barang-bahan-asal"] ?? []).filter((row) => row._barangRef === selectedRecordId),
    [rowsBySection, selectedRecordId],
  );
  const bahanAsalIds = new Set(scopedBahanAsalRows.map((row) => row._recordId));

  const scopedRows = (section: WorkspaceSection) => {
    const rows = rowsBySection[section.id] ?? [];
    if (section.relation?.parentSectionId === "barang-info") return rows.filter((row) => row[section.relation!.foreignKey] === selectedRecordId);
    if (section.relation?.parentSectionId === "barang-bahan-asal") return rows.filter((row) => bahanAsalIds.has(row[section.relation!.foreignKey]));
    return rows;
  };
  const updateScopedRows = (section: WorkspaceSection, rows: ConfigurableRecord[]) => {
    const current = rowsBySection[section.id] ?? [];
    if (section.relation?.parentSectionId === "barang-info") {
      const untouched = current.filter((row) => row[section.relation!.foreignKey] !== selectedRecordId);
      onChangeSection(section.id, [...untouched, ...rows.map((row) => ({ ...row, [section.relation!.foreignKey]: selectedRecordId }))]);
      return;
    }
    if (section.relation?.parentSectionId === "barang-bahan-asal") {
      const untouched = current.filter((row) => !bahanAsalIds.has(row[section.relation!.foreignKey]));
      onChangeSection(section.id, [...untouched, ...rows]);
      return;
    }
    onChangeSection(section.id, rows);
  };

  const dataBarangSectionIds = new Set(["barang-satuan-kemasan", "barang-spesifikasi", "barang-bahan-asal"]);
  const tabSections = activeDrawerTab === "data-barang"
    ? childSections.filter((section) => dataBarangSectionIds.has(section.id))
    : childSections.filter((section) => !dataBarangSectionIds.has(section.id));
  const tocSections = activeDrawerTab === "data-barang"
    ? [{ id: "barang-info", label: "Informasi Barang", description: barangSection.description }, ...tabSections]
    : tabSections;

  const drawerSectionStatus = (sectionId: string): SectionStatus => {
    if (sectionId === "barang-info") {
      const hasAnyValue = barangSection.fields.some((field) => Boolean(editor?.row[field.id]?.trim()));
      if (!hasAnyValue) return { label: "Belum Diisi", tone: "warning", detail: "Data inti barang belum mulai diisi." };
      const missingMandatory = barangSection.fields.some((field) => field.required && !field.readOnly && !editor?.row[field.id]?.trim());
      if (missingMandatory) return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
      const allFilled = barangSection.fields.every((field) => field.readOnly || Boolean(editor?.row[field.id]?.trim()));
      return allFilled ? { label: "Lengkap", tone: "success", detail: "Seluruh informasi barang sudah terisi." } : { label: "Belum Lengkap", tone: "warning", detail: "Field mandatory sudah terisi, tetapi masih ada informasi opsional yang kosong." };
    }
    const section = childSections.find((item) => item.id === sectionId);
    if (!section) return { label: "Belum Diisi", tone: "warning", detail: "Section ini belum mulai diisi." };
    const rows = scopedRows(section);
    if (rows.length === 0) return { label: "Belum Diisi", tone: "warning", detail: "Belum ada record pada section ini." };
    const missingMandatory = rows.some((row) => (section.relation && !row[section.relation.foreignKey]?.trim()) || section.fields.some((field) => field.required && !field.readOnly && !row[field.id]?.trim()));
    if (missingMandatory) return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
    const allFilled = rows.every((row) => section.fields.every((field) => field.readOnly || Boolean(row[field.id]?.trim())));
    return allFilled ? { label: "Lengkap", tone: "success", detail: "Seluruh record pada section ini sudah lengkap." } : { label: "Belum Lengkap", tone: "warning", detail: "Field mandatory sudah terisi, tetapi masih ada informasi opsional yang kosong." };
  };

  const fieldsForSection = (section: WorkspaceSection): DynamicFieldDefinition[] => [
        ...(section.relation?.parentSectionId === "barang-bahan-asal"
          ? [{
              id: section.relation.foreignKey,
              label: section.relation.label,
              inputType: "select" as const,
              required: true,
              options: scopedBahanAsalRows.map((row, index) => ({ value: row._recordId, label: row.kodeBarang || row.uraianBarang || `Bahan Asal ${index + 1}` })),
            }]
          : []),
        ...section.fields.map(fieldDefinition),
      ];

  const jumpToSection = (sectionId: string) => {
    const target = document.getElementById(`export-drawer-${sectionId}`);
    const container = target?.closest(".export-drawer-scroll") as HTMLElement | null;
    if (!target || !container) return;
    const top = target.offsetTop - container.offsetTop - 64;
    container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const closeEditor = () => {
    discardDraftOnExitRef.current = editor?.mode === "add";
    setDrawerOpen(false);
  };

  const finishClosingEditor = () => {
    if (discardDraftOnExitRef.current) childSections.forEach((section) => updateScopedRows(section, []));
    discardDraftOnExitRef.current = false;
    setEditor(null);
  };

  return (
    <>
      <section className="min-w-0 rounded-2xl border border-border-primary bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 border-b border-border-primary pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600"><HamburgerMenuIcon className="h-5 w-5" /></span>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Step Barang</div>
              <h2 className="mt-1 text-[22px] font-semibold text-neutral-800">Daftar Barang</h2>
              <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{barangSection.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2"><Badge variant={barangStatus.tone}>{barangStatus.label}</Badge><Badge variant="secondary">{barangRows.length} barang</Badge></div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="primary" size="sm" startIcon={<PlusIcon />} onClick={openAdd}>Tambah Barang</Button>
          <Button variant="outline" size="sm" onClick={() => onMessage("Import Excel Barang Ekspor masih placeholder mockup.")}>Import Excel</Button>
          <Button variant="error" size="sm" onClick={clearBarangData}>Clear Data</Button>
        </div>
        <div className="mt-4 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-border-primary">
          <table className={`w-full border-collapse text-left text-[12px] ${barangTableUsesScroll ? "table-auto" : "table-fixed"}`} style={barangTableMinWidth ? { minWidth: barangTableMinWidth } : undefined}>
            <colgroup>{barangSection.fields.map((field) => <col key={field.id} style={barangTableUsesScroll ? { width: 180 } : undefined} />)}<col className="w-[160px]" /></colgroup>
            <thead className="bg-brand-primary-500 text-white"><tr>{barangSection.fields.map((field) => <th key={field.id} className={`px-3 py-3 font-semibold leading-4 ${barangTableUsesScroll ? "whitespace-nowrap" : "break-words whitespace-normal"}`}>{field.displayLabel}</th>)}<th className="whitespace-nowrap px-3 py-3">Aksi</th></tr></thead>
            <tbody>
              {barangRows.length === 0 ? <tr><td colSpan={barangSection.fields.length + 1} className="px-4 py-10 text-center text-neutral-500">Belum ada data barang.</td></tr> : barangRows.map((row, index) => (
                <tr key={row._recordId ?? index} className="border-t border-border-primary align-top hover:bg-brand-primary-50/20">
                  {barangSection.fields.map((field) => <td key={field.id} className="max-w-[260px] truncate px-3 py-3 text-neutral-700" title={row[field.id] || "-"}>{row[field.id] || "-"}</td>)}
                  <td className="px-3 py-3"><Button variant="warning" size="sm" startIcon={<Pen2Icon className="h-4 w-4" />} className="whitespace-nowrap" onClick={() => openEdit(index)}>Kelola Detail</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editor ? (
        <AnimatedDrawer
          open={drawerOpen}
          onClose={closeEditor}
          onExited={finishClosingEditor}
          ariaLabel="Kelola Detail Barang"
          panelClassName="!w-[min(calc(58vw+280px),calc(100vw-0.5rem))] !max-w-none !border-0 !bg-transparent !shadow-none"
          overflowVisible
          deferContent={false}
          renderContent={() => (
            <DrawerTocLayout
              open={tocOpen}
              onOpenChange={setTocOpen}
              compactItems={tocSections.map((section) => ({ id: section.id, label: section.label, icon: <DrawerTocIcon kind={section.id} />, status: drawerSectionStatus(section.id), onClick: () => jumpToSection(section.id) }))}
              toc={(
                <>
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-primary pb-2">
                    <div><div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">TOC</div><div className="text-[11px] text-neutral-700">Lompat cepat</div></div>
                    <button type="button" onClick={() => setTocOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary-500 text-brand-primary-600"><ArrowRightIcon className="h-3.5 w-3.5 rotate-180" /></button>
                  </div>
                  <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                    {tocSections.map((section) => (
                      <button key={section.id} type="button" onClick={() => jumpToSection(section.id)} className="relative flex w-full items-start gap-2.5 rounded-xl border border-border-primary bg-white px-2.5 py-2.5 text-left hover:border-brand-primary-300 hover:bg-brand-primary-50/60">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary-50 text-brand-primary-600"><DrawerTocIcon kind={section.id} className="h-4 w-4" /></span>
                        <span className="min-w-0 pr-7"><span className="block text-[11px] font-semibold text-neutral-800">{section.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-neutral-600">{section.description}</span></span>
                        <span className="absolute right-2 top-2"><SectionStatusIconBadge status={drawerSectionStatus(section.id)} /></span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            >
            <div className="relative flex h-full min-h-0 flex-col bg-white">
              <div className="flex items-start justify-between gap-4 border-b border-border-primary px-5 py-4">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">Workspace Barang</div>
                  <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-neutral-800">{editor.mode === "add" ? "Tambah Barang" : `Barang ${editor.row.seri || editor.row.kodeBarang || "Terpilih"}`}</h2>
                  <p className="mt-2 max-w-4xl text-[12px] leading-6 text-neutral-600">{editor.mode === "add" ? "Isi data barang baru lalu simpan untuk menambah record ke tabel barang." : "Kelola data inti dan detail turunannya dari workspace barang yang sama."}</p>
                </div>
                <button type="button" onClick={closeEditor} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 shadow-sm hover:bg-brand-primary-50" aria-label="Tutup drawer">×</button>
              </div>

              <div className="relative min-h-0 flex-1 overflow-visible">
                <div className="export-drawer-scroll h-full min-h-0 overflow-y-auto px-4 pb-24 lg:px-5">
                  <div className="sticky top-0 z-20 border-b border-border-primary bg-white/95 backdrop-blur">
                    <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border-primary bg-white p-1">
                      <Button fullWidth variant={activeDrawerTab === "data-barang" ? "primary" : "ghost"} size="sm" onClick={() => setActiveDrawerTab("data-barang")} className={`rounded-md border-0 shadow-none ${activeDrawerTab === "data-barang" ? "!bg-brand-primary-500 !text-white" : "!bg-transparent !text-neutral-700"}`}>Data Barang</Button>
                      <Button fullWidth variant={activeDrawerTab === "compliance" ? "primary" : "ghost"} size="sm" onClick={() => setActiveDrawerTab("compliance")} className={`rounded-md border-0 shadow-none ${activeDrawerTab === "compliance" ? "!bg-brand-primary-500 !text-white" : "!bg-transparent !text-neutral-700"}`}>Compliance & Perizinan</Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {activeDrawerTab === "data-barang" ? (
                      <section id="export-drawer-barang-info" className="rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
                          <div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">Informasi Barang</div><p className="mt-1 text-[12px] text-neutral-600">Edit data inti untuk barang seri ini.</p></div>
                          <Badge variant={drawerSectionStatus("barang-info").tone}>{drawerSectionStatus("barang-info").label}</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{barangSection.fields.map((field) => <DynamicFormField key={field.id} field={fieldDefinition(field)} value={editor.row[field.id] ?? ""} onChange={(value) => { setValidationMessage(""); setEditor((current) => current ? { ...current, row: { ...current.row, [field.id]: value } } : current); }} />)}</div>
                      </section>
                    ) : null}
                    {tabSections.map((section) => (
                      <section key={section.id} id={`export-drawer-${section.id}`} className="min-w-0 rounded-2xl border border-border-primary bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-border-primary pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-[11px] uppercase tracking-[0.16em] text-brand-primary-600">{section.label}</div><p className="mt-1 text-[12px] text-neutral-600">{section.description}</p></div><Badge variant={drawerSectionStatus(section.id).tone}>{drawerSectionStatus(section.id).label}</Badge></div>
                        <div className="mt-4"><ConfigurableRecordTable title={section.label} fields={fieldsForSection(section)} rows={scopedRows(section)} onChange={(rows) => updateScopedRows(section, rows)} onMessage={onMessage} /></div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t border-border-primary bg-white/95 px-5 py-4 backdrop-blur"><div className="text-[11px] text-error-600">{validationMessage}</div><div className="ml-auto flex gap-2"><Button variant="outline" size="sm" onClick={closeEditor}>Batal</Button><Button variant="primary" size="sm" onClick={saveBarang}>Simpan Barang</Button></div></div>
            </div>
            </DrawerTocLayout>
          )}
        />
      ) : null}
    </>
  );
}
