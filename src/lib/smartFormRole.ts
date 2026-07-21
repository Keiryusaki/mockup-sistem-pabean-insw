export const SMART_FORM_ROLE_KEY = "insw-smart-form-role";

export type SmartFormRole = "pengaju" | "penyedia";

export type SmartFormRoleSession = {
  role: SmartFormRole;
  selectedAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readSmartFormRole(): SmartFormRoleSession | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(SMART_FORM_ROLE_KEY) ?? window.localStorage.getItem(SMART_FORM_ROLE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SmartFormRoleSession;
  } catch {
    return null;
  }
}

export function writeSmartFormRole(role: SmartFormRole, remember = false) {
  if (!canUseStorage()) return;
  const payload = JSON.stringify({ role, selectedAt: new Date().toISOString() } satisfies SmartFormRoleSession);
  window.sessionStorage.removeItem(SMART_FORM_ROLE_KEY);
  window.localStorage.removeItem(SMART_FORM_ROLE_KEY);
  if (remember) window.localStorage.setItem(SMART_FORM_ROLE_KEY, payload);
  else window.sessionStorage.setItem(SMART_FORM_ROLE_KEY, payload);
}

export function clearSmartFormRole() {
  if (!canUseStorage()) return;
  window.sessionStorage.removeItem(SMART_FORM_ROLE_KEY);
  window.localStorage.removeItem(SMART_FORM_ROLE_KEY);
}
