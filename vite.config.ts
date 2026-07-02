import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// PENTING (Plan B): alias ini bikin import "@lnsw-ui/react" mengarah ke shim lokal.
// Saat akses registry sudah dapat:
//   1. npm install @lnsw-ui/react
//   2. hapus blok alias di bawah ini
//   3. selesai — semua import di kode tetap sama, langsung pakai DS asli.
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/mockup-sistem-pabean-insw/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@lnsw-ui/react": path.resolve(__dirname, "src/ui-shim"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
