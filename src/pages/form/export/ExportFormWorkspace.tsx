import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { CollapsibleSectionCard } from "../../../components/CollapsibleSectionCard";
import { ConfigurableRecordTable, type ConfigurableRecord } from "../../../components/ConfigurableRecordTable";
import { DynamicFormField } from "../../../components/DynamicFormField";
import { SectionStatusIconBadge, SectionStatusTextBadge, type SectionStatus as ExportSectionStatus } from "../../../components/SectionStatusIconBadge";
import { Toast, inferToastTone } from "../../../components/Toast";
import { DemoFormSelector, FormDocumentHeader, FormStepFooterActions, FormStepper, SmartDraftBanner, type FormStepStatus } from "../../../components/FormWorkspaceShell";
import { ExportConfigurationDrawer } from "../../../form-config/export/ExportConfigurationDrawer";
import { cloneExportConfig, createExportFormCatalog, initialExportConfigFile, readExportConfigDraft, resolveExportSteps, type ResolvedExportField, type ResolvedExportSection, type ResolvedExportStep } from "../../../form-config/export/export-config";
import { FORM_CONFIG_ACCESS_EVENT, hasIntranetConfiguratorSession, isLocalConfiguratorHost } from "../../../form-config/shared/configurator-access";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CheckReadIcon,
  DocumentsIcon,
  HamburgerMenuIcon,
  PlainIcon,
  PencilIcon,
  TruckIcon,
  UserIcon,
} from "../../../components/Icons";
import exportMappingJson from "../../../form-config/export/export-source-mapping.json";
import type {
  ExportDocumentId,
  ExportSourceMappingFile,
  ExportStepId,
} from "../../../form-config/export/export-mapping-types";
import type { FormDomain } from "../../../form-config/shared/types";
import { loadPublishedFormConfig } from "../../../form-config/shared/config-provider";
import { assertValidFormOverrides } from "../../../form-config/shared/validation";
import { ExportBarangWorkspace } from "./ExportBarangWorkspace";

type ExportDocumentSelection = ExportDocumentId | "EXP_ALL";
type ExportActiveStepId = ExportStepId | "review";

type StoredExportDraft = {
  documentId: ExportDocumentSelection;
  requiresQuarantine: boolean;
  usesConsolidation?: boolean;
  singleValues: Record<string, string>;
  repeatableRows: Record<string, ConfigurableRecord[]>;
  values?: Record<string, string>;
};

const repositoryExportMapping = exportMappingJson as unknown as ExportSourceMappingFile;
const EXPORT_DRAFT_STORAGE_KEY = "insw-export-form-draft-v1";

const stepMeta: Record<ExportActiveStepId, { description: string; icon: (props: { className?: string }) => ReactNode }> = {
  pengajuan: { description: "Header, pengangkutan, nilai, pelabuhan, dan penanggung jawab.", icon: BriefcaseIcon },
  entitas: { description: "Eksportir, penerima, pembeli, pemilik barang, dan PPJK.", icon: UserIcon },
  dokumen: { description: "Dokumen pelengkap yang mendukung pengajuan ekspor.", icon: DocumentsIcon },
  kemasan: { description: "Data kemasan dan kontainer pengiriman.", icon: TruckIcon },
  barang: { description: "Barang, tarif, cukai, dan bahan asal atau komponen.", icon: HamburgerMenuIcon },
  karantina: { description: "Karantina, detail mutu, barang karantina, dan kesiapan PKB.", icon: CheckReadIcon },
  surveyor: { description: "Pemberitahuan, NTPN, entitas, komoditi, dan transportasi surveyor.", icon: BuildingsIcon },
  review: { description: "Pemeriksaan akhir kelengkapan form ekspor.", icon: CheckReadIcon },
};

type ExportSectionIcon = (props: { className?: string }) => ReactNode;

const exportSectionIcons: Record<string, ExportSectionIcon> = {
  "header-pengajuan": BriefcaseIcon,
  pengangkutan: TruckIcon,
  "nilai-pabean-pungutan": PlainIcon,
  "pelabuhan-tempat-timbun": PlainIcon,
  "penanggung-jawab": UserIcon,
  "bank-devisa": BriefcaseIcon,
  "eksportir-pengirim-pengusaha": BuildingsIcon,
  penerima: UserIcon,
  pembeli: UserIcon,
  "pihak-konsolidasi": BriefcaseIcon,
  "pemilik-barang": BuildingsIcon,
  ppjk: BriefcaseIcon,
  "dokumen-pelengkap": DocumentsIcon,
  kemasan: TruckIcon,
  kontainer: TruckIcon,
  "barang-info": HamburgerMenuIcon,
  "barang-satuan-kemasan": TruckIcon,
  "barang-spesifikasi": PlainIcon,
  "barang-dokumen": DocumentsIcon,
  "barang-tarif": PlainIcon,
  "barang-cukai": PlainIcon,
  "barang-bahan-asal": HamburgerMenuIcon,
  "barang-bahan-asal-dokumen": DocumentsIcon,
  "barang-bahan-asal-tarif": PlainIcon,
  "barang-bahan-asal-cukai": PlainIcon,
  "karantina-header": CheckReadIcon,
  "karantina-detail-mutu": CheckReadIcon,
  "karantina-barang": HamburgerMenuIcon,
  "karantina-pkb": CheckReadIcon,
  "surveyor-pemberitahuan-umum": BuildingsIcon,
  "surveyor-ntpn": PlainIcon,
  "surveyor-komoditi-ntpn": HamburgerMenuIcon,
  "surveyor-entitas": UserIcon,
  "surveyor-transportasi": TruckIcon,
  "surveyor-pelabuhan": PlainIcon,
  "surveyor-asuransi": BriefcaseIcon,
  "surveyor-dokumen": DocumentsIcon,
};

