import configFileJson from "./document-configs.json";
import { formConfigCatalog } from "./catalog";
import type {
  DocumentConfigFile,
  DocumentFormConfig,
  FieldOverride,
  ResolvedSectionConfig,
  ResolvedStepConfig,
  SectionOverride,
  StepOverride,
} from "./types";

export const initialDocumentConfigFile = configFileJson as DocumentConfigFile;
export const FORM_CONFIG_DRAFT_KEY = "insw-form-config-draft-v1";
export const FORM_CONFIG_SESSION_KEY = "insw-form-config-session-v1";
export const FORM_CONFIG_ACCESS_EVENT = "insw-form-config-access-changed";

export function isConfiguratorRuntime() {
  return import.meta.env.DEV;
}

export function isLocalConfiguratorHost() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

export function cloneConfigFile(config: DocumentConfigFile): DocumentConfigFile {
  return JSON.parse(JSON.stringify(config)) as DocumentConfigFile;
}

export function getDocumentConfig(configFile: DocumentConfigFile, id: string): DocumentFormConfig {
  return configFile.documents.find((document) => document.id === id && !document.archived)
    ?? configFile.documents.find((document) => document.id === "BC20")
    ?? configFile.documents[0];
}

export function resolveDocumentSteps(document: DocumentFormConfig): ResolvedStepConfig[] {
  return formConfigCatalog
    .map((step, stepIndex) => {
      const stepOverride: StepOverride = document.steps?.[step.id] ?? {};
      const sections: ResolvedSectionConfig[] = step.sections
        .map((section, sectionIndex) => {
          const sectionOverride: SectionOverride = stepOverride.sections?.[section.id] ?? {};
          const resolvedFields = section.fields
            .map((field, fieldIndex) => {
              const fieldOverride: FieldOverride = sectionOverride.fields?.[field.id] ?? {};
              const applicable = document.id === "ALL" || !field.documentTypes?.length || field.documentTypes.includes(document.id);
              return {
                ...field,
                label: fieldOverride.label?.trim() || field.label,
                enabled: fieldOverride.enabled ?? applicable,
                required: fieldOverride.required ?? Boolean(field.required),
                order: fieldOverride.order ?? fieldIndex,
                helperText: fieldOverride.helperText?.trim() || undefined,
              };
            })
            .sort((left, right) => left.order - right.order);
          const applicableSection = section.fields.length === 0 || resolvedFields.some((field) => field.enabled);
          return {
            ...section,
            label: sectionOverride.label?.trim() || section.label,
            description: sectionOverride.description?.trim() || section.description,
            enabled: applicableSection && sectionOverride.enabled !== false,
            order: sectionOverride.order ?? sectionIndex,
            fields: resolvedFields,
          };
        })
        .sort((left, right) => left.order - right.order);

      return {
        ...step,
        label: stepOverride.label?.trim() || step.label,
        enabled: sections.some((section) => section.enabled) && stepOverride.enabled !== false,
        order: stepOverride.order ?? stepIndex,
        sections,
      };
    })
    .sort((left, right) => left.order - right.order);
}

export function readConfigDraft(): DocumentConfigFile | null {
  if (typeof window === "undefined" || !isLocalConfiguratorHost()) return null;
  try {
    const raw = window.localStorage.getItem(FORM_CONFIG_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentConfigFile;
    const retiredDocumentIds = new Set(["BC27", "OTHER"]);
    return {
      ...parsed,
      version: Math.max(parsed.version ?? 1, initialDocumentConfigFile.version),
      documents: parsed.documents.filter((document) => !retiredDocumentIds.has(document.id)),
    };
  } catch {
    return null;
  }
}

export function writeConfigDraft(config: DocumentConfigFile) {
  if (!isLocalConfiguratorHost()) return;
  window.localStorage.setItem(FORM_CONFIG_DRAFT_KEY, JSON.stringify(config));
}

export function clearConfigDraft() {
  if (!isLocalConfiguratorHost()) return;
  window.localStorage.removeItem(FORM_CONFIG_DRAFT_KEY);
}

function readSessionToken() {
  if (typeof window === "undefined" || !isConfiguratorRuntime()) return "";
  return window.sessionStorage.getItem(FORM_CONFIG_SESSION_KEY) ?? "";
}

export async function unlockIntranetConfigurator(code: string) {
  if (!isConfiguratorRuntime()) throw new Error("Developer mode tidak tersedia pada build ini.");
  const response = await fetch("/__form-config/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const result = (await response.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!response.ok || !result.token) throw new Error(result.message || "Kode akses tidak valid.");
  window.sessionStorage.setItem(FORM_CONFIG_SESSION_KEY, result.token);
  window.dispatchEvent(new CustomEvent(FORM_CONFIG_ACCESS_EVENT));
}

export async function hasIntranetConfiguratorSession() {
  if (!isConfiguratorRuntime()) return false;
  if (isLocalConfiguratorHost()) return true;
  const token = readSessionToken();
  if (!token) return false;
  const response = await fetch("/__form-config/status", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (!response?.ok) return false;
  const result = (await response.json().catch(() => ({}))) as { unlocked?: boolean };
  if (!result.unlocked) window.sessionStorage.removeItem(FORM_CONFIG_SESSION_KEY);
  return Boolean(result.unlocked);
}

export async function applyConfigToRepository(config: DocumentConfigFile) {
  if (!isConfiguratorRuntime()) throw new Error("Configurator tidak tersedia pada build ini.");
  const token = readSessionToken();
  const response = await fetch("/__form-config/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(config),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message || "Konfigurasi gagal ditulis ke repository.");
  return result.message || "Konfigurasi diterapkan ke repository.";
}
