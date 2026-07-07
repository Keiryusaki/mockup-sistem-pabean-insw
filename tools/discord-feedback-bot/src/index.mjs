import { AttachmentBuilder, Client, GatewayIntentBits, Partials } from "discord.js";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDiscordFeedbackMapper } from "./mapper.mjs";
import { readMirrorFile, pushMirrorFeed, writeMirrorFile } from "./mirror-store.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function parseEnvFile(text) {
  const parsed = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (!key) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

async function loadLocalEnv() {
  const candidates = [path.resolve(process.cwd(), ".env"), path.resolve(moduleDir, "..", ".env")];
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      Object.assign(process.env, parseEnvFile(raw));
      return candidate;
    } catch {
      // Ignore missing env files and keep falling back.
    }
  }
  return null;
}

await loadLocalEnv();

const env = process.env;
const token = env.DISCORD_TOKEN?.trim();
const mapper = createDiscordFeedbackMapper(env);
const mirrorOutputPath = env.MIRROR_OUTPUT_PATH?.trim() || "./feedback-feed.json";
const mirrorPushUrl = env.MIRROR_PUSH_URL?.trim();
const apiPort = Number.parseInt(env.FEEDBACK_API_PORT?.trim() || "8788", 10);

if (!token) {
  console.error("DISCORD_TOKEN is required.");
  process.exit(1);
}

