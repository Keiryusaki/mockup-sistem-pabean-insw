import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function resolvePath(inputPath) {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(moduleDir, "..", inputPath);
}

export async function readMirrorFile(filePath) {
  const resolved = resolvePath(filePath);
  if (!resolved) return [];

  try {
    const raw = await fs.readFile(resolved, "utf8");
    const payload = JSON.parse(raw);
    return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export async function writeMirrorFile(filePath, payload) {
  const resolved = resolvePath(filePath);
  if (!resolved) return;

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function pushMirrorFeed(url, payload) {
  if (!url) return;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Mirror push failed: HTTP ${response.status}`);
  }
}
