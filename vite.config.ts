import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { writeFile } from "node:fs/promises";
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

function localFormConfigWriter(unlockCode: string): Plugin {
  const accessTokens = new Set<string>();
  const failedAttempts = new Map<string, { count: number; resetAt: number }>();

  const readBearerToken = (request: IncomingMessage) => {
    const authorization = request.headers.authorization ?? "";
    return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  };
  const hasUnlockedSession = (request: IncomingMessage) => accessTokens.has(readBearerToken(request));

  return {
    name: "local-form-config-writer",
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

      server.middlewares.use("/__form-config/apply", (request, response, next) => {
        if (request.method !== "POST") { next(); return; }
        const allowed = isSameOriginRequest(request) && (isLocalRequest(request) || hasUnlockedSession(request));
        if (!allowed) {
          sendJson(response, 403, { message: "Akses konfigurasi belum dibuka untuk sesi tab ini." });
          return;
        }

        readJsonBody(request)
          .then(async (payload) => {
            const parsed = payload as { version?: unknown; documents?: unknown };
            if (!Number.isInteger(parsed.version) || !Array.isArray(parsed.documents)) throw new Error("Struktur konfigurasi tidak valid.");
            const target = path.resolve(__dirname, "src/form-config/document-configs.json");
            await writeFile(target, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
            sendJson(response, 200, { message: "Konfigurasi berhasil ditulis ke src/form-config/document-configs.json." });
          })
          .catch((error) => sendJson(response, 400, { message: error instanceof Error ? error.message : "Konfigurasi tidak valid." }));
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
    plugins: [react(), tailwindcss(), localFormConfigWriter(env.FORM_CONFIG_UNLOCK_CODE ?? "")],
    resolve: {
      alias: {
        "@lnsw-ui/react": path.resolve(__dirname, "src/ui-shim"),
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