if (!mapper.channelId) {
  console.error("DISCORD_FEEDBACK_CHANNEL_ID is required.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

function isForumParentChannel(channel) {
  return Boolean(channel && "threads" in channel);
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMessage(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function sanitizeThreadName(value) {
  const fallback = "Masukan Baru";
  const normalized = normalizeWhitespace(value);
  return (normalized || fallback).slice(0, 100);
}

function parseAttachmentPayload(item, index) {
  if (!item || typeof item !== "object") return null;
  const value = item;
  const name = normalizeWhitespace(value.name ?? `lampiran-${index + 1}`) || `lampiran-${index + 1}`;
  const mimeType = typeof value.mimeType === "string" && value.mimeType.trim() ? value.mimeType.trim() : "application/octet-stream";
  const kind = value.kind === "image" ? "image" : "file";
  const dataUrl = typeof value.dataUrl === "string" ? value.dataUrl.trim() : "";
  const base64 = typeof value.base64 === "string" ? value.base64.trim() : "";
  const data = dataUrl.startsWith("data:") ? dataUrl : base64;

  if (!data) return null;

  const commaIndex = data.indexOf(",");
  const raw = commaIndex >= 0 ? data.slice(commaIndex + 1) : data;

  return {
    name,
    mimeType,
    kind,
    buffer: Buffer.from(raw, "base64"),
  };
}

function buildSubmissionEmbed(payload, attachments) {
  const type = payload.type === "Perbaikan" ? "Perbaikan" : "Masukan";
  const reporter = normalizeWhitespace(payload.name) || "-";
  const message = normalizeMessage(payload.message) || "(tanpa pesan)";
  const page = normalizeWhitespace(payload.page) || "-";
  const url = normalizeWhitespace(payload.url) || "-";
  const phase = normalizeWhitespace(payload.phase) || "Perubahan Kedua";
  const submittedAt = new Date().toISOString();

  const embed = {
    title: `${type} Baru`,
    description: message,
    color: type === "Perbaikan" ? 0xffb300 : 0x023262,
    fields: [
      { name: "Nama", value: reporter, inline: true },
      { name: "Jenis", value: type, inline: true },
      { name: "Halaman", value: page, inline: false },
      { name: "URL", value: url.slice(0, 1024), inline: false },
      {
        name: "Waktu",
        value: new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(submittedAt)),
        inline: true,
      },
      { name: "Phase", value: phase, inline: true },
    ],
    footer: { text: "INSW mockup feedback" },
    timestamp: submittedAt,
  };

  const imageAttachment = attachments.find((attachment) => attachment.kind === "image");
  if (imageAttachment) {
    embed.image = { url: `attachment://${imageAttachment.name}` };
  }

  const otherAttachments = attachments.filter((attachment) => attachment.kind !== "image");
  if (otherAttachments.length > 0) {
    embed.fields.push({
      name: "Lampiran",
      value: otherAttachments.map((attachment) => attachment.name).join("\n").slice(0, 1024),
      inline: false,
    });
  }

  return embed;
}

async function readJsonBody(request, maxBytes = 25 * 1024 * 1024) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > maxBytes) {
      throw new Error("Payload too large.");
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

async function createForumSubmission(payload) {
  const channel = await client.channels.fetch(mapper.channelId).catch(() => null);
  if (!channel || !isForumParentChannel(channel)) {
    throw new Error("DISCORD_FEEDBACK_CHANNEL_ID harus menunjuk ke forum parent channel.");
  }

  const normalizedAttachments = Array.isArray(payload?.attachments)
    ? payload.attachments
        .map((item, index) => parseAttachmentPayload(item, index))
        .filter(Boolean)
    : [];

  const discordFiles = normalizedAttachments.map((attachment) => new AttachmentBuilder(attachment.buffer, { name: attachment.name }));

  const embed = buildSubmissionEmbed(payload ?? {}, normalizedAttachments);
  const reporter = normalizeWhitespace(payload?.name) || "-";
  const type = payload?.type === "Perbaikan" ? "Perbaikan" : "Masukan";
  const threadName = sanitizeThreadName(`${type} dari ${reporter}`);

  const starterMessage = {
    content: `Masukan / Perbaikan baru dari ${reporter}`,
    allowedMentions: { parse: [] },
    embeds: [embed],
    files: discordFiles,
  };

  const thread = await channel.threads.create({
    name: threadName,
    message: starterMessage,
  });

  await syncForumThread(thread);
  const starter = await thread.fetchStarterMessage().catch(() => null);

  return {
    discordChannelId: thread.id,
    discordMessageId: starter?.id ?? thread.id,
    discordMessageUrl: starter?.url ?? `https://discord.com/channels/${thread.guildId}/${thread.id}`,
    threadUrl: thread.url ?? `https://discord.com/channels/${thread.guildId}/${thread.id}`,
  };
}

function getEmbedField(embed, names) {
  const fields = Array.isArray(embed?.fields) ? embed.fields : [];
  const normalizedNames = new Set(names.map((name) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")));
  const field = fields.find((item) => normalizedNames.has(String(item?.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")));
  return typeof field?.value === "string" && field.value.trim() ? field.value.trim() : undefined;
}

async function buildFeedPayload(records) {
  return {
    generatedAt: new Date().toISOString(),
    items: records,
  };
}

async function readMirrorPayload() {
  const records = mirrorOutputPath ? await readMirrorFile(mirrorOutputPath) : [];
  return buildFeedPayload(records);
}

async function writeMirrorRecords(records) {
  const payload = await buildFeedPayload(
    records.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
  );

  if (mirrorOutputPath) {
    await writeMirrorFile(mirrorOutputPath, payload);
  }

  if (mirrorPushUrl) {
    await pushMirrorFeed(mirrorPushUrl, payload);
  }
}

async function syncMirror(nextRecord) {
  const currentRecords = mirrorOutputPath ? await readMirrorFile(mirrorOutputPath) : [];
  const merged = [nextRecord, ...currentRecords.filter((item) => item.id !== nextRecord.id)];
  await writeMirrorRecords(merged);
}

async function removeMirrorRecord(messageId, { removeDescendants = false } = {}) {
  if (!mirrorOutputPath && !mirrorPushUrl) return;

  const currentRecords = mirrorOutputPath ? await readMirrorFile(mirrorOutputPath) : [];
  const targetId = `discord-${messageId}`;
  const idsToRemove = new Set([targetId]);

  if (removeDescendants) {
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const record of currentRecords) {
        if (!record.parentId || idsToRemove.has(record.id)) continue;
        if (idsToRemove.has(record.parentId)) {
          idsToRemove.add(record.id);
          expanded = true;
        }
      }
    }
  }

  const nextRecords = currentRecords.filter((record) => !idsToRemove.has(record.id));
  await writeMirrorRecords(nextRecords);
}

async function replaceThreadRecords(threadChannelId, nextRecords) {
  if (!mirrorOutputPath && !mirrorPushUrl) return;

  const currentRecords = mirrorOutputPath ? await readMirrorFile(mirrorOutputPath) : [];
  const remaining = currentRecords.filter((record) => record.discordChannelId !== threadChannelId);
  await writeMirrorRecords([...nextRecords, ...remaining]);
}

async function fetchAllThreadMessages(thread) {
  const fetchedMessages = [];
  let before;

  while (true) {
    const page = await thread.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (page.size === 0) break;
    fetchedMessages.push(...page.values());
    if (page.size < 100) break;
    before = page.reduce((oldest, message) => (message.id < oldest.id ? message : oldest)).id;
  }

  return fetchedMessages;
}

async function mapForumThread(thread) {
  const starterMessage = await thread.fetchStarterMessage().catch(() => null);
  if (!starterMessage) return [];

  const rootRecord = await mapper.mapMessage(starterMessage, {
    kindOverride: "root",
    parentIdOverride: undefined,
    discordChannelIdOverride: thread.id,
    discordReplyToMessageIdOverride: undefined,
  });

  const threadMessages = await fetchAllThreadMessages(thread);
  const replies = await Promise.all(
    threadMessages
      .filter((message) => message.id !== starterMessage.id)
      .map((message) =>
        mapper.mapMessage(message, {
          kindOverride: "reply",
          parentIdOverride: rootRecord.id,
          typeOverride: rootRecord.type,
          discordChannelIdOverride: thread.id,
          discordReplyToMessageIdOverride: starterMessage.id,
        }),
      ),
  );

  return [rootRecord, ...replies.filter(Boolean)];
}

async function syncForumThread(thread) {
  const records = await mapForumThread(thread);
  if (records.length === 0) return;
  await replaceThreadRecords(thread.id, records);
}

async function syncForumChannelHistory(parentChannel) {
  const activeThreads = await parentChannel.threads.fetchActive();
  const archivedThreads = await parentChannel.threads.fetchArchived({ type: "public", fetchAll: true });
  const allThreads = new Map([...activeThreads.threads, ...archivedThreads.threads]);

  const records = [];
  for (const thread of allThreads.values()) {
    const threadRecords = await mapForumThread(thread);
    records.push(...threadRecords);
  }

  await writeMirrorRecords(records);
}

async function syncChannelHistory() {
  const channel = await client.channels.fetch(mapper.channelId);
  if (!channel) return;

  if (isForumParentChannel(channel)) {
    await syncForumChannelHistory(channel);
    console.log(`Synced forum history from ${channel.id}.`);
    return;
  }

  if (!("messages" in channel)) return;

  const batches = [];
  let before;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (fetched.size === 0) break;
    batches.push(...fetched.values());
    if (fetched.size < 100) break;
    before = fetched.reduce((oldest, message) => (message.id < oldest.id ? message : oldest)).id;
  }

  const records = batches
    .filter((message) => !message.author.bot || message.webhookId)
    .map(async (message) => mapper.mapMessage(message));

  const resolvedRecords = (await Promise.all(records))
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const payload = await buildFeedPayload(resolvedRecords);

  if (mirrorOutputPath) {
    await writeMirrorFile(mirrorOutputPath, payload);
  }

  if (mirrorPushUrl) {
    await pushMirrorFeed(mirrorPushUrl, payload);
  }

  console.log(`Synced ${resolvedRecords.length} messages from channel history.`);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag ?? "discord-feedback-bot"}`);
  console.log(`Mirroring channel: ${mapper.channelId}`);
  console.log(`Output file: ${mirrorOutputPath || "(disabled)"}`);
  console.log(`Push URL: ${mirrorPushUrl || "(disabled)"}`);
  void syncChannelHistory().catch((error) => {
    console.error("Failed to sync channel history:", error);
  });
});

const apiServer = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (url.pathname === "/health" && request.method === "GET") {
    writeJson(response, 200, {
      ok: true,
      botReady: client.isReady(),
      channelId: mapper.channelId,
      apiPort,
    });
    return;
  }

  if (url.pathname === "/feedback-feed.json" && request.method === "GET") {
    try {
      const payload = await readMirrorPayload();
      writeJson(response, 200, payload);
    } catch (error) {
      console.error("Failed to read mirror payload:", error);
      writeJson(response, 500, { ok: false, error: "Failed to read mirror payload." });
    }
    return;
  }

  if (url.pathname === "/submit-feedback" && request.method === "POST") {
    try {
      const payload = await readJsonBody(request);
      const result = await createForumSubmission(payload);
      writeJson(response, 201, { ok: true, ...result });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      writeJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Gagal mengirim masukan.",
      });
    }
    return;
  }

  writeJson(response, 404, { ok: false, error: "Not found" });
});

apiServer.listen(apiPort, () => {
  console.log(`Feedback API listening on http://localhost:${apiPort}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot && !message.webhookId) return;

  const channel = message.channel ?? (await client.channels.fetch(message.channelId).catch(() => null));
  if (channel && channel.isThread?.() && channel.parentId === mapper.channelId) {
    try {
      await syncForumThread(channel);
      console.log(`Synced forum thread after new message ${message.id}`);
    } catch (error) {
      console.error("Failed to sync forum thread after new message:", error);
    }
    return;
  }

  if (message.channelId !== mapper.channelId) return;

  const record = await mapper.mapMessage(message);

  try {
    await syncMirror(record);
    console.log(`Mirrored message ${message.id} -> ${record.kind} ${record.type}`);
  } catch (error) {
    console.error("Failed to sync mirror:", error);
  }
});

client.on("messageUpdate", async (_oldMessage, newMessage) => {
  if (!("content" in newMessage) && !("attachments" in newMessage)) return;

  const channel = newMessage.channel ?? (await client.channels.fetch(newMessage.channelId).catch(() => null));
  if (channel && channel.isThread?.() && channel.parentId === mapper.channelId) {
    try {
      await syncForumThread(channel);
      console.log(`Synced forum thread after updated message ${newMessage.id}`);
    } catch (error) {
      console.error("Failed to sync forum thread after updated message:", error);
    }
    return;
  }

  if (newMessage.channelId !== mapper.channelId) return;

  const record = await mapper.mapMessage(newMessage);
  try {
    await syncMirror(record);
    console.log(`Mirrored updated message ${newMessage.id}`);
  } catch (error) {
    console.error("Failed to sync updated message:", error);
  }
});

client.on("messageDelete", async (message) => {
  if (!message) return;

  try {
    const channel = message.channel ?? (await client.channels.fetch(message.channelId).catch(() => null));
    if (channel && channel.isThread?.() && channel.parentId === mapper.channelId) {
      await syncForumThread(channel);
      console.log(`Resynced forum thread after deleting message ${message.id}`);
      return;
    }

    if (message.channelId !== mapper.channelId) return;

    await removeMirrorRecord(message.id, { removeDescendants: true });
    console.log(`Removed mirrored message ${message.id}`);
  } catch (error) {
    console.error("Failed to remove mirrored message:", error);
  }
});

client.on("messageDeleteBulk", async (messages) => {
  try {
    for (const message of messages.values()) {
      const channel = message.channel ?? (await client.channels.fetch(message.channelId).catch(() => null));
      if (channel && channel.isThread?.() && channel.parentId === mapper.channelId) {
        await syncForumThread(channel);
        console.log(`Resynced forum thread after bulk delete ${channel.id}`);
        continue;
      }

      if (message.channelId !== mapper.channelId) continue;
      await removeMirrorRecord(message.id, { removeDescendants: true });
      console.log(`Removed mirrored message ${message.id}`);
    }
  } catch (error) {
    console.error("Failed to remove bulk mirrored messages:", error);
  }
});

client.on("threadCreate", async (thread) => {
  if (!thread.parentId || thread.parentId !== mapper.channelId) return;

  try {
    await syncForumThread(thread);
    console.log(`Synced created forum thread ${thread.id}`);
  } catch (error) {
    console.error("Failed to sync created forum thread:", error);
  }
});

client.on("threadUpdate", async (_oldThread, newThread) => {
  if (!newThread.parentId || newThread.parentId !== mapper.channelId) return;

  try {
    await syncForumThread(newThread);
    console.log(`Synced updated forum thread ${newThread.id}`);
  } catch (error) {
    console.error("Failed to sync updated forum thread:", error);
  }
});

client.on("threadDelete", async (thread) => {
  if (!thread.parentId || thread.parentId !== mapper.channelId) return;

  try {
    await replaceThreadRecords(thread.id, []);
    console.log(`Removed forum thread ${thread.id}`);
  } catch (error) {
    console.error("Failed to remove forum thread:", error);
  }
});

client.login(token);
