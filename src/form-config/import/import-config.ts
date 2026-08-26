import importConfigJson from "./import-document-configs.json";
import { importFormCatalog } from "./import-catalog";
import { FORM_CONFIG_SESSION_KEY, isConfiguratorRuntime, isLocalConfiguratorHost } from "../shared/configurator-access";
import { assertValidFormOverrides } from "../shared/validation";
import type { DocumentConfigFile } from "../shared/types";

export const initialImportConfigFile = importConfigJson as DocumentConfigFile;
export const IMPORT_CONFIG_DRAFT_KEY = "insw-form-config-draft-v1";

export function readImportConfigDraft(): DocumentConfigFile | null {
  if (typeof window === "undefined" || !isLocalConfiguratorHost()) return null;
  try {
    const raw = window.localStorage.getItem(IMPORT_CONFIG_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentConfigFile;
    const retiredDocumentIds = new Set(["BC27", "OTHER"]);
    return {
      ...parsed,
      version: Math.max(parsed.version ?? 1, initialImportConfigFile.version),
      documents: parsed.documents.filter((document) => !retiredDocumentIds.has(document.id)),
    };
  } catch {
    return null;
  }
}

export function writeImportConfigDraft(config: DocumentConfigFile) {
  if (!isLocalConfiguratorHost()) return;
  window.localStorage.setItem(IMPORT_CONFIG_DRAFT_KEY, JSON.stringify(config));
}

export function clearImportConfigDraft() {
  if (!isLocalConfiguratorHost()) return;
  window.localStorage.removeItem(IMPORT_CONFIG_DRAFT_KEY);
}

export async function publishImportConfig(config: DocumentConfigFile) {
  if (!isConfiguratorRuntime()) throw new Error("Configurator tidak tersedia pada build ini.");
  assertValidFormOverrides(config, importFormCatalog);
  const token = window.sessionStorage.getItem(FORM_CONFIG_SESSION_KEY) ?? "";
  const response = await fetch("/__form-config/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ domain: "IMPORT", config }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message || "Konfigurasi Impor gagal dipublikasikan.");
  clearImportConfigDraft();
  return result.message || "Konfigurasi Impor berhasil dipublikasikan.";
}
