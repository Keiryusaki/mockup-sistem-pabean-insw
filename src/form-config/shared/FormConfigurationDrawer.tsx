import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { Select } from "../../components/FormControls";
import { AnimatedDrawer } from "../../components/AnimatedDrawer";
import { cloneConfigFile } from "./resolver";
import type { DocumentConfigFile, DocumentFormConfig, FieldOverride, FormStepCatalogItem, SectionOverride, StepOverride } from "./types";

type SelectedNode =
  | { type: "step"; stepId: string }
  | { type: "section"; stepId: string; sectionId: string }
  | { type: "field"; stepId: string; sectionId: string; fieldId: string };

type Props = {
  open: boolean;
  configFile: DocumentConfigFile;
  documentId: string;
  onChange: (config: DocumentConfigFile) => void;
  onDocumentChange: (id: string) => void;
  onClose: () => void;
  onMessage: (message: string) => void;
  allowLocalDraft: boolean;
  catalog: FormStepCatalogItem[];
  title?: string;
  contextLabel?: string;
  allowDocumentManagement?: boolean;
  onSaveDraft: (config: DocumentConfigFile) => void;
  onReset: () => void | Promise<void>;
  onApply: (config: DocumentConfigFile) => Promise<string>;
  resetLabel?: string;
};

const inputClass = "h-10 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-800 outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100";

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={["flex w-fit items-center gap-2.5 text-[12px]", disabled ? "cursor-not-allowed text-neutral-400" : "cursor-pointer text-neutral-700"].join(" ")}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand-primary-500 disabled:cursor-not-allowed" />
      <span>{label}</span>
    </label>
  );
}

