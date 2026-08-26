import { cloneConfigFile } from "./resolver";
import type { DocumentConfigFile, FormDomain } from "./types";

const CONFIG_CACHE_KEY = "insw-published-form-config-cache-v1";
const REQUEST_TIMEOUT_MS = 10000;

type PublishedPayload = {
  ok: true;
  schemaVersion: number;
  revision: number;
  checksum?: string;
  publishedAt?: string;
  configs: Record<FormDomain, DocumentConfigFile>;
};

export type ConfigProviderResult = {
  config: DocumentConfigFile;
  revision: number | null;
  source: "remote" | "cache" | "bundled";
  warning?: string;
};

function apiUrl() {
  return String(import.meta.env.VITE_FORM_CONFIG_API_URL ?? "").trim();
}

function isDocumentConfigFile(value: unknown): value is DocumentConfigFile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DocumentConfigFile>;
  if (!Number.isInteger(candidate.version) || !Array.isArray(candidate.documents)) return false;
  const ids = new Set<string>();
  return candidate.documents.every((document) => {
    if (!document || typeof document.id !== "string" || !document.id.trim() || typeof document.label !== "string" || !document.label.trim()) return false;
    if (ids.has(document.id)) return false;
    ids.add(document.id);
    return typeof document.defaultRequiresQuarantine === "boolean";
  });
}

function isPublishedPayload(value: unknown): value is PublishedPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublishedPayload>;
  return candidate.ok === true
    && Number.isInteger(candidate.schemaVersion)
    && Number.isInteger(candidate.revision)
    && Boolean(candidate.configs)
    && isDocumentConfigFile(candidate.configs?.IMPORT)
    && isDocumentConfigFile(candidate.configs?.EXPORT);
}

function readCachedPayload(): PublishedPayload | null {
  try {
    const raw = window.localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isPublishedPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedPayload(payload: PublishedPayload) {
  try {
    window.localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Cache hanya fallback; kegagalan quota/storage tidak boleh menggagalkan form.
  }
}

async function fetchPublishedPayload(url: string): Promise<PublishedPayload> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}action=config`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null) as unknown;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!isPublishedPayload(result)) {
      const message = result && typeof result === "object" && "error" in result ? String((result as { error?: unknown }).error ?? "") : "";
      throw new Error(message || "Payload konfigurasi remote tidak valid.");
    }
    return result;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadPublishedFormConfig(domain: FormDomain, bundledConfig: DocumentConfigFile): Promise<ConfigProviderResult> {
  const url = apiUrl();
  if (!url) return { config: cloneConfigFile(bundledConfig), revision: null, source: "bundled", warning: "URL konfigurasi remote belum diatur." };

  try {
    const payload = await fetchPublishedPayload(url);
    writeCachedPayload(payload);
    return { config: cloneConfigFile(payload.configs[domain]), revision: payload.revision, source: "remote" };
  } catch (error) {
    const cached = readCachedPayload();
    const reason = error instanceof Error ? error.message : "Endpoint tidak dapat diakses.";
    if (cached) return { config: cloneConfigFile(cached.configs[domain]), revision: cached.revision, source: "cache", warning: reason };
    return { config: cloneConfigFile(bundledConfig), revision: null, source: "bundled", warning: reason };
  }
}
