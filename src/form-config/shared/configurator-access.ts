export const FORM_CONFIG_SESSION_KEY = "insw-form-config-session-v1";
export const FORM_CONFIG_ACCESS_EVENT = "insw-form-config-access-changed";

export function isConfiguratorRuntime() {
  return import.meta.env.DEV;
}

export function isLocalConfiguratorHost() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
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