export function FormConfigurationDrawer({ open, configFile, documentId, onChange, onDocumentChange, onClose, onMessage, allowLocalDraft, catalog, title = "Kelola Konfigurasi Form", contextLabel, allowDocumentManagement = true, onSaveDraft, onReset, onApply, resetLabel = "Reset ke Published" }: Props) {
  const [selected, setSelected] = useState<SelectedNode>({ type: "field", stepId: "pengajuan", sectionId: "header-pengajuan", fieldId: "nomorPengajuan" });
  const [isPublishing, setIsPublishing] = useState(false);
  const document = configFile.documents.find((item) => item.id === documentId) ?? configFile.documents[0];

  const updateDocument = (updater: (current: DocumentFormConfig) => DocumentFormConfig) => {
    onChange({ ...configFile, documents: configFile.documents.map((item) => item.id === document.id ? updater(item) : item) });
  };

  const updateStep = (stepId: string, updater: (current: StepOverride) => StepOverride) => {
    updateDocument((current) => ({ ...current, steps: { ...current.steps, [stepId]: updater(current.steps?.[stepId] ?? {}) } }));
  };

  const updateSection = (stepId: string, sectionId: string, updater: (current: SectionOverride) => SectionOverride) => {
    updateStep(stepId, (step) => ({ ...step, sections: { ...step.sections, [sectionId]: updater(step.sections?.[sectionId] ?? {}) } }));
  };

  const updateField = (stepId: string, sectionId: string, fieldId: string, updater: (current: FieldOverride) => FieldOverride) => {
    updateSection(stepId, sectionId, (section) => ({ ...section, fields: { ...section.fields, [fieldId]: updater(section.fields?.[fieldId] ?? {}) } }));
  };

  const selectedCatalog = useMemo(() => {
    const step = catalog.find((item) => item.id === selected.stepId);
    const section = selected.type === "step" ? undefined : step?.sections.find((item) => item.id === selected.sectionId);
    const field = selected.type === "field" ? section?.fields.find((item) => item.id === selected.fieldId) : undefined;
    return { step, section, field };
  }, [catalog, selected]);

  useEffect(() => {
    if (selectedCatalog.step) return;
    const firstStep = catalog[0];
    const firstSection = firstStep?.sections[0];
    const firstField = firstSection?.fields[0];
    if (firstStep && firstSection && firstField) setSelected({ type: "field", stepId: firstStep.id, sectionId: firstSection.id, fieldId: firstField.id });
    else if (firstStep && firstSection) setSelected({ type: "section", stepId: firstStep.id, sectionId: firstSection.id });
    else if (firstStep) setSelected({ type: "step", stepId: firstStep.id });
  }, [catalog, selectedCatalog.step]);

  const selectedStepOverride = document.steps?.[selected.stepId] ?? {};
  const selectedSectionOverride = selected.type === "step" ? undefined : selectedStepOverride.sections?.[selected.sectionId] ?? {};
  const selectedFieldOverride = selected.type === "field" ? selectedSectionOverride?.fields?.[selected.fieldId] ?? {} : undefined;
  const selectedSectionApplicable = selectedCatalog.section
    ? document.id === "ALL" || !selectedCatalog.section.documentTypes?.length || selectedCatalog.section.documentTypes.includes(document.id)
    : true;
  const selectedFieldApplicable = selectedCatalog.field
    ? document.id === "ALL" || !selectedCatalog.field.documentTypes?.length || selectedCatalog.field.documentTypes.includes(document.id)
    : true;
  const selectedFieldBaseOverride = selectedCatalog.field?.documentOverrides?.[document.id] ?? {};
  const selectedFieldBaseLabel = selectedFieldBaseOverride.label ?? selectedCatalog.field?.label ?? "";
  const selectedFieldBaseRequired = selectedFieldBaseOverride.required ?? Boolean(selectedCatalog.field?.required);

  const addDocument = () => {
    const id = `DOC_${Date.now()}`;
    onChange({ ...configFile, documents: [...configFile.documents, { id, label: "Dokumen Baru", defaultRequiresQuarantine: false }] });
    onDocumentChange(id);
    onMessage("Konfigurasi dokumen baru ditambahkan sebagai draft lokal.");
  };

  const duplicateDocument = () => {
    const id = `${document.id}_COPY_${Date.now()}`;
    const copy = cloneConfigFile({ version: configFile.version, documents: [document] }).documents[0];
    copy.id = id;
    copy.label = `${document.label} (Salinan)`;
    copy.archived = false;
    onChange({ ...configFile, documents: [...configFile.documents, copy] });
    onDocumentChange(id);
    onMessage("Konfigurasi dokumen berhasil diduplikasi.");
  };

  const archiveDocument = () => {
    if (["ALL", "BC20"].includes(document.id)) {
      onMessage("Semua Elemen Form dan BC 2.0 tidak dapat diarsipkan.");
      return;
    }
    onChange({ ...configFile, documents: configFile.documents.map((item) => item.id === document.id ? { ...item, archived: true } : item) });
    onDocumentChange("BC20");
    onMessage("Dokumen diarsipkan dan tidak lagi tampil pada pilihan form.");
  };

  const resetToRepository = () => {
    void onReset();
  };

  const publishConfiguration = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      onMessage(await onApply(configFile));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Gagal memublikasikan konfigurasi.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatedDrawer
      open={open}
      onClose={onClose}
      ariaLabel="Kelola Konfigurasi Form"
      busy={isPublishing}
      dismissible={!isPublishing}
      panelClassName="max-w-[1120px] bg-background-secondary"
      duration={340}
      renderContent={() => (
        <div className="flex h-full min-h-0 flex-col bg-background-secondary">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-primary bg-white px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-600">{contextLabel ?? (allowLocalDraft ? "Development tool · localhost" : "Development tool · intranet session")}</div>
            <h2 className="mt-1 text-[20px] font-semibold text-neutral-800">{title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowLocalDraft ? <Button variant="outline" size="sm" disabled={isPublishing} onClick={() => { onSaveDraft(configFile); onMessage("Draft konfigurasi disimpan di browser lokal."); }}>Simpan Draft Lokal</Button> : null}
            {allowLocalDraft ? <Button variant="outline" size="sm" disabled={isPublishing} onClick={resetToRepository}>{resetLabel}</Button> : null}
            <Button variant="primary" size="sm" disabled={isPublishing} onClick={() => void publishConfiguration()}>
              {isPublishing ? "Memublikasikan..." : "Publikasikan Konfigurasi"}
            </Button>
            <Button variant="ghost" size="sm" disabled={isPublishing} onClick={onClose}>Tutup</Button>
          </div>
        </header>

        {isPublishing ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75 px-5 backdrop-blur-[2px]" role="status" aria-live="polite">
            <div className="flex max-w-sm flex-col items-center rounded-2xl border border-brand-primary-100 bg-white px-7 py-6 text-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 animate-spin text-brand-primary-600" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="mt-4 text-[14px] font-semibold text-neutral-800">Memublikasikan konfigurasi</div>
              <p className="mt-1 text-[12px] leading-5 text-neutral-600">Data sedang dikirim ke Apps Script dan disimpan sebagai revision baru. Mohon jangan menutup halaman.</p>
            </div>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_330px]">
          <aside className="overflow-y-auto border-r border-border-primary bg-white p-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Jenis Dokumen</label>
            <div className="mt-2">
              <Select
                value={document.id}
                onValueChange={onDocumentChange}
                options={configFile.documents.filter((item) => !item.archived).map((item) => ({ label: item.label, value: item.id }))}
                placeholder="Pilih jenis dokumen"
              />
            </div>
            {allowDocumentManagement ? <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={addDocument}>Tambah</Button>
              <Button variant="outline" size="sm" onClick={duplicateDocument}>Duplikasi</Button>
              <Button variant="error" size="sm" onClick={archiveDocument}>Archive</Button>
            </div> : null}

            <div className="mt-5 space-y-3">
              {catalog.map((step) => {
                const stepOverride = document.steps?.[step.id] ?? {};
                return (
                  <div key={step.id} className="rounded-xl border border-border-primary bg-white p-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={stepOverride.enabled !== false} onChange={(event) => updateStep(step.id, (current) => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-brand-primary-500" />
                      <button type="button" onClick={() => setSelected({ type: "step", stepId: step.id })} className="flex-1 text-left text-[12px] font-semibold text-neutral-800">{step.label}</button>
                    </div>
                    <div className="ml-3 mt-2 space-y-2 border-l border-border-primary pl-3">
                      {step.sections.map((section) => {
                        const sectionOverride = stepOverride.sections?.[section.id] ?? {};
                        const applicable = document.id === "ALL" || !section.documentTypes?.length || section.documentTypes.includes(document.id);
                        return (
                          <div key={section.id} title={applicable ? undefined : `Section khusus dokumen lain dan tidak tersedia untuk ${document.label}`}>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={applicable && sectionOverride.enabled !== false} disabled={!applicable} onChange={(event) => updateSection(step.id, section.id, (current) => ({ ...current, enabled: event.target.checked }))} className="h-3.5 w-3.5 accent-brand-primary-500 disabled:cursor-not-allowed" />
                              <button type="button" onClick={() => setSelected({ type: "section", stepId: step.id, sectionId: section.id })} className="flex-1 text-left text-[11px] font-semibold text-neutral-700">{section.label}{section.presentation === "modal" ? " (Modal)" : ""}{applicable ? "" : " · di luar default"}</button>
                            </div>
                            {section.fields.length ? (
                              <div className="ml-3 mt-1.5 space-y-1 border-l border-border-primary pl-3">
                                {section.fields.map((field) => {
                                  const fieldOverride = sectionOverride.fields?.[field.id] ?? {};
                                  const applicable = document.id === "ALL" || !field.documentTypes?.length || field.documentTypes.includes(document.id);
                                  return (
                                    <div key={field.id} className="flex items-center gap-2" title={applicable ? undefined : `Di luar mapping default ${document.label}; dapat diaktifkan manual`}>
                                      <input type="checkbox" checked={fieldOverride.enabled ?? applicable} onChange={(event) => updateField(step.id, section.id, field.id, (current) => ({ ...current, enabled: event.target.checked }))} className="h-3.5 w-3.5 accent-brand-primary-500" />
                                      <button type="button" onClick={() => setSelected({ type: "field", stepId: step.id, sectionId: section.id, fieldId: field.id })} className="min-w-0 flex-1 truncate text-left text-[11px] text-neutral-600">{fieldOverride.label || field.documentOverrides?.[document.id]?.label || field.label}{applicable ? "" : " · di luar default"}</button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="overflow-y-auto p-5">
            <div className="rounded-2xl border border-brand-primary-100 bg-brand-primary-50/60 p-4 text-[12px] leading-6 text-brand-primary-800">
              Setiap perubahan langsung diterapkan pada preview Form Pengajuan di belakang drawer. Tutup drawer untuk meninjau keseluruhan hasil.
            </div>
            <div className="mt-4 rounded-2xl border border-border-primary bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">Dokumen Aktif</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-2 block text-[12px] font-medium text-neutral-700">ID Teknis</span><input className={inputClass} value={document.id} disabled /></label>
                <label className="block"><span className="mb-2 block text-[12px] font-medium text-neutral-700">Nama Dokumen</span><input className={inputClass} value={document.label} onChange={(event) => updateDocument((current) => ({ ...current, label: event.target.value }))} /></label>
              </div>
              <div className="mt-4"><Toggle label="Karantina aktif secara default" checked={document.defaultRequiresQuarantine} onChange={(checked) => updateDocument((current) => ({ ...current, defaultRequiresQuarantine: checked }))} /></div>
            </div>
          </main>

          <aside className="overflow-y-auto border-l border-border-primary bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Pengaturan Elemen</div>
            <h3 className="mt-2 text-[18px] font-semibold text-neutral-800">{selectedCatalog.field?.label ?? selectedCatalog.section?.label ?? selectedCatalog.step?.label}</h3>
            <div className="mt-5 space-y-4">
              {selected.type === "step" && selectedCatalog.step ? (
                <>
                  <Toggle label="Tampilkan step" checked={selectedStepOverride.enabled !== false} onChange={(checked) => updateStep(selected.stepId, (current) => ({ ...current, enabled: checked }))} />
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Custom Label</span><input className={inputClass} value={selectedStepOverride.label ?? ""} placeholder={selectedCatalog.step.label} onChange={(event) => updateStep(selected.stepId, (current) => ({ ...current, label: event.target.value }))} /></label>
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Urutan</span><input type="number" className={inputClass} value={selectedStepOverride.order ?? ""} onChange={(event) => updateStep(selected.stepId, (current) => ({ ...current, order: event.target.value === "" ? undefined : Number(event.target.value) }))} /></label>
                </>
              ) : null}
              {selected.type === "section" && selectedCatalog.section && selectedSectionOverride ? (
                <>
                  {!selectedSectionApplicable ? <div className="rounded-xl border border-warning-100 bg-warning-50 p-3 text-[11px] leading-5 text-warning-700">Section ini khusus jenis dokumen lain dan tidak dapat diaktifkan untuk {document.label}.</div> : null}
                  <Toggle label="Tampilkan section" checked={selectedSectionApplicable && selectedSectionOverride.enabled !== false} disabled={!selectedSectionApplicable} onChange={(checked) => updateSection(selected.stepId, selected.sectionId, (current) => ({ ...current, enabled: checked }))} />
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Custom Label</span><input className={inputClass} value={selectedSectionOverride.label ?? ""} placeholder={selectedCatalog.section.label} onChange={(event) => updateSection(selected.stepId, selected.sectionId, (current) => ({ ...current, label: event.target.value }))} /></label>
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Deskripsi Card</span><textarea className="min-h-24 w-full rounded-md border border-border-primary bg-white p-3 text-[12px] outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100" value={selectedSectionOverride.description ?? ""} placeholder={selectedCatalog.section.description ?? "Tulis deskripsi singkat section ini."} onChange={(event) => updateSection(selected.stepId, selected.sectionId, (current) => ({ ...current, description: event.target.value }))} /></label>
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Urutan</span><input type="number" className={inputClass} value={selectedSectionOverride.order ?? ""} onChange={(event) => updateSection(selected.stepId, selected.sectionId, (current) => ({ ...current, order: event.target.value === "" ? undefined : Number(event.target.value) }))} /></label>
                </>
              ) : null}
              {selected.type === "field" && selectedCatalog.field && selectedFieldOverride ? (
                <>
                  <div className="rounded-xl bg-background-primary p-3 text-[11px] text-neutral-600">Field ID: <strong className="text-neutral-800">{selected.fieldId}</strong></div>
                  {!selectedFieldApplicable ? <div className="rounded-xl border border-warning-100 bg-warning-50 p-3 text-[11px] leading-5 text-warning-700">Field ini berada di luar mapping default {document.label}. Aktifkan “Tampilkan field” untuk membuat override dan menampilkannya pada form dokumen ini.</div> : null}
                  <Toggle label="Tampilkan field" checked={selectedFieldOverride.enabled ?? selectedFieldApplicable} onChange={(checked) => updateField(selected.stepId, selected.sectionId, selected.fieldId, (current) => ({ ...current, enabled: checked }))} />
                  <Toggle label="Wajib diisi" checked={selectedFieldOverride.required ?? selectedFieldBaseRequired} onChange={(checked) => updateField(selected.stepId, selected.sectionId, selected.fieldId, (current) => ({ ...current, required: checked }))} />
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Custom Label</span><input className={inputClass} value={selectedFieldOverride.label ?? ""} placeholder={selectedFieldBaseLabel} onChange={(event) => updateField(selected.stepId, selected.sectionId, selected.fieldId, (current) => ({ ...current, label: event.target.value }))} /></label>
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Urutan</span><input type="number" className={inputClass} value={selectedFieldOverride.order ?? ""} onChange={(event) => updateField(selected.stepId, selected.sectionId, selected.fieldId, (current) => ({ ...current, order: event.target.value === "" ? undefined : Number(event.target.value) }))} /></label>
                  <label className="block"><span className="mb-2 block text-[12px] text-neutral-700">Helper Text</span><textarea className="min-h-24 w-full rounded-md border border-border-primary bg-white p-3 text-[12px] outline-none focus:border-brand-primary-500" value={selectedFieldOverride.helperText ?? ""} onChange={(event) => updateField(selected.stepId, selected.sectionId, selected.fieldId, (current) => ({ ...current, helperText: event.target.value }))} /></label>
                </>
              ) : null}
            </div>
          </aside>
        </div>
        </div>
      )}
    />
  );
}
