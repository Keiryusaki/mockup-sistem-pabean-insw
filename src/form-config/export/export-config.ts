import exportConfigJson from "./export-document-configs.json";
import type { ExportSourceField, ExportSourceMappingFile, ExportSourceSection, ExportStepId } from "./export-mapping-types";
import { FORM_CONFIG_SESSION_KEY } from "../shared/configurator-access";
import { getDocumentConfig, resolveDocumentSteps } from "../shared/resolver";
import type { DocumentConfigFile, FormStepCatalogItem } from "../shared/types";

export const EXPORT_CONFIG_DRAFT_KEY = "insw-export-form-config-draft-v2";
export const initialExportConfigFile = exportConfigJson as DocumentConfigFile;

export type ResolvedExportField = ExportSourceField & { displayLabel: string; helperText?: string };
export type ResolvedExportSection = Omit<ExportSourceSection, "fields"> & { fields: ResolvedExportField[] };
export type ResolvedExportStep = {
  id: ExportStepId;
  label: string;
  condition?: "requiresQuarantine";
  sections: ResolvedExportSection[];
};

export function cloneExportConfig(config: DocumentConfigFile): DocumentConfigFile {
  return JSON.parse(JSON.stringify(config)) as DocumentConfigFile;
}

export function createExportFormCatalog(mapping: ExportSourceMappingFile): FormStepCatalogItem[] {
  return mapping.steps.map((step) => ({
    id: step.id,
    label: step.label,
    description: step.label,
    sections: step.sections.map((section) => ({
      id: section.id,
      label: section.label,
      description: section.description,
      fields: section.fields.map((field) => ({
        // dataKey adalah identitas stabil override; label dan nomor baris boleh berubah saat workbook digenerasi ulang.
        id: field.dataKey,
        label: field.label,
        required: field.required,
        inputType: field.inputType,
        readOnly: field.readOnly,
        options: field.options,
        documentTypes: field.documents,
        documentOverrides: field.documentOverrides,
      })),
    })),
  }));
}

export function readExportConfigDraft(): DocumentConfigFile | null {
  try {
    const raw = window.localStorage.getItem(EXPORT_CONFIG_DRAFT_KEY);
    return raw ? JSON.parse(raw) as DocumentConfigFile : null;
  } catch {
    return null;
  }
}

export function writeExportConfigDraft(config: DocumentConfigFile) {
  window.localStorage.setItem(EXPORT_CONFIG_DRAFT_KEY, JSON.stringify(config));
}

export function clearExportConfigDraft() {
  window.localStorage.removeItem(EXPORT_CONFIG_DRAFT_KEY);
}

export async function publishExportConfig(config: DocumentConfigFile) {
  const token = window.sessionStorage.getItem(FORM_CONFIG_SESSION_KEY) ?? "";
  const response = await fetch("/__form-config/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ domain: "EXPORT", config }),
  });
  const result = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(result.message || "Konfigurasi Ekspor gagal dipublikasikan.");
  clearExportConfigDraft();
  return result.message || "Konfigurasi Ekspor berhasil dipublikasikan.";
}

export function resolveExportSteps(mapping: ExportSourceMappingFile, configFile: DocumentConfigFile, documentId: string, requiresQuarantine: boolean): ResolvedExportStep[] {
  const catalog = createExportFormCatalog(mapping);
  const document = documentId === "EXP_ALL"
    ? { id: "ALL", label: "Semua Elemen Ekspor", defaultRequiresQuarantine: true }
    : getDocumentConfig(configFile, documentId);
  const resolved = resolveDocumentSteps(document, catalog);

  return resolved
    .filter((step) => step.enabled)
    .map((step) => {
      const sourceStep = mapping.steps.find((item) => item.id === step.id)!;
      return {
        id: sourceStep.id,
        label: step.label,
        condition: sourceStep.condition,
        sections: step.sections
          .filter((section) => section.enabled)
          .map((section) => {
            const sourceSection = sourceStep.sections.find((item) => item.id === section.id)!;
            return {
              ...sourceSection,
              label: section.label,
              description: section.description ?? sourceSection.description,
              fields: section.fields
                .filter((field) => field.enabled)
                .map((field) => {
                  const sourceField = sourceSection.fields.find((item) => item.dataKey === field.id)!;
                  return {
                    ...sourceField,
                    inputType: field.inputType as ExportSourceField["inputType"],
                    readOnly: Boolean(field.readOnly),
                    required: field.required,
                    displayLabel: `${field.label}${sourceField.labelNote ? ` (${sourceField.labelNote})` : ""}`,
                    helperText: field.helperText,
                  };
                }),
            };
          }),
      };
    })
    .filter((step) => step.sections.length > 0)
    .filter((step) => step.condition !== "requiresQuarantine" || requiresQuarantine);
}
