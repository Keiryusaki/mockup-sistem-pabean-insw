import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);
const feedPath = path.isAbsolute(process.env.MIRROR_FEED_FILE || "")
  ? process.env.MIRROR_FEED_FILE
  : path.resolve(moduleDir, process.env.MIRROR_FEED_FILE || "./feedback-feed.json");

async function readFeed() {
  try {
    const raw = await fs.readFile(feedPath, "utf8");
    const payload = JSON.parse(raw);
    return payload && typeof payload === "object" ? payload : { generatedAt: new Date().toISOString(), items: [] };
  } catch {
    return { generatedAt: new Date().toISOString(), items: [] };
  }
}

async function writeFeed(payload) {
  await fs.mkdir(path.dirname(feedPath), { recursive: true });
  await fs.writeFile(feedPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, feedPath, port });
    return;
  }

  if (req.url === "/feedback-feed.json") {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.method === "GET") {
      const payload = await readFeed();
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const payload = JSON.parse(body || "{}");
          await writeFeed(payload);
          sendJson(res, 200, { ok: true, saved: true });
        } catch (error) {
          sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" });
        }
      });
      return;
    }
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(port, () => {
  console.log(`Feedback mirror listening on http://localhost:${port}`);
  console.log(`Feed file: ${feedPath}`);
});
