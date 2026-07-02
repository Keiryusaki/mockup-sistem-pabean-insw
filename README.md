# LNSW Mockup App (Plan B — shim @lnsw-ui)

Starter app React untuk **bikin mockup/layout** sebagai acuan FE, sambil menunggu
akses ke registry Design System asli (`@lnsw-ui/react`).

Komponen di folder `src/ui-shim/` adalah **tiruan sementara** yang nama & prop-nya
dibuat semirip mungkin dengan DS asli, memakai **design token resmi** (warna brand
`#0353a4`, kuning `#ffb300`, font IBM Plex Sans) yang diekstrak dari Storybook DS.

## Jalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # cek build produksi
```

## Stack

- React 19 + TypeScript
- Vite 6
- TanStack Router (routing antar halaman — samain dengan demo DS)
- Tailwind CSS v4 (token DS di `src/styles.css`)

## Struktur

```
src/
  ui-shim/index.tsx     # SHIM @lnsw-ui (sementara — dibuang saat pakai DS asli)
  styles.css            # design token DS (Tailwind @theme)
  components/AppLayout   # shell: sidebar + header + content
  pages/                # contoh halaman mockup (Dashboard, Data, Form, Loading)
  router.tsx            # definisi route
```

## ➡️ Migrasi ke DS asli (saat registry sudah dapat)

Karena import di seluruh kode sudah memakai bentuk asli
(`import { Button } from "@lnsw-ui/react"`), migrasi cuma 3 langkah:

1. Buat file `.npmrc` di root (isi dari tim DevOps), lalu:
   ```bash
   npm install @lnsw-ui/react
   ```
2. Hapus blok `alias` `@lnsw-ui/react` di **`vite.config.ts`** dan path-nya di **`tsconfig.json`**.
3. Hapus folder **`src/ui-shim/`**. Selesai — semua halaman langsung pakai komponen DS asli.

> Catatan: detail kecil (nama prop persis, perlu/tidaknya import CSS DS) dikonfirmasi
> dari `package.json` package asli atau tab "Show code" di Storybook saat akses didapat.

## Yang masih perlu ditanyakan ke tim DS/DevOps

1. URL registry privat + token (`.npmrc`)
2. Versi React yang didukung (peer dependency)
3. Cara setup wajib: `<ThemeProvider>`, import CSS, FontLoader