const getExportSectionIcon = (stepId: ExportStepId, sectionId: string) => exportSectionIcons[sectionId] ?? stepMeta[stepId].icon;

const sectionTone = "rounded-2xl border border-border-primary bg-white shadow-sm";

function readStoredDraft(): StoredExportDraft | null {
  try {
    const raw = window.sessionStorage.getItem(EXPORT_DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredExportDraft) : null;
  } catch {
    return null;
  }
}

function isFieldFilled(field: ResolvedExportField, value: string | undefined) {
  if (!field.required) return true;
  if (field.readOnly) return true;
  return Boolean(value?.trim());
}

export function ExportFormWorkspace({ onDomainChange }: { onDomainChange: (domain: FormDomain) => void }) {
  const localConfiguratorEnabled = isLocalConfiguratorHost();
  const [intranetConfiguratorEnabled, setIntranetConfiguratorEnabled] = useState(false);
  const configuratorEnabled = localConfiguratorEnabled || intranetConfiguratorEnabled;
  const [localConfigDraft] = useState(() => readExportConfigDraft());
  const [exportConfig, setExportConfig] = useState(() => localConfigDraft ?? cloneExportConfig(initialExportConfigFile));
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const storedDraft = useMemo(() => readStoredDraft(), []);
  const [documentId, setDocumentId] = useState<ExportDocumentSelection>(storedDraft?.documentId ?? "EXP_BC30");
  const [requiresQuarantine, setRequiresQuarantine] = useState(storedDraft?.requiresQuarantine ?? false);
  const [usesConsolidation, setUsesConsolidation] = useState(storedDraft?.usesConsolidation ?? false);
  const [singleValues, setSingleValues] = useState<Record<string, string>>(() => {
    const values = storedDraft?.singleValues ?? storedDraft?.values ?? {};
    return storedDraft?.usesConsolidation
      ? values
      : Object.fromEntries(Object.entries(values).filter(([key]) => !key.startsWith("pihak-konsolidasi.")));
  });
  const [repeatableRows, setRepeatableRows] = useState<Record<string, ConfigurableRecord[]>>(() => {
    const rows = storedDraft?.repeatableRows ?? {};
    return {
      ...rows,
      "pemilik-barang": (rows["pemilik-barang"] ?? []).map((row, index) => ({ ...row, seri: String(index + 1) })),
    };
  });
  const [activeStep, setActiveStep] = useState<ExportActiveStepId>("pengajuan");
  const [isTocExpanded, setIsTocExpanded] = useState(true);
  const [activeTocSectionId, setActiveTocSectionId] = useState("");
  const tocScrollFrameRef = useRef<number | null>(null);
  const [statusMessage, setStatusMessage] = useState(storedDraft ? "Draft ekspor terakhir berhasil dimuat." : "");
  const [statusToastVisible, setStatusToastVisible] = useState(Boolean(storedDraft));

  useEffect(() => {
    if (statusMessage) setStatusToastVisible(true);
  }, [statusMessage]);

  useEffect(() => {
    if (localConfiguratorEnabled) return;
    let active = true;
    const refreshAccess = () => { void hasIntranetConfiguratorSession().then((unlocked) => { if (active) setIntranetConfiguratorEnabled(unlocked); }); };
    refreshAccess();
    window.addEventListener(FORM_CONFIG_ACCESS_EVENT, refreshAccess);
    return () => { active = false; window.removeEventListener(FORM_CONFIG_ACCESS_EVENT, refreshAccess); };
  }, [localConfiguratorEnabled]);

  useEffect(() => {
    if (localConfigDraft) {
      setStatusMessage("Draft konfigurasi Ekspor dari browser sedang digunakan.");
      return;
    }
    let active = true;
    void loadPublishedFormConfig("EXPORT", initialExportConfigFile).then((result) => {
      if (!active) return;
      assertValidFormOverrides(result.config, createExportFormCatalog(repositoryExportMapping));
      setExportConfig(result.config);
      if (result.source === "remote") setStatusMessage(`Konfigurasi Ekspor revision ${result.revision} berhasil dimuat.`);
      else if (result.source === "cache") setStatusMessage(`Konfigurasi Ekspor cache revision ${result.revision} digunakan karena endpoint tidak tersedia.`);
      else setStatusMessage("Konfigurasi Ekspor repository digunakan sebagai fallback.");
    }).catch((error) => {
      if (active) setStatusMessage(error instanceof Error ? error.message : "Konfigurasi Ekspor gagal dimuat.");
    });
    return () => { active = false; };
  }, [localConfigDraft]);

  const selectedDocument = repositoryExportMapping.documents.find((document) => document.id === documentId);
  const selectedDocumentConfig = exportConfig.documents.find((document) => document.id === documentId);
  const activeDocumentLabel = documentId === "EXP_ALL" ? "Semua Elemen Ekspor" : selectedDocumentConfig?.label ?? selectedDocument?.label ?? "BC 3.0";
  const supportsQuarantine = documentId === "EXP_ALL" || documentId === "EXP_BC30";

  const resolvedSteps = useMemo<ResolvedExportStep[]>(
    () => resolveExportSteps(repositoryExportMapping, exportConfig, documentId, requiresQuarantine),
    [documentId, exportConfig, requiresQuarantine],
  );

  const visibleStepIds = useMemo<ExportActiveStepId[]>(
    () => [...resolvedSteps.map((step) => step.id), "review"],
    [resolvedSteps],
  );

  useEffect(() => {
    if (visibleStepIds.includes(activeStep)) return;
    setActiveStep(visibleStepIds[0] ?? "review");
  }, [activeStep, visibleStepIds]);

  const stepComplete = useMemo(
    () =>
      Object.fromEntries(
        resolvedSteps.map((step) => [
          step.id,
          step.sections.every((section) =>
            section.id === "pihak-konsolidasi" && !usesConsolidation
              ? true
              : section.repeatable
              ? (repeatableRows[section.id]?.length ?? 0) > 0 &&
                (repeatableRows[section.id] ?? []).every((row) =>
                  (!section.relation || Boolean(row[section.relation.foreignKey]?.trim())) &&
                  section.fields.every((field) => isFieldFilled(field, row[field.id])),
                )
              : section.fields.every((field) => isFieldFilled(field, singleValues[field.dataKey])),
          ),
        ]),
      ) as Partial<Record<ExportStepId, boolean>>,
    [repeatableRows, resolvedSteps, singleValues, usesConsolidation],
  );

  const reviewComplete = resolvedSteps.every((step) => stepComplete[step.id]);
  const activeResolvedStep = resolvedSteps.find((step) => step.id === activeStep);

  useEffect(() => {
    const sections = activeResolvedStep?.sections ?? [];
    if (!sections.length) {
      setActiveTocSectionId("");
      return;
    }
    setActiveTocSectionId(sections[0].id);

    const syncActiveSection = () => {
      if (tocScrollFrameRef.current !== null) return;
      tocScrollFrameRef.current = window.requestAnimationFrame(() => {
        tocScrollFrameRef.current = null;
        const anchor = Math.max(150, window.innerHeight * 0.22);
        const elements = sections
          .map((section) => ({ id: section.id, element: document.getElementById(`export-${section.id}`) }))
          .filter((item): item is { id: string; element: HTMLElement } => Boolean(item.element));
        if (!elements.length) return;
        let candidate = elements[0];
        elements.forEach((item) => { if (item.element.getBoundingClientRect().top <= anchor) candidate = item; });
        setActiveTocSectionId((current) => current === candidate.id ? current : candidate.id);
      });
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      if (tocScrollFrameRef.current !== null) window.cancelAnimationFrame(tocScrollFrameRef.current);
      tocScrollFrameRef.current = null;
    };
  }, [activeResolvedStep]);

  const scrollToExportSection = (sectionId: string) => {
    setActiveTocSectionId(sectionId);
    document.getElementById(`export-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const activeIndex = visibleStepIds.indexOf(activeStep);
  const exportStepStarted = Object.fromEntries(resolvedSteps.map((step) => [
    step.id,
    step.sections.some((section) => section.repeatable
      ? (repeatableRows[section.id] ?? []).some((row) => Object.values(row).some((value) => String(value ?? "").trim()))
      : section.fields.some((field) => Boolean(singleValues[field.dataKey]?.trim()))),
  ])) as Partial<Record<ExportStepId, boolean>>;
  const exportStepStatus = (stepId: ExportActiveStepId): FormStepStatus => {
    const complete = stepId === "review" ? reviewComplete : Boolean(stepComplete[stepId]);
    if (complete) return "success";
    const started = stepId === "review" ? Object.values(exportStepStarted).some(Boolean) : Boolean(exportStepStarted[stepId]);
    return started ? "error" : "warning";
  };
  const totalVisibleFields = resolvedSteps.reduce(
    (total, step) => total + step.sections.reduce((sectionTotal, section) => sectionTotal + (section.id === "pihak-konsolidasi" && !usesConsolidation ? 0 : section.fields.length), 0),
    0,
  );
  const filledRequiredFields = resolvedSteps.reduce(
    (total, step) =>
      total +
      step.sections.reduce(
        (sectionTotal, section) => {
          if (section.id === "pihak-konsolidasi" && !usesConsolidation) return sectionTotal;
          if (section.repeatable) {
            return sectionTotal + (repeatableRows[section.id] ?? []).reduce(
              (rowTotal, row) =>
                rowTotal +
                section.fields.filter((field) => field.required && (field.readOnly || row[field.id]?.trim())).length +
                (section.relation && row[section.relation.foreignKey]?.trim() ? 1 : 0),
              0,
            );
          }
          return sectionTotal + section.fields.filter((field) => field.required && (field.readOnly || singleValues[field.dataKey]?.trim())).length;
        },
        0,
      ),
    0,
  );
  const requiredFieldCount = resolvedSteps.reduce(
    (total, step) =>
      total + step.sections.reduce((sectionTotal, section) => {
        if (section.id === "pihak-konsolidasi" && !usesConsolidation) return sectionTotal;
        const requiredPerRecord = section.fields.filter((field) => field.required).length + (section.relation ? 1 : 0);
        return sectionTotal + requiredPerRecord * (section.repeatable ? Math.max(1, repeatableRows[section.id]?.length ?? 0) : 1);
      }, 0),
    0,
  );

  const getSectionStatus = (section: ResolvedExportSection): ExportSectionStatus => {
    if (section.id === "pihak-konsolidasi" && !usesConsolidation) {
      return { label: "Tidak Digunakan", tone: "secondary", detail: "Skenario konsolidasi tidak diaktifkan pada pengajuan ini." };
    }

    if (section.repeatable) {
      const rows = repeatableRows[section.id] ?? [];
      if (rows.length === 0) {
        return { label: "Belum Diisi", tone: "warning", detail: "Belum ada record pada section ini." };
      }
      const missingMandatory = rows.some((row) =>
        (section.relation && !row[section.relation.foreignKey]?.trim()) ||
        section.fields.some((field) => field.required && !field.readOnly && !row[field.id]?.trim()),
      );
      if (missingMandatory) {
        return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
      }
      const allFieldsFilled = rows.every((row) => section.fields.every((field) => field.readOnly || Boolean(row[field.id]?.trim())));
      return allFieldsFilled
        ? { label: "Lengkap", tone: "success", detail: "Seluruh field pada section ini sudah terisi." }
        : { label: "Belum Lengkap", tone: "warning", detail: "Field mandatory sudah terisi, tetapi masih ada informasi opsional yang kosong." };
    }

    const hasAnyValue = section.fields.some((field) => Boolean(singleValues[field.dataKey]?.trim()));
    if (!hasAnyValue) {
      return { label: "Belum Diisi", tone: "warning", detail: "Section ini belum mulai diisi." };
    }
    const missingMandatory = section.fields.some((field) => field.required && !field.readOnly && !singleValues[field.dataKey]?.trim());
    if (missingMandatory) {
      return { label: "Wajib Dilengkapi", tone: "error", detail: "Masih ada field mandatory yang belum diisi." };
    }
    const allFieldsFilled = section.fields.every((field) => field.readOnly || Boolean(singleValues[field.dataKey]?.trim()));
    return allFieldsFilled
      ? { label: "Lengkap", tone: "success", detail: "Seluruh field pada section ini sudah terisi." }
      : { label: "Belum Lengkap", tone: "warning", detail: "Field mandatory sudah terisi, tetapi masih ada informasi opsional yang kosong." };
  };

  const updateValue = (dataKey: string, value: string) => {
    setSingleValues((current) => ({ ...current, [dataKey]: value }));
  };

  const updateRepeatableSection = (sectionId: string, rows: ConfigurableRecord[]) => {
    setRepeatableRows((current) => {
      const normalizedRows = rows.map((row, index) => {
        const normalized = row._recordId
          ? row
          : { ...row, _recordId: globalThis.crypto?.randomUUID?.() ?? `${sectionId}-${Date.now()}-${index}` };
        return sectionId === "pemilik-barang" ? { ...normalized, seri: String(index + 1) } : normalized;
      });
      const next = { ...current, [sectionId]: normalizedRows };
      const validRecordIds = new Set(normalizedRows.map((row) => row._recordId));

      repositoryExportMapping.steps.flatMap((step) => step.sections).forEach((childSection) => {
        if (childSection.relation?.parentSectionId !== sectionId) return;
        const foreignKey = childSection.relation.foreignKey;
        next[childSection.id] = (next[childSection.id] ?? []).map((row) =>
          row[foreignKey] && !validRecordIds.has(row[foreignKey]) ? { ...row, [foreignKey]: "" } : row,
        );
      });
      return next;
    });
  };

  const changeConsolidation = (checked: boolean) => {
    setUsesConsolidation(checked);
    if (checked) return;
    setSingleValues((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("pihak-konsolidasi."))));
    setStatusMessage("Data Pihak Konsolidasi dikosongkan karena skenario konsolidasi dinonaktifkan.");
  };

  const copyExporterToOwner = (section: ResolvedExportSection) => {
    const exporterPrefix = "eksportir-pengirim-pengusaha.";
    const copyableFieldIds = new Set(["nomorIdentitas", "nitku", "nama", "alamat"]);
    const requiredSourceFields = section.fields.filter((field) => field.required && field.id !== "seri" && copyableFieldIds.has(field.id));
    const missing = requiredSourceFields.filter((field) => !singleValues[`${exporterPrefix}${field.id}`]?.trim());
    if (missing.length > 0) {
      setStatusMessage(`Lengkapi Data Eksportir terlebih dahulu: ${missing.map((field) => field.displayLabel).join(", ")}.`);
      return;
    }

    const currentRows = repeatableRows[section.id] ?? [];
    const copiedRow: ConfigurableRecord = {
      _recordId: globalThis.crypto?.randomUUID?.() ?? `pemilik-${Date.now()}`,
      ...Object.fromEntries(section.fields.map((field) => [
        field.id,
        field.id === "seri"
          ? String(currentRows.length + 1)
          : copyableFieldIds.has(field.id)
            ? singleValues[`${exporterPrefix}${field.id}`] ?? ""
            : "",
      ])),
    };
    updateRepeatableSection(section.id, [...currentRows, copiedRow]);
    setStatusMessage("Data Eksportir berhasil disalin sebagai record Pemilik Barang baru.");
  };

  const saveDraft = () => {
    const snapshot: StoredExportDraft = { documentId, requiresQuarantine, usesConsolidation, singleValues, repeatableRows };
    window.sessionStorage.setItem(EXPORT_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
    setStatusMessage("Draft ekspor disimpan lokal di browser.");
  };

  const changeDocument = (nextDocumentId: string) => {
    const next = nextDocumentId as ExportDocumentSelection;
    setDocumentId(next);
    setRequiresQuarantine(next === "EXP_ALL");
    setActiveStep("pengajuan");
    setStatusMessage(`Form ${next === "EXP_ALL" ? "Semua Elemen Ekspor" : exportConfig.documents.find((item) => item.id === next)?.label ?? repositoryExportMapping.documents.find((item) => item.id === next)?.label ?? next} dimuat.`);
  };

  const navigateRelative = (delta: number) => {
    const nextIndex = Math.min(visibleStepIds.length - 1, Math.max(0, activeIndex + delta));
    setActiveStep(visibleStepIds[nextIndex] ?? activeStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkActiveStepCompleteness = () => {
    const complete = activeStep === "review" ? reviewComplete : Boolean(stepComplete[activeStep]);
    const label = activeStep === "review" ? "Review & Submit" : activeResolvedStep?.label ?? activeStep;
    setStatusMessage(complete ? `${label} sudah lengkap.` : `${label} masih memiliki field mandatory yang perlu dilengkapi.`);
  };

  const renderSectionBody = (section: ResolvedExportSection) => {
    const relationOptions = section.relation
      ? (repeatableRows[section.relation.parentSectionId] ?? []).map((row, index) => ({
          value: row._recordId ?? `${section.relation?.parentSectionId}-${index}`,
          label: row.seri || row.kodeBarang || row.uraian || row.nomorDokumen || `Record ${index + 1}`,
        }))
      : [];
    const relationField = section.relation
      ? [{ id: section.relation.foreignKey, label: section.relation.label, inputType: "select" as const, required: true, options: relationOptions }]
      : [];

    if (section.repeatable) {
      return (
        <ConfigurableRecordTable
          title={section.label}
          fields={[
            ...relationField,
            ...section.fields.map((field) => ({
              id: field.id,
              label: field.displayLabel,
              inputType: field.inputType,
              readOnly: field.readOnly || (section.id === "pemilik-barang" && field.id === "seri"),
              required: field.required,
              options: field.options,
              helperText: field.helperText,
            })),
          ]}
          rows={repeatableRows[section.id] ?? []}
          onChange={(rows) => updateRepeatableSection(section.id, rows)}
          onMessage={setStatusMessage}
          headerActions={section.id === "pemilik-barang" ? <Button variant="outline" size="sm" onClick={() => copyExporterToOwner(section)}>Salin dari Data Eksportir</Button> : undefined}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.fields.map((field) => (
          <DynamicFormField
            key={field.dataKey}
            field={{ id: field.id, label: field.displayLabel, inputType: field.inputType, readOnly: field.readOnly, required: field.required, options: field.options, helperText: field.helperText }}
            value={singleValues[field.dataKey] ?? ""}
            onChange={(value) => updateValue(field.dataKey, value)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-3 py-4 sm:px-4 sm:py-5">
      <Toast
        open={statusToastVisible && Boolean(statusMessage)}
        message={statusMessage}
        tone={inferToastTone(statusMessage)}
        onClose={() => setStatusToastVisible(false)}
      />
      <SmartDraftBanner />

      <DemoFormSelector
        domain="EXPORT"
        onDomainChange={onDomainChange}
        documentId={documentId}
        onDocumentChange={changeDocument}
        documentOptions={[{ label: "Semua Elemen Ekspor", value: "EXP_ALL" }, ...exportConfig.documents.filter((document) => !document.archived).map((document) => ({ label: document.label, value: document.id }))]}
        requiresQuarantine={requiresQuarantine}
        onRequiresQuarantineChange={setRequiresQuarantine}
        quarantineDisabled={!supportsQuarantine || documentId === "EXP_ALL"}
        technicalBadges={["Domain: Ekspor", `${resolvedSteps.length} step`, `${totalVisibleFields} field aktif`, `Mapping Workbook v${repositoryExportMapping.version}`]}
      />

      <section className={`${sectionTone} p-4 pb-6 sm:p-5 sm:pb-7`}>
        <FormDocumentHeader
          eyebrow="Form Ekspor"
          title={`Form Pengajuan ${activeDocumentLabel}`}
          description={selectedDocument?.description ?? (documentId === "EXP_ALL" ? "Form demonstrasi yang menampilkan seluruh elemen pemberitahuan ekspor untuk kebutuhan peninjauan mockup." : `Form ${activeDocumentLabel} digunakan untuk melengkapi data pemberitahuan ekspor barang.`)}
        />

        <FormStepper
          items={visibleStepIds.map((stepId) => ({
            id: stepId,
            label: stepId === "review" ? "Review & Submit" : resolvedSteps.find((step) => step.id === stepId)?.label ?? stepId,
            description: stepMeta[stepId].description,
            icon: stepMeta[stepId].icon,
            status: exportStepStatus(stepId),
          }))}
          activeId={activeStep}
          onChange={(stepId) => setActiveStep(stepId as ExportActiveStepId)}
        />

        <div className="my-5 border-t border-border-primary" />

        {activeResolvedStep?.id === "barang" && activeResolvedStep.sections.find((section) => section.id === "barang-info") ? (
          <div className={`grid gap-4 ${isTocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]"}`}>
            <aside className="lg:sticky lg:top-[calc(var(--shell-sticky-top)+12px)] lg:self-start">
              <div className={`${sectionTone} ${isTocExpanded ? "p-4" : "p-2"}`}>
                <div className={`flex items-start gap-3 ${isTocExpanded ? "justify-between" : "justify-center"}`}>
                  {isTocExpanded ? <div className="min-w-0"><div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div><p className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section barang yang ingin ditinjau.</p></div> : <span className="sr-only">Table of Content</span>}
                  <button type="button" onClick={() => setIsTocExpanded((current) => !current)} aria-expanded={isTocExpanded} aria-label={isTocExpanded ? "Ciutkan TOC barang ekspor" : "Buka TOC barang ekspor"} title={isTocExpanded ? "Ciutkan TOC" : "Buka TOC"} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50">
                    {isTocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => scrollToExportSection("barang-info")} title={!isTocExpanded ? "Tabel Informasi Barang" : undefined} className={`relative mt-4 flex w-full items-start rounded-xl border border-brand-primary-500 bg-brand-primary-50 text-left shadow-sm ${isTocExpanded ? "gap-3 px-3 py-3" : "justify-center px-2 py-3"}`}>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary-500 text-white"><HamburgerMenuIcon className="h-4.5 w-4.5" /></span>
                  {isTocExpanded ? <span className="min-w-0 pr-7"><span className="block text-[12px] font-semibold text-neutral-800">Tabel Informasi Barang</span><span className="mt-1 block text-[11px] leading-5 text-neutral-600">{activeResolvedStep.sections.find((section) => section.id === "barang-info")!.description}</span></span> : null}
                  <span className={isTocExpanded ? "absolute right-2.5 top-2.5" : "absolute -right-1 -top-1"}><SectionStatusIconBadge status={getSectionStatus(activeResolvedStep.sections.find((section) => section.id === "barang-info")!)} /></span>
                </button>
              </div>
            </aside>
            <ExportBarangWorkspace
              barangSection={activeResolvedStep.sections.find((section) => section.id === "barang-info")!}
              childSections={activeResolvedStep.sections.filter((section) => section.id !== "barang-info")}
              rowsBySection={repeatableRows}
              onChangeSection={updateRepeatableSection}
              onMessage={setStatusMessage}
            />
          </div>
        ) : activeResolvedStep && ["dokumen", "kemasan"].includes(activeResolvedStep.id) ? (
          <div className="space-y-4">
            {activeResolvedStep.sections.map((section) => (
              (() => {
                const SectionIcon = getExportSectionIcon(activeResolvedStep.id, section.id);
                const sectionStatus = getSectionStatus(section);
                return (
                  <CollapsibleSectionCard
                    key={section.id}
                    title={section.label}
                    subtitle={section.description}
                    leadingIcon={<SectionIcon className="h-5 w-5" />}
                    headerActions={<SectionStatusTextBadge status={sectionStatus} />}
                  >
                    {renderSectionBody(section)}
                  </CollapsibleSectionCard>
                );
              })()
            ))}
          </div>
        ) : activeResolvedStep ? (
          <div className={`grid gap-4 ${isTocExpanded ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[84px_minmax(0,1fr)]"}`}>
            <aside className="lg:sticky lg:top-[calc(var(--shell-sticky-top)+12px)] lg:self-start">
              <div className={`${sectionTone} ${isTocExpanded ? "p-4" : "p-2"}`}>
                <div className={`flex items-start gap-3 ${isTocExpanded ? "justify-between" : "justify-center"}`}>
                  {isTocExpanded ? <div className="min-w-0"><div className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">Table of Content</div><p className="mt-1 text-[12px] leading-5 text-neutral-600">Lompat ke section yang ingin ditinjau.</p></div> : <span className="sr-only">Table of Content</span>}
                  <button type="button" onClick={() => setIsTocExpanded((current) => !current)} aria-expanded={isTocExpanded} aria-label={isTocExpanded ? "Ciutkan TOC ekspor" : "Buka TOC ekspor"} title={isTocExpanded ? "Ciutkan TOC" : "Buka TOC"} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-primary bg-white text-brand-primary-700 transition hover:border-brand-primary-200 hover:bg-brand-primary-50">
                    {isTocExpanded ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
                <div className={`flex flex-col gap-2 ${isTocExpanded ? "mt-4" : "mt-3"}`}>
                  {activeResolvedStep.sections.map((section) => {
                    const SectionIcon = getExportSectionIcon(activeResolvedStep.id, section.id);
                    const sectionStatus = getSectionStatus(section);
                    const active = activeTocSectionId === section.id;
                    return (
                      <button key={section.id} type="button" title={!isTocExpanded ? section.label : undefined} aria-label={section.label} onClick={() => scrollToExportSection(section.id)} className={`relative flex w-full items-start rounded-xl border text-left transition ${active ? "border-brand-primary-500 bg-brand-primary-50 shadow-sm" : "border-border-primary bg-white hover:border-brand-primary-200 hover:bg-brand-primary-50/40"} ${isTocExpanded ? "gap-3 px-3 py-3" : "justify-center px-2 py-3"}`}>
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-brand-primary-500 text-white" : "bg-background-primary text-brand-primary-600"}`}><SectionIcon className="h-4.5 w-4.5" /></span>
                        {isTocExpanded ? <span className="min-w-0 flex-1 pr-7"><span className="block text-[12px] font-semibold text-neutral-800">{section.label}</span><span className="mt-1 block text-[11px] leading-5 text-neutral-600">{section.description}</span></span> : null}
                        <span className={isTocExpanded ? "absolute right-2.5 top-2.5" : "absolute -right-1 -top-1"}><SectionStatusIconBadge status={sectionStatus} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
            <div className="min-w-0 space-y-4">
              {activeResolvedStep.sections.map((section) => (
                <div key={section.id} id={`export-${section.id}`} className="scroll-mt-[calc(var(--shell-sticky-top)+24px)]">
                  {section.id === "pihak-konsolidasi" ? (
                    <CollapsibleSectionCard
                      title={section.label}
                      subtitle={section.description}
                      leadingIcon={(() => { const SectionIcon = getExportSectionIcon(activeResolvedStep.id, section.id); return <SectionIcon className="h-5 w-5" />; })()}
                      headerActions={
                        <SectionStatusTextBadge status={getSectionStatus(section)} />
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-background-primary/25 px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-600">Menggunakan Pihak Konsolidasi</div>
                            <div className="mt-1 text-[12px] leading-5 text-neutral-600">{usesConsolidation ? "Section aktif dan siap diisi." : "Pihak konsolidasi belum diaktifkan pada pengajuan ini."}</div>
                          </div>
                          <label className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 shadow-sm transition-colors hover:border-brand-primary-200 hover:bg-brand-primary-50/40">
                            <input type="checkbox" checked={usesConsolidation} onChange={(event) => changeConsolidation(event.target.checked)} className="h-4 w-4 rounded border-border-primary text-brand-primary-600 focus:ring-brand-primary-100" />
                            <span className="whitespace-nowrap">Menggunakan Konsolidasi</span>
                          </label>
                        </div>
                        {!usesConsolidation ? (
                          <div className="rounded-xl border border-dashed border-border-primary bg-background-primary/20 px-4 py-4 text-[12px] leading-6 text-neutral-600">Pihak konsolidasi belum diaktifkan pada pengajuan ini.</div>
                        ) : renderSectionBody(section)}
                      </div>
                    </CollapsibleSectionCard>
                  ) : (
                    <CollapsibleSectionCard title={section.label} subtitle={section.description} leadingIcon={(() => { const SectionIcon = getExportSectionIcon(activeResolvedStep.id, section.id); return <SectionIcon className="h-5 w-5" />; })()} headerActions={<SectionStatusTextBadge status={getSectionStatus(section)} />}>
                      {renderSectionBody(section)}
                    </CollapsibleSectionCard>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === "review" ? (
          <div className="space-y-4">
            <section className={`${sectionTone} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary-600">Review Ekspor</div>
                  <h2 className="mt-1 text-[20px] font-semibold text-neutral-900">Kelengkapan {activeDocumentLabel}</h2>
                  <p className="mt-2 text-[12px] text-neutral-600">Status dihitung dari field mandatory pada mapping workbook.</p>
                </div>
                <Badge variant={reviewComplete ? "success" : "warning"}>{reviewComplete ? "Siap submit" : "Belum lengkap"}</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border-primary bg-background-primary/20 p-4">
                  <div className="text-[11px] text-neutral-500">Total field aktif</div>
                  <div className="mt-1 text-[24px] font-semibold text-neutral-900">{totalVisibleFields}</div>
                </div>
                <div className="rounded-xl border border-border-primary bg-background-primary/20 p-4">
                  <div className="text-[11px] text-neutral-500">Mandatory terisi</div>
                  <div className="mt-1 text-[24px] font-semibold text-neutral-900">{filledRequiredFields}/{requiredFieldCount}</div>
                </div>
                <div className="rounded-xl border border-border-primary bg-background-primary/20 p-4">
                  <div className="text-[11px] text-neutral-500">Step lengkap</div>
                  <div className="mt-1 text-[24px] font-semibold text-neutral-900">{resolvedSteps.filter((step) => stepComplete[step.id]).length}/{resolvedSteps.length}</div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {resolvedSteps.map((step) => {
                  const complete = Boolean(stepComplete[step.id]);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className="rounded-xl border border-border-primary bg-white p-4 text-left transition hover:border-brand-primary-200 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-semibold text-neutral-800">{step.label}</span>
                        <Badge variant={complete ? "success" : "warning"}>{complete ? "Lengkap" : "Belum Lengkap"}</Badge>
                      </div>
                      <div className="mt-2 text-[11px] text-neutral-500">{step.sections.reduce((total, section) => total + section.fields.length, 0)} field aktif</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        <FormStepFooterActions
          stepLabel={activeStep === "review" ? "Review" : activeResolvedStep?.label ?? activeStep}
          showPrevious={activeIndex > 0}
          onPrevious={activeIndex > 0 ? () => navigateRelative(-1) : undefined}
          onCheck={checkActiveStepCompleteness}
          onSaveDraft={saveDraft}
          saveDraftLabel={activeStep === "review" ? "Simpan Keseluruhan Draft" : undefined}
          primaryLabel={activeStep === "review" ? "Submit Pengajuan" : "Selanjutnya"}
          submit={activeStep === "review"}
          onNext={activeStep === "review" ? () => {
            saveDraft();
            setStatusMessage(reviewComplete ? "Pengajuan ekspor mock berhasil disubmit." : "Submit mock disimpan, tetapi masih ada field mandatory yang belum lengkap.");
          } : () => navigateRelative(1)}
        />
      </section>

      {configuratorEnabled ? (
        <>
          <button type="button" onClick={() => setConfiguratorOpen(true)} aria-label="Buka Konfigurasi Form Ekspor" aria-expanded={configuratorOpen} className="fixed right-0 top-1/2 z-40 flex h-44 w-11 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-brand-primary-600 bg-brand-primary-600 text-white shadow-lg transition-colors hover:bg-brand-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-200">
            <span className="flex -rotate-90 items-center gap-2 whitespace-nowrap text-[12px] font-semibold tracking-wide"><PencilIcon className="h-4 w-4" />Konfigurasi Form</span>
          </button>
          <ExportConfigurationDrawer
            open={configuratorOpen}
            configFile={exportConfig}
            sourceMapping={repositoryExportMapping}
            documentId={documentId === "EXP_ALL" ? "EXP_BC30" : documentId}
            onDocumentChange={(next) => changeDocument(next)}
            onChange={setExportConfig}
            onClose={() => setConfiguratorOpen(false)}
            onMessage={setStatusMessage}
            allowLocalDraft={localConfiguratorEnabled}
          />
        </>
      ) : null}
    </div>
  );
}
