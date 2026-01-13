# QUALITY RULES — TEMPO APP
_(Phase 4 — Final Lock)_

Dokumen ini mendefinisikan aturan kualitas FINAL.
Semua aturan di sini **SUDAH di-enforce oleh tooling**.

Jika melanggar → CI akan gagal.

---

## 🧭 PRINSIP UTAMA

- Tidak ada perbedaan antara lokal dan CI
- Healthcheck adalah satu-satunya quality gate
- Semua aturan di bawah ini sudah berjalan otomatis

---

## 🩺 SINGLE SOURCE OF TRUTH

### Healthcheck
File: `scripts/healthcheck.mjs`

CI dan lokal **WAJIB** menjalankan file ini.

Tidak boleh:
- menjalankan lint / tsc / audit secara terpisah
- menduplikasi logic di CI

---

## 🧱 STRUKTUR PROYEK

Aturan struktur diverifikasi oleh healthcheck:

- `src/core/` → logic inti & store
- `src/modules/<module>/index.ts` → public API module
- `src/shared/` → UI & util reusable

Tidak boleh:
- import lintas module tanpa index.ts
- bypass boundary

---

## 📦 IMPORT & BOUNDARY

- Semua import harus melewati public API (`index.ts`)
- Tidak boleh deep import ke file internal module lain
- Boundary divalidasi otomatis

---

## 🧪 TYPESCRIPT & LINT

- TypeScript & ESLint dijalankan via healthcheck
- Tidak ada mode skip
- Warning dianggap bagian dari kualitas

---

## 🚦 CI RULES

- CI menjalankan `node scripts/healthcheck.mjs`
- Node version CI = Node lokal
- CI tidak lebih longgar dari lokal

---

## 🔒 FINALITY

Setelah Phase 4:
- perubahan aturan kualitas harus lewat Phase baru
- tidak boleh “sedikit saja” melonggarkan rule

Dokumen ini adalah **FINAL LOCK** Phase 4.
