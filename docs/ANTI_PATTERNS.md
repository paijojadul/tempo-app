# ❌ ANTI PATTERNS — DOSA FATAL TEMPO APP
_(Phase 5 — Scale Readiness)_

Dokumen ini berisi **kesalahan yang TIDAK BOLEH TERJADI**.

Jika salah satu item di bawah ditemukan:
🛑 **STOP DEVELOPMENT**
🛑 **FIX DULU**
🛑 **TIDAK BOLEH PUSH**

Ini bukan opini.  
Ini **aturan sistem**.

---

## 1️⃣ UI Import Core

❌ Contoh Salah:
```typescript
import { tempoClient } from '@/core/tempo'
```

🧨 **Alasan Fatal:**
- UI jadi tahu dunia luar
- Melanggar isolasi layer
- Tidak scalable

✅ **Yang Benar:**
```
UI → Store → Service → Core
```

---

## 2️⃣ Logic Bisnis di Component UI

❌ Contoh Salah:
```typescript
// Di dalam React component
const fetchData = async () => {
  const response = await fetch('...');
  const data = await response.json();
  // Transformasi kompleks di sini
  const processed = data.map(item => heavyTransformation(item));
  setState(processed);
}
```

🧨 **Alasan Fatal:**
- Tidak bisa dites
- Sulit di-maintain
- Bocor ke presentational layer

✅ **Yang Benar:**
Logic ada di Store / Service

---

## 3️⃣ Bypass Type System

❌ Contoh **DILARANG**:
```typescript
as any
// @ts-ignore
// @ts-expect-error (tanpa alasan valid)
const value: any = unsafeData;
const casted = value as unknown as MyType;
```

🧨 **Alasan Fatal:**
- Merusak kontrak sistem
- Error tersembunyi
- CI jadi tidak bermakna

---

## 4️⃣ Deep Import Module Lain

❌ Contoh Salah:
```typescript
import { something } from '@/modules/payment/internal/file'
import { helper } from '@/modules/auth/utils/secret'
```

🧨 **Alasan Fatal:**
- Bypass public API
- Boundary rusak
- Tidak bisa dikontrol tooling

✅ **Yang Benar:**
```typescript
import { something } from '@/modules/payment'
import { helper } from '@/modules/auth'
```

---

## 5️⃣ Menambah Feature di Phase Lock

❌ Contoh Salah:
- "Sekalian nambah dikit"
- "Ini kecil kok"
- "Biar sekalian rapi"
- "Kan cuma satu komponen"
- "Fitur kecil, ngga ngaruh"

🧨 **Alasan Fatal:**
- Merusak roadmap
- Phase jadi tidak bermakna
- Chaos jangka panjang
- Scope creep tidak terkontrol

---

## 6️⃣ Module Saling Bergantung (Circular)

❌ Contoh Salah:
```
modules/auth → modules/user → modules/auth
modules/payment → modules/invoice → modules/payment
```

🧨 **Alasan Fatal:**
- Testing impossible
- Deployment risk tinggi
- Refactoring nightmare

✅ **Yang Benar:**
Gunakan shared layer atau core utilities

---

## 7️⃣ State Management di Tempat Salah

❌ Contoh Salah:
```typescript
// Global state di localStorage langsung dari UI
localStorage.setItem('user', JSON.stringify(userData));

// State singleton di file biasa
export const globalState = {};

// Context untuk segala hal
```

🧨 **Alasan Fatal:**
- Tidak predictable
- Side effect tidak terkontrol
- Debugging impossible

✅ **Yang Benar:**
Gunakan Store layer yang sudah ditentukan

---

## 8️⃣ Hardcode Konfigurasi

❌ Contoh Salah:
```typescript
const API_URL = 'https://production-api.com';
const SECRET_KEY = 'abc123';
```

🧨 **Alasan Fatal:**
- Security risk
- Environment tidak terpisah
- Deployment rigid

✅ **Yang Benar:**
Gunakan environment variables melalui config service

---

## 9️⃣ Ignore Healthcheck Warning

❌ Contoh Salah:
- "Nanti aja difix"
- "Ini warning doang"
- "Masih jalan kok"
- "Cuma import kecil"

🧨 **Alasan Fatal:**
- Technical debt menumpuk
- Tooling kehilangan trust
- Culture discipline hancur

---

## 🔟 Manual Hack di Build Process

❌ Contoh Salah:
- Edit file build manual
- Modify dist folder
- Copy-paste compiled code
- Hotfix langsung di production bundle

🧨 **Alasan Fatal:**
- Tidak reproducible
- Version mismatch
- Debugging impossible

---

## 🚨 PATTERN DETEKSI OTOMATIS

Healthcheck akan **TOLAK** jika menemukan:

```
✅ Import ilegal lintas layer
✅ TypeScript bypass
✅ Circular dependency  
✅ Missing index.ts export
✅ Hardcoded secret (pattern matching)
✅ UI dengan logic kompleks (> 50 lines)
✅ Component dengan side effect
✅ Module dengan internal export leak
```

---

## ⚖️ HUKUMAN OTOMATIS

**Level 1: Warning** (Healthcheck kuning)
- Masih bisa dev lokal
- CI akan reject

**Level 2: Block** (Healthcheck merah)
- `pnpm dev` tidak jalan
- Git hook reject commit
- CI fail total

**Level 3: Nuclear** (Pattern berulang)
- Repository lock
- Mandatory code review
- Phase regression

---

## 🆘 BUKAN ANTI-PATTERN

Ini **BOLEH** dan **NORMAL**:

```typescript
// Utility di shared
import { formatCurrency } from '@/shared/utils';

// Type dari core
import type { TempoResponse } from '@/core/types';

// UI component dari shared
import { Button } from '@/shared/ui';

// Service dari module sendiri
import { userService } from './services';
```

---

## 🔒 PENUTUP

Jika ragu:
➡️ Anggap SALAH  
➡️ Cek healthcheck  
➡️ Tanya dokumen, bukan orang  
➡️ Rule of thumb: **"Jika merasa hacky, itu anti-pattern"**

**Sistem > Individu**  
**Disiplin > Kreativitas**  
**Consistency > Cleverness**

---
**Last Updated:** Phase 5 — Scale Readiness  
**Enforcement:** Automated via `scripts/healthcheck.mjs`