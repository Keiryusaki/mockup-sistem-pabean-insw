import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function requestHostname(request: IncomingMessage) {
  const hostHeader = request.headers.host ?? "";
  return hostHeader.startsWith("[") ? hostHeader.slice(0, hostHeader.indexOf("]") + 1) : hostHeader.split(":")[0];
}

function isSameOriginRequest(request: IncomingMessage) {
  const hostname = requestHostname(request);
  const requestOrigin = request.headers.origin;
  const originHostname = (() => {
    if (!requestOrigin) return null;
    try { return new URL(requestOrigin).hostname; } catch { return "invalid"; }
  })();
  const fetchSite = request.headers["sec-fetch-site"];
  return (originHostname === null || originHostname === hostname) && (!fetchSite || fetchSite === "same-origin");
}

function isLocalRequest(request: IncomingMessage) {
  return LOOPBACK_HOSTS.has(requestHostname(request)) && LOOPBACK_ADDRESSES.has(request.socket.remoteAddress ?? "") && isSameOriginRequest(request);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

function readJsonBody(request: IncomingMessage, maxLength = 2_000_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxLength) reject(new Error("Payload terlalu besar."));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error("Payload JSON tidak valid.")); }
    });
    request.on("error", reject);
  });
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

type FormDomain = "IMPORT" | "EXPORT";

type DocumentConfigFile = {
  version: number;
  documents: unknown[];
};

type PublishedConfigPayload = {
  ok: boolean;
  revision?: number;
  error?: string;
  configs?: Record<FormDomain, DocumentConfigFile>;
};

function isDocumentConfigFile(value: unknown): value is DocumentConfigFile {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<DocumentConfigFile>;
  return Number.isInteger(config.version) && Array.isArray(config.documents);
}

function formConfigPublisher(unlockCode: string, apiUrl: string, publishKey: string, publishedBy: string): Plugin {
  const accessTokens = new Set<string>();
  const failedAttempts = new Map<string, { count: number; resetAt: number }>();

  const readBearerToken = (request: IncomingMessage) => {
    const authorization = request.headers.authorization ?? "";
    return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  };
  const hasUnlockedSession = (request: IncomingMessage) => accessTokens.has(readBearerToken(request));

  return {
    name: "form-config-publisher",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__form-config/unlock", async (request, response, next) => {
        if (request.method !== "POST") { next(); return; }
        if (!isSameOriginRequest(request)) { sendJson(response, 403, { message: "Permintaan unlock ditolak." }); return; }
        if (!unlockCode) { sendJson(response, 503, { message: "Kode akses konfigurasi belum tersedia di server." }); return; }

        const address = request.socket.remoteAddress ?? "unknown";
        const now = Date.now();
        const attempt = failedAttempts.get(address);
        if (attempt && attempt.resetAt > now && attempt.count >= 5) {
          sendJson(response, 429, { message: "Terlalu banyak percobaan. Coba kembali beberapa menit lagi." });
          return;
        }

        try {
          const parsed = await readJsonBody(request, 10_000) as { code?: unknown };
          const submittedCode = typeof parsed.code === "string" ? parsed.code : "";
          if (!safeEqual(submittedCode, unlockCode)) {
            const current = attempt && attempt.resetAt > now ? attempt : { count: 0, resetAt: now + 5 * 60_000 };
            failedAttempts.set(address, { ...current, count: current.count + 1 });
            sendJson(response, 403, { message: "Kode akses tidak valid." });
            return;
          }

          failedAttempts.delete(address);
          const token = randomBytes(32).toString("base64url");
          accessTokens.add(token);
          sendJson(response, 200, { token });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Permintaan unlock tidak valid." });
        }
      });

      server.middlewares.use("/__form-config/status", (request, response, next) => {
        if (request.method !== "GET") { next(); return; }
        if (!isSameOriginRequest(request)) { sendJson(response, 403, { unlocked: false }); return; }
        sendJson(response, 200, { unlocked: isLocalRequest(request) || hasUnlockedSession(request) });
      });

      server.middlewares.use("/__form-config/publish", (request, response, next) => {
        if (request.method !== "POST") { next(); return; }
        const allowed = isSameOriginRequest(request) && (isLocalRequest(request) || hasUnlockedSession(request));
        if (!allowed) {
          sendJson(response, 403, { message: "Akses konfigurasi belum dibuka untuk sesi tab ini." });
          return;
        }

        readJsonBody(request)
          .then(async (payload) => {
            const parsed = payload as { domain?: unknown; config?: unknown; note?: unknown };
            const domain = parsed.domain === "IMPORT" || parsed.domain === "EXPORT" ? parsed.domain : null;
            if (!domain || !isDocumentConfigFile(parsed.config)) throw new Error("Struktur konfigurasi publish tidak valid.");
            if (!apiUrl) throw new Error("VITE_FORM_CONFIG_API_URL belum tersedia di server.");
            if (!publishKey) throw new Error("FORM_CONFIG_PUBLISH_KEY belum diatur di .env.local.");

            const separator = apiUrl.includes("?") ? "&" : "?";
            const publishedResponse = await fetch(`${apiUrl}${separator}action=config`, {
              headers: { Accept: "application/json" },
              cache: "no-store",
            });
            const published = await publishedResponse.json().catch(() => null) as PublishedConfigPayload | null;
            if (!publishedResponse.ok || !published?.ok || !published.configs || !isDocumentConfigFile(published.configs.IMPORT) || !isDocumentConfigFile(published.configs.EXPORT)) {
              throw new Error(published?.error || "Konfigurasi published saat ini tidak dapat dimuat.");
            }

            const publishResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8", Accept: "application/json" },
              body: JSON.stringify({
                action: "publish",
                publishKey,
                publishedBy: publishedBy || "INTRANET_CONFIGURATOR",
                note: typeof parsed.note === "string" && parsed.note.trim() ? parsed.note.trim() : `Update konfigurasi ${domain} dari mockup INSW`,
                configs: { ...published.configs, [domain]: parsed.config },
              }),
            });
            const result = await publishResponse.json().catch(() => null) as PublishedConfigPayload | null;
            if (!publishResponse.ok || !result?.ok || !Number.isInteger(result.revision)) {
              throw new Error(result?.error || "Apps Script menolak publish konfigurasi.");
            }

            sendJson(response, 200, {
              revision: result.revision,
              message: `Konfigurasi ${domain === "IMPORT" ? "Impor" : "Ekspor"} revision ${result.revision} berhasil dipublikasikan.`,
            });
          })
          .catch((error) => sendJson(response, 400, { message: error instanceof Error ? error.message : "Konfigurasi gagal dipublikasikan." }));
      });
    },
  };
}

// PENTING (Plan B): alias ini bikin import "@lnsw-ui/react" mengarah ke shim lokal.
// Saat akses registry sudah dapat:
//   1. npm install @lnsw-ui/react
//   2. hapus blok alias di bawah ini
//   3. selesai - semua import di kode tetap sama, langsung pakai DS asli.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: process.env.GITHUB_PAGES === "true" ? "/mockup-sistem-pabean-insw/" : "/",
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
    plugins: [react(), tailwindcss(), formConfigPublisher(
      env.FORM_CONFIG_UNLOCK_CODE ?? "",
      env.VITE_FORM_CONFIG_API_URL ?? "",
      env.FORM_CONFIG_PUBLISH_KEY ?? "",
      env.FORM_CONFIG_PUBLISHED_BY ?? "",
    )],
    resolve: {
      alias: {
        "@lnsw-ui/react": path.resolve(__dirname, "src/ui-shim"),
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
