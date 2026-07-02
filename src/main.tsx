import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@lnsw-ui/react";
import { router } from "./router";
import "./styles.css";

const ACCESS_KEY = "insw-pages-access";
const ACCESS_CODE = import.meta.env.VITE_PAGES_ACCESS_CODE?.trim() || "M0ckup#insw2026";
const REQUIRES_PASSKEY = import.meta.env.VITE_REQUIRE_PASSKEY === "true";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isProtectedHost(hostname: string) {
  return hostname.endsWith("github.io") || hostname.endsWith("githubusercontent.com");
}

function canBypassGate() {
  if (typeof window === "undefined") return true;
  if (!REQUIRES_PASSKEY) return true;
  if (isLocalHost(window.location.hostname)) return true;
  if (!isProtectedHost(window.location.hostname)) return true;
  return window.localStorage.getItem(ACCESS_KEY) === "unlocked";
}

function mountApp() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

function renderPasskeyGate() {
  const root = document.getElementById("root");
  if (!root) {
    return;
  }

  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "24px";
  overlay.style.background = "rgba(2, 6, 23, 0.82)";
  overlay.style.backdropFilter = "blur(12px)";

  overlay.innerHTML = `
    <div style="width:min(520px, 100%); border-radius:28px; border:1px solid rgba(255,255,255,.7); background:#fff; padding:24px; box-shadow:0 32px 90px rgba(15,23,42,.38); font-family:IBM Plex Sans, sans-serif;">
      <div style="display:flex; gap:16px; align-items:flex-start;">
        <div style="width:48px; height:48px; border-radius:16px; display:flex; align-items:center; justify-content:center; background:#082d69; color:#fff; flex:0 0 auto;">
          <svg aria-hidden="true" viewBox="0 0 24 24" style="width:24px; height:24px; fill:currentColor">
            <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.732V19h-2v-2.268A2 2 0 0 1 12 13Z"></path>
          </svg>
        </div>
        <div>
          <div style="font-size:24px; font-weight:600; line-height:1.2; color:#1f2937;">Akses Terbatas</div>
          <div style="margin-top:6px; font-size:12px; line-height:1.6; color:#4b5563;">Masukkan passkey untuk membuka halaman publik mockup ini.</div>
        </div>
      </div>
      <form id="passkey-form" style="margin-top:24px;">
        <label style="display:block;">
          <span style="display:block; margin-bottom:8px; font-size:12px; font-weight:500; color:#374151;">Passkey</span>
          <input id="passkey-input" type="password" autocomplete="current-password" placeholder="Masukkan passkey" style="width:100%; height:44px; border:1px solid #d1d5db; border-radius:6px; padding:0 12px; font-size:12px; outline:none; box-sizing:border-box;" />
        </label>
        <p id="passkey-error" style="display:none; margin-top:8px; color:#dc2626; font-size:12px; font-weight:500;">Passkey salah. Coba lagi.</p>
        <p style="margin-top:8px; color:#6b7280; font-size:12px; line-height:1.6;">Akses lokal tidak dibatasi. Di GitHub Pages, halaman akan terkunci sampai passkey benar.</p>
        <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px;">
          <button type="button" id="passkey-reset" style="height:44px; padding:0 16px; border-radius:6px; border:1px solid #d1d5db; background:#fff; color:#374151; font-size:12px; font-weight:500; cursor:pointer;">Reset</button>
          <button type="submit" style="height:44px; padding:0 16px; border-radius:6px; border:0; background:#082d69; color:#fff; font-size:12px; font-weight:600; cursor:pointer;">Buka Akses</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector<HTMLFormElement>("#passkey-form");
  const input = overlay.querySelector<HTMLInputElement>("#passkey-input");
  const error = overlay.querySelector<HTMLParagraphElement>("#passkey-error");
  const resetButton = overlay.querySelector<HTMLButtonElement>("#passkey-reset");

  const unlock = () => {
    window.localStorage.setItem(ACCESS_KEY, "unlocked");
    overlay.remove();
    mountApp();
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if ((input?.value ?? "").trim() === ACCESS_CODE) {
      unlock();
      return;
    }

    if (error) {
      error.style.display = "block";
    }
  });

  resetButton?.addEventListener("click", () => {
    window.localStorage.removeItem(ACCESS_KEY);
    if (input) input.value = "";
    if (error) error.style.display = "none";
    input?.focus();
  });

  document.body.appendChild(overlay);
  input?.focus();
}

if (canBypassGate()) {
  mountApp();
} else {
  renderPasskeyGate();
}
