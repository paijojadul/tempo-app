# 🤝 CONTRIBUTING — TEMPO MODULAR APP
_(Phase 5 — Scale Readiness)_

Dokumen ini adalah **SATU-SATUNYA aturan kontribusi**.  
Tidak ada aturan lisan. Tidak ada asumsi.

Jika melanggar → **PR AUTO DITOLAK**.

---

## 🎯 Tujuan

- Dev baru bisa kontribusi tanpa merusak sistem
- Semua keputusan berbasis **aturan tertulis**
- Tooling menggantikan debat manusia

---

## 🌿 Branching Rules (WAJIB)

- Semua kerja **HARUS** dari branch baru
- **DILARANG** commit langsung ke `main`

```bash
git checkout -b feat/nama-fitur
git checkout -b fix/nama-perbaikan
````

❌ Branch tanpa prefix jelas → PR ditolak

---

## 🩺 Wajib Sebelum Commit / Push

JALANKAN:

```bash
node scripts/healthcheck.mjs
```

Aturan keras:

* 🔴 Healthcheck merah → **STOP**
* 🟢 Healthcheck hijau → **BOLEH PUSH**

CI hanya memirror hasil ini.

---

## 🧱 Aturan Edit Berdasarkan Layer

### ✅ BOLEH

* UI → edit UI sendiri
* Module → edit module sendiri
* Core → hanya jika task eksplisit
* Shared → hanya stateless util / UI

### ❌ DILARANG

* UI import Core langsung
* Module saling import
* Deep import module lain
* Logic bisnis di component

Detail lihat: `docs/ANTI_PATTERNS.md`

---

## 🔒 Phase Lock Rules

Saat Phase aktif:

* ❌ Tidak boleh tambah fitur
* ❌ Tidak boleh ubah behavior bisnis
* ❌ Tidak boleh refactor besar

Phase 5 = **mengunci cara kerja**, bukan nambah isi.

---

## 🚫 PR AUTO DITOLAK JIKA:

* Healthcheck gagal
* Melanggar arsitektur
* Bypass TypeScript / ESLint
* “Sekalian nambah dikit”
* Tidak sesuai phase aktif

Tidak ada debat.
Tooling = keputusan final.

---

## 📋 Checklist Sebelum PR

* [ ] Healthcheck hijau
* [ ] Tidak ada bypass
* [ ] Tidak lintas module
* [ ] Tidak melanggar phase

---

## 🧠 Prinsip Inti

> **Manusia boleh salah, sistem tidak.**

Jika ragu:

* Anggap salah
* Cek healthcheck
* Baca dokumen, bukan tanya orang

---
