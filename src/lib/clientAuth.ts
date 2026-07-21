export const CLIENT_AUTH_KEY = "insw-client-auth";

export type ClientRelation = {
  id: string;
  title: string;
  subtitle: string;
};

export type ClientAccess = {
  id: string;
  label: string;
  relationId: string;
};

export type ClientSession = {
  identity: string;
  remember: boolean;
  relationId?: string;
  accessId?: string;
  authenticatedAt: string;
};

export const clientRelations: ClientRelation[] = [
  {
    id: "rel-pribadi-lnsw",
    title: "Atas Nama Pribadi Sebagai Lembaga National Single Window (LNSW)",
    subtitle: "Lembaga National Single Window (LNSW)",
  },
];

export const clientAccesses: ClientAccess[] = [
  {
    id: "acc-layer-2",
    label: "Layer 2 - Operasional Sistem",
    relationId: "rel-pribadi-lnsw",
  },
];

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readClientSession(): ClientSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(CLIENT_AUTH_KEY) ?? window.sessionStorage.getItem(CLIENT_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClientSession;
  } catch {
    return null;
  }
}

export function writeClientSession(session: ClientSession) {
  if (!canUseStorage()) return;

  const payload = JSON.stringify(session);
  window.localStorage.removeItem(CLIENT_AUTH_KEY);
  window.sessionStorage.removeItem(CLIENT_AUTH_KEY);

  if (session.remember) {
    window.localStorage.setItem(CLIENT_AUTH_KEY, payload);
  } else {
    window.sessionStorage.setItem(CLIENT_AUTH_KEY, payload);
  }
}

export function clearClientSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CLIENT_AUTH_KEY);
  window.sessionStorage.removeItem(CLIENT_AUTH_KEY);
}

export function isClientAuthenticated(session = readClientSession()) {
  return Boolean(session?.identity);
}

export function hasClientContext(session = readClientSession()) {
  return Boolean(session?.identity && session.relationId && session.accessId);
}

export function getClientRelation(session = readClientSession()) {
  if (!session?.relationId) return null;
  return clientRelations.find((item) => item.id === session.relationId) ?? null;
}

export function getClientAccess(session = readClientSession()) {
  if (!session?.accessId) return null;
  return clientAccesses.find((item) => item.id === session.accessId) ?? null;
}

export function getAccessesForRelation(relationId: string) {
  return clientAccesses.filter((item) => item.relationId === relationId);
}
