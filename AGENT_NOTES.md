# Project Notes

Short guide for future contributors and agents working in this repo.

## Purpose

This project is a local mockup / clone of the INSW design system and internal flows.
It is focused on:

- component reuse
- visual consistency with the client DS
- local validation of UI patterns before they are copied into mockups or forms

## How To Run

- `npm install`
- `npm run dev`
- `npm run build`

## Main Routes

- `/` Dashboard
- `/data` Data Pengajuan
- `/form` Form Pengajuan
- `/component` Local component docs
- `/icon` Icon library preview
- `/loading` Loading state

## Important Local Components

- `src/components/Button.tsx`
  - reusable `Button` and `IconButton`
  - class-based variants such as primary, secondary, accent, outline, ghost, error

- `src/components/FormControls.tsx`
  - local `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
  - select supports searchable and clearable modes
  - input supports warning and error states

- `src/components/Surface.tsx`
  - local `Card` and `Modal` primitives

- `src/components/Icons.tsx`
  - shared icon set used across pages

## Design Direction

- Use the local components first before adding raw Tailwind classes.
- Prefer `insw-*` component styles when building new UI.
- Keep buttons, inputs, select, modal, badge-like chips, and cards consistent with the local docs.
- Use semantic tokens for states:
  - success
  - warning
  - error
  - info

## Current UX Priorities

- Dashboard hero CTA should stay prominent and consistent with the dark-blue primary card style.
- Data Pengajuan and Form Pengajuan should keep using local controls for common actions.
- Live docs should remain the source of truth for visual checks.
- Icon browsing is handled in `/icon`, which loads from `public/iconhtml.txt`.
- A floating `Masukan` widget is now planned for internal feedback.
  - It should stay as a right-bottom floating action.
  - It submits directly to a Discord webhook.
  - It supports pasted clipboard images and file uploads.
  - It requires a simple math answer before submit.

## Work Phases

- Perubahan Pertama is closed as of 2026-07-06 12:00 local time.
- Any request after that cutoff belongs to Perubahan Kedua.
- Keep changelog and future implementation notes grouped by phase so the next agent can pick up context quickly.

## Current Upload Flow Notes

- The old step pills for upload/validation were removed from the modal UI.
- Upload flow is now split internally into:
  - upload stage
  - data parsing stage
- Upload stage should stay lean:
  - download template button is active
  - OCR upload cards keep the add button at the bottom
  - `Lewati Upload` goes directly to the form
  - `Lanjut ke Data Parsing` stays disabled while any file is selected but not uploaded
- Upload Excel has two visual modes:
  - `baru` and `copy` show direct `Upload Data Barang`
  - `upload template` shows `Download Template Excel` plus `Upload Template Excel`
- Parsing stage uses a single summary card titled `Ringkasan sumber data`.
- Prefer the label `Data Parsing` over `Validasi Data` for this step.

## Notes For Future Edits

- Keep changes local to the existing app unless new shared primitives are clearly reusable.
- When adding a repeated UI pattern, consider creating a local component in `src/components/` first.
- Reuse existing route-level layouts and avoid introducing new wrapper layers unless they solve a real spacing or consistency issue.
