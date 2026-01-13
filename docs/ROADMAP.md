# 🧭 TEMPO GLOBAL ROADMAP
_(Single Source of Truth)_

Dokumen ini adalah **PETA RESMI** pengembangan TEMPO Modular App.

❌ Tidak ada roadmap lain  
❌ Tidak ada “kata bang katanya”  
❌ Tidak ada interpretasi bebas  

Jika bertentangan dengan dokumen ini → **SALAH**.

---

## 🎯 Tujuan Roadmap

- Menjaga **disiplin pengembangan**
- Mencegah **scope creep**
- Memastikan setiap fase **punya arti**
- Memungkinkan scale ke **multi-dev tanpa chaos**

---

## 🟢 STATUS SAAT INI

```

ACTIVE PHASE : PHASE 5 — SCALE READINESS
STATUS       : COMPLETED & LOCKED

```

Semua Phase ≤ 5 **TIDAK BOLEH DIUBAH** kecuali lewat Phase khusus governance.

---

## 🧱 PRINSIP GLOBAL (BERLAKU UNTUK SEMUA PHASE)

- ❌ Tidak boleh lompat phase
- ❌ Tidak boleh bypass tooling
- ❌ Tidak boleh menambah fitur di phase lock
- ✅ Healthcheck = keputusan final
- ✅ Script > manusia

---

## 📦 PHASE 0 — PROJECT FOUNDATION (LOCKED)

**Fokus:**
- Setup tooling dasar
- Repo structure awal
- Build system

**Status:** ✅ DONE — LOCKED

---

## 📦 PHASE 1 — STRUCTURAL DISCIPLINE (LOCKED)

**Fokus:**
- Struktur folder final
- Layer separation
- Module isolation

**Status:** ✅ DONE — LOCKED

---

## 📦 PHASE 2 — BOUNDARY & IMPORT CONTROL (LOCKED)

**Fokus:**
- Aturan import/export
- Module boundary enforcement
- no-restricted-imports

**Status:** ✅ DONE — LOCKED

---

## 📦 PHASE 3 — STATE & FLOW NORMALIZATION (LOCKED)

**Fokus:**
- Store pattern konsisten
- Async state standard
- Service → Core flow

**Status:** ✅ DONE — LOCKED

---

## 📦 PHASE 4 — QUALITY HARDENING (LOCKED)

**Fokus:**
- TypeScript strictness
- ESLint hard rules
- No bypass policy

**Guard Aktif:**
- exactOptionalPropertyTypes
- noImplicitOverride
- noUncheckedIndexedAccess
- Audit Phase 4 Script

**Status:** ✅ DONE — LOCKED

---

## 🚀 PHASE 5 — SCALE READINESS (LOCKED)

**Tujuan Utama:**
Dev baru bisa masuk **tanpa bisa merusak sistem**.

### Day Breakdown:
- ✅ Day 1 — Architecture & Rule Documentation
- ✅ Day 2 — Anti-Patterns (Dosa Fatal)
- ✅ Day 3 — Dependency Visibility
- ✅ Day 4 — Automated Guard & Prevention
- ✅ Day 5 — Contributor Flow & Lock System

**Artefak Wajib:**
- README.md (Onboarding 30 menit)
- docs/ARCHITECTURE.md
- docs/ANTI_PATTERNS.md
- docs/CONTRIBUTING.md
- scripts/healthcheck.mjs
- scripts/dependency.graph.mjs

**Status:** ✅ COMPLETED — LOCKED

---

## 🧪 PHASE 6 — SAFE FEATURE PLAYGROUND (BELUM DIMULAI)

**Fokus:**
- Menambah fitur dengan guard aktif
- Tidak boleh merusak Phase 0–5
- Semua perubahan harus lolos healthcheck

**Aturan Keras:**
- ❌ Tidak boleh melemahkan tooling
- ❌ Tidak boleh ubah arsitektur dasar
- ✅ Feature harus lewat module resmi

**Status:** ⏳ NOT STARTED

---

## 🧠 PHASE 7 — OPTIMIZATION & EXPANSION (FUTURE)

**Fokus (opsional):**
- Performance
- DX improvement
- Plugin / extension system

**Status:** 💤 FUTURE

---

## 🔒 PHASE LOCK RULES

Jika phase **LOCKED**:
- ❌ Tidak boleh edit file phase tersebut
- ❌ Tidak boleh refactor ulang
- ❌ Tidak boleh reinterpretasi aturan

Pelanggaran → **PR AUTO DITOLAK**

---

## 🧠 RULE OF THUMB

> Jika ragu:
> - Cek roadmap
> - Cek healthcheck
> - Anggap salah

---

**Last Updated:** Phase 5 — Completed  
**Enforcement:** `scripts/healthcheck.mjs`  
**Authority:** Tooling & Docs (NOT humans)
