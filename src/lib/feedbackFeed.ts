export type FeedbackType = "Masukan" | "Perbaikan";

export type FeedbackAttachment = {
  name: string;
  kind: "image" | "file";
  mimeType?: string;
  size?: number;
  previewUrl?: string;
};

export type FeedbackRecord = {
  id: string;
  parentId?: string;
  kind: "root" | "reply";
  type: FeedbackType;
  reporter: string;
  authorRole: "user" | "reviewer";
  message: string;
  page: string;
  url: string;
  createdAt: string;
  phase: string;
  source: "discord" | "local" | "demo";
  status: "Baru" | "Dibaca" | "Ditindaklanjuti" | "Selesai";
  channel?: string;
  discordChannelId?: string;
  discordMessageId?: string;
  discordReplyToMessageId?: string;
  discordMessageUrl?: string;
  attachments: FeedbackAttachment[];
  tags: string[];
};

export const FEEDBACK_FEED_STORAGE_KEY = "insw-feedback-feed";

const SVG_DATA_URI_PREFIX = "data:image/svg+xml;charset=UTF-8,";

function encodeSvg(svg: string) {
  return `${SVG_DATA_URI_PREFIX}${encodeURIComponent(svg)}`;
}

function makeDemoPreview(label: string, accent: string) {
  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="900" height="520" rx="36" fill="url(#g)"/>
      <rect x="40" y="40" width="220" height="16" rx="8" fill="rgba(255,255,255,0.68)"/>
      <rect x="40" y="76" width="460" height="18" rx="9" fill="rgba(255,255,255,0.58)"/>
      <rect x="40" y="120" width="820" height="316" rx="24" fill="rgba(255,255,255,0.68)" stroke="rgba(255,255,255,0.9)"/>
      <text x="70" y="220" fill="#0f172a" font-family="Arial, sans-serif" font-size="34" font-weight="700">${label}</text>
      <text x="70" y="272" fill="#334155" font-family="Arial, sans-serif" font-size="20">Discord mirror preview</text>
      <rect x="70" y="320" width="300" height="42" rx="18" fill="#0b4ca5"/>
      <text x="94" y="348" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Lampiran contoh</text>
    </svg>
  `);
}

function isLikelyImageAttachment(attachment: Partial<FeedbackAttachment> & { name?: string; previewUrl?: string }) {
  const name = (attachment.name ?? "").toLowerCase();
  const mime = (attachment.mimeType ?? "").toLowerCase();
  return Boolean(
    mime.startsWith("image/") ||
      attachment.previewUrl ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp") ||
      name.endsWith(".bmp") ||
      name.endsWith(".svg"),
  );
}

export const DEMO_FEEDBACK_RECORDS: FeedbackRecord[] = [
  {
    id: "fb-20260706-001",
    kind: "root",
    type: "Masukan",
    reporter: "Beo",
    authorRole: "user",
    message:
      "Tolong tambahkan halaman inbox yang bisa dipakai TW buat baca perubahan dan feedback tanpa perlu buka Discord.",
    page: "/component",
    url: "https://keiryusaki.github.io/mockup-sistem-pabean-insw/#/component",
    createdAt: "2026-07-06T07:41:00.000Z",
    phase: "Perubahan Kedua",
    source: "demo",
    status: "Baru",
    channel: "#kotak-saran",
    discordChannelId: "1523586961741189224",
    discordMessageId: "116000000000000001",
    discordMessageUrl: "",
    attachments: [
      {
        name: "mockup-feedback-hero.png",
        kind: "image",
        previewUrl: makeDemoPreview("Feedback mirror", "#f97316"),
      },
    ],
    tags: ["mirror", "inbox", "TW"],
  },
  {
    id: "fb-20260706-002",
    kind: "root",
    type: "Perbaikan",
    reporter: "Adit",
    authorRole: "user",
    message:
      "Tombol batal di step parsing perlu konfirmasi kalau data sudah terlanjur diproses, supaya user tidak kehilangan status upload.",
    page: "/form",
    url: "https://keiryusaki.github.io/mockup-sistem-pabean-insw/#/form",
    createdAt: "2026-07-06T08:14:00.000Z",
    phase: "Perubahan Kedua",
    source: "demo",
    status: "Ditindaklanjuti",
    channel: "#kotak-saran",
    discordChannelId: "1523586961741189224",
    discordMessageId: "116000000000000002",
    discordMessageUrl: "",
    attachments: [
      {
        name: "parsing-state-notes.pdf",
        kind: "file",
        mimeType: "application/pdf",
      },
    ],
    tags: ["flow", "parsing", "bugfix"],
  },
  {
    id: "fb-20260706-002-r1",
    parentId: "fb-20260706-002",
    kind: "reply",
    type: "Perbaikan",
    reporter: "TW INSW",
    authorRole: "reviewer",
    message:
      "Sudah kami cek, alur parsing memang perlu konfirmasi saat data sudah masuk. Nanti akan diselaraskan ke tombol batal di step parsing.",
    page: "/form",
    url: "https://keiryusaki.github.io/mockup-sistem-pabean-insw/#/form",
    createdAt: "2026-07-06T08:20:00.000Z",
    phase: "Perubahan Kedua",
    source: "demo",
    status: "Ditindaklanjuti",
    channel: "#kotak-saran",
    discordChannelId: "1523586961741189224",
    discordMessageId: "116000000000000002-r1",
    discordReplyToMessageId: "116000000000000002",
    discordMessageUrl: "",
    attachments: [
      {
        name: "reply-mockup-note.png",
        kind: "image",
        previewUrl: makeDemoPreview("Balasan TW", "#2563eb"),
      },
    ],
    tags: ["reply", "reviewer", "thread"],
  },
  {
    id: "fb-20260706-003",
    kind: "root",
    type: "Masukan",
    reporter: "Dina",
    authorRole: "user",
    message:
      "Boleh tambahkan filter jenis feedback dan status tindak lanjut biar laporan TW lebih cepat dirangkum.",
    page: "/changelog",
    url: "https://keiryusaki.github.io/mockup-sistem-pabean-insw/#/changelog",
    createdAt: "2026-07-06T09:02:00.000Z",
    phase: "Perubahan Kedua",
    source: "demo",
    status: "Dibaca",
    channel: "#kotak-saran",
    discordChannelId: "1523586961741189224",
    discordMessageId: "116000000000000003",
    discordMessageUrl: "",
    attachments: [],
    tags: ["report", "filter"],
  },
];

function readJsonPayload(payload: unknown): FeedbackRecord[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  return list
    .map((item) => normalizeFeedbackRecord(item))
    .filter((item): item is FeedbackRecord => Boolean(item));
}

export function normalizeFeedbackRecord(item: unknown): FeedbackRecord | null {
  if (!item || typeof item !== "object") return null;
  const value = item as Partial<FeedbackRecord> & {
    attachments?: unknown;
    tags?: unknown;
  };

  const type = value.type === "Perbaikan" ? "Perbaikan" : "Masukan";
  const status: FeedbackRecord["status"] =
    value.status === "Dibaca" || value.status === "Ditindaklanjuti" || value.status === "Selesai" ? value.status : "Baru";
  const kind: FeedbackRecord["kind"] = value.kind === "reply" ? "reply" : "root";
  const authorRole: FeedbackRecord["authorRole"] = value.authorRole === "reviewer" ? "reviewer" : "user";

  const normalizedParentId =
    typeof value.parentId === "string" && value.parentId.trim()
      ? value.parentId.startsWith("discord-")
        ? value.parentId
        : `discord-${value.parentId}`
      : undefined;

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    parentId: normalizedParentId,
    kind,
    type,
    reporter: typeof value.reporter === "string" && value.reporter.trim() ? value.reporter : "-",
    authorRole,
    message: typeof value.message === "string" ? value.message : "",
    page: typeof value.page === "string" && value.page.trim() ? value.page : "-",
    url: typeof value.url === "string" && value.url.trim() ? value.url : "-",
    createdAt: typeof value.createdAt === "string" && value.createdAt.trim() ? value.createdAt : new Date().toISOString(),
    phase: typeof value.phase === "string" && value.phase.trim() ? value.phase : "Perubahan Kedua",
    source: value.source === "local" || value.source === "demo" ? value.source : "discord",
    status,
    channel: typeof value.channel === "string" ? value.channel : undefined,
    discordChannelId: typeof value.discordChannelId === "string" ? value.discordChannelId : undefined,
    discordMessageId: typeof value.discordMessageId === "string" ? value.discordMessageId : undefined,
    discordReplyToMessageId: typeof value.discordReplyToMessageId === "string" ? value.discordReplyToMessageId : undefined,
    discordMessageUrl: typeof value.discordMessageUrl === "string" ? value.discordMessageUrl : undefined,
    attachments: (() => {
      const nextAttachments: Array<FeedbackAttachment | null> = Array.isArray(value.attachments)
        ? value.attachments.map((attachment) => {
            if (!attachment || typeof attachment !== "object") return null;
            const file = attachment as Partial<FeedbackAttachment>;
            const kind = file.kind === "image" || isLikelyImageAttachment(file) ? "image" : "file";
            return {
              name: typeof file.name === "string" && file.name.trim() ? file.name : "lampiran",
              kind,
              mimeType: typeof file.mimeType === "string" ? file.mimeType : undefined,
              size: typeof file.size === "number" ? file.size : undefined,
              previewUrl: typeof file.previewUrl === "string" ? file.previewUrl : undefined,
            };
          })
        : [];

      return nextAttachments.filter((attachment): attachment is FeedbackAttachment => attachment !== null);
    })(),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())) : [],
  };
}

export function readStoredFeedbackRecords(options?: { includeDemo?: boolean }): FeedbackRecord[] {
  const includeDemo = options?.includeDemo ?? true;
  if (typeof window === "undefined") return DEMO_FEEDBACK_RECORDS;

  try {
    const raw = window.localStorage.getItem(FEEDBACK_FEED_STORAGE_KEY);
    if (!raw) return includeDemo ? DEMO_FEEDBACK_RECORDS : [];
    return readJsonPayload(JSON.parse(raw));
  } catch {
    return includeDemo ? DEMO_FEEDBACK_RECORDS : [];
  }
}

export function saveStoredFeedbackRecord(record: FeedbackRecord) {
  if (typeof window === "undefined") return;

  try {
    const next = [record, ...readStoredFeedbackRecords({ includeDemo: false }).filter((item) => item.id !== record.id)];
    window.localStorage.setItem(FEEDBACK_FEED_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent("storage", { key: FEEDBACK_FEED_STORAGE_KEY }));
  } catch {
    // Ignore storage failures in the mockup shell.
  }
}

export async function loadFeedbackRecords(remoteUrl?: string): Promise<{ source: string; records: FeedbackRecord[] }> {
  const localRecords = readStoredFeedbackRecords({ includeDemo: false });
  const remote = remoteUrl?.trim();

  if (!remote) {
    if (localRecords.length > 0) {
      return { source: "local mirror + demo", records: mergeFeedbackRecords(localRecords, DEMO_FEEDBACK_RECORDS) };
    }

    return { source: "demo fallback", records: DEMO_FEEDBACK_RECORDS };
  }

  try {
    const response = await fetch(remote, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as unknown;
    const remoteRecords = readJsonPayload(payload);
    return { source: "mirror endpoint", records: remoteRecords.length > 0 ? remoteRecords : DEMO_FEEDBACK_RECORDS };
  } catch {
    return { source: "mirror unavailable", records: DEMO_FEEDBACK_RECORDS };
  }
}

function mergeFeedbackRecords(primary: FeedbackRecord[], secondary: FeedbackRecord[]) {
  const seen = new Set<string>();
  const merged: FeedbackRecord[] = [];

  for (const record of [...primary, ...secondary]) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    merged.push(record);
  }

  return merged.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
