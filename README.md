# TEMPO Modular App

Tempo Modular App adalah frontend modular untuk ekosistem **Tempo**  
yang dirancang agar:

- arsitektur **tidak bisa dilanggar**
- kesalahan **ketahuan sebelum push**
- scalable dari **solo developer → multi-dev** tanpa chaos

Proyek ini **mengunci disiplin lewat tooling**, bukan lewat ingatan manusia.

---

## 🚀 Quick Start (30 Minutes Onboarding)

### 1️⃣ Install Dependency
```bash
pnpm install
```

### 2️⃣ Jalankan App
```bash
pnpm dev
```

### 3️⃣ Quality Check (WAJIB)
```bash
node scripts/healthcheck.mjs
```

🔴 Jika healthcheck merah → BERHENTI.  
Tidak boleh lanjut coding sebelum hijau.

---

## 🧭 Golden Rules (ATURAN EMAS)

Aturan ini TIDAK BOLEH DILANGGAR:

❌ Jangan lompat phase  
❌ Jangan bypass script  
❌ Jangan disable lint / TypeScript error  
❌ Jangan "sekalian nambah fitur"  
✅ Kalau merah → berhenti & perbaiki

Semua aturan dijaga otomatis oleh tooling (lokal & CI).

---

## 🧱 Arsitektur Singkat

Flow SATU ARAH dan WAJIB dipatuhi:

```
App
 ↓
Module (index.ts)
 ↓
UI → Store → Service
 ↓
Core (Tempo API)
```

Prinsip penting:

- UI tidak boleh tahu dunia luar
- Store adalah pemilik state
- Service adalah satu-satunya pintu ke Core
- Module tidak boleh saling tahu

Jika flow ini dilanggar → tooling akan menolak.

---

## 🩺 Single Source of Truth

Semua quality gate dijalankan oleh SATU file:

```bash
node scripts/healthcheck.mjs
```

Healthcheck menjalankan:

- audit struktur
- audit import & boundary
- TypeScript check
- ESLint

Aturan keras:

- CI HANYA memirror healthcheck
- ❌ Tidak ada config ganda
- ❌ Tidak ada lint / tsc manual di CI

---

## 📦 Struktur Proyek (Ringkas)

```
src/
├── app/        → wiring & routing
├── modules/    → feature modules (isolated)
├── core/       → infra & Tempo API
├── shared/     → UI & utils stateless
└── scripts/    → guard & automation
```

Setiap module adalah kotak hitam  
dan hanya boleh diekspos lewat `index.ts`.

---

## 📋 Prasyarat

- Node.js 18+ / 20+
- pnpm 8+
- Git

---

## 🛠️ Scripts yang Tersedia

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build

# Quality Assurance
pnpm type-check   # TypeScript check only
pnpm lint         # ESLint only
pnpm audit        # Architecture audit only

# Full healthcheck (WAJIB sebelum commit)
node scripts/healthcheck.mjs
```

---

## 🔧 Konfigurasi CI/CD

Healthcheck otomatis berjalan di CI. Konfigurasi ada di:
- `.github/workflows/healthcheck.yml` (untuk GitHub Actions)

**Catatan Penting**:  
CI hanya menjalankan `node scripts/healthcheck.mjs` dan tidak punya konfigurasi tambahan.

---

## 🚨 Troubleshooting

### Healthcheck gagal?
1. Cek error message dari healthcheck
2. Pastikan tidak ada import ilegal antar module
3. Pastikan TypeScript tidak ada error
4. Pastikan struktur folder sesuai aturan

### Module tidak terdeteksi?
1. Pastikan module punya `index.ts`
2. Pastikan export hanya melalui `index.ts`
3. Pastikan tidak ada circular dependency

---

## 📚 Dokumentasi Lengkap

Untuk dokumentasi detail tentang:
- Struktur module
- Aturan import/export
- Konfigurasi tambahan
- Best practices

Silakan buka `docs/ARCHITECTURE.md` di dalam proyek.

---

## 🤝 Kontribusi

1. Clone repository
2. Jalankan `pnpm install`
3. Pastikan healthcheck **Hijau**
4. Buat branch baru dari `main`
5. Develop dengan aturan arsitektur
6. Test dengan healthcheck
7. Buat Pull Request

**Setiap PR akan otomatis di-check oleh healthcheck**

---

## 📄 Lisensi

Proyek ini menggunakan lisensi proprietary.  
Hak cipta © 2024 Tim Tempo.

---

## 🆘 Support

Jika menemui masalah:
1. Cek `docs/FAQ.md`
2. Cek error message healthcheck
3. Hubungi tim arsitektur

**Ingat**: Tidak ada jalan pintas.  
**Healthcheck hijau = jalan aman**.