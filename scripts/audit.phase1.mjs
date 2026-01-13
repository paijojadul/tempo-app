#!/usr/bin/env node
/**
 * AUDIT PHASE 1 — FEATURE SKELETON
 *
 * Phase 1 = BENTUK, BUKAN ISI
 * ❌ NO business logic
 * ❌ NO async real
 * ❌ NO core usage
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const MODULES = path.join(SRC, 'modules')

let hasError = false

function fail(msg) {
  console.error(`❌ ${msg}`)
  hasError = true
}

function pass(msg) {
  console.log(`✅ ${msg}`)
}

function exists(p) {
  return fs.existsSync(p)
}

function read(p) {
  return fs.readFileSync(p, 'utf8')
}

/* -------------------------------------------------- */
/* 1. MODULES DIRECTORY HARUS ADA                      */
/* -------------------------------------------------- */

if (!exists(MODULES)) {
  fail('src/modules tidak ditemukan')
} else {
  pass('src/modules ditemukan')
}

const moduleNames = fs.readdirSync(MODULES).filter((name) =>
  fs.statSync(path.join(MODULES, name)).isDirectory()
)

if (moduleNames.length === 0) {
  fail('Tidak ada module sama sekali di src/modules')
} else {
  pass(`Module terdeteksi: ${moduleNames.join(', ')}`)
}

/* -------------------------------------------------- */
/* 2. STRUKTUR WAJIB TIAP MODULE                       */
/* -------------------------------------------------- */

const REQUIRED_FILES = [
  'index.ts',
  'ui.tsx',
  'store.ts',
  'service.ts',
  'types.ts',
]

for (const mod of moduleNames) {
  const modPath = path.join(MODULES, mod)

  for (const file of REQUIRED_FILES) {
    if (!exists(path.join(modPath, file))) {
      fail(`Module "${mod}" kehilangan file wajib: ${file}`)
    }
  }
}

pass('Semua module punya struktur file wajib')

/* -------------------------------------------------- */
/* 3. UI HARUS BODOH                                  */
/* -------------------------------------------------- */

for (const mod of moduleNames) {
  const uiFile = path.join(MODULES, mod, 'ui.tsx')
  const content = read(uiFile)

  if (
    content.includes('useEffect') ||
    content.includes('fetch') ||
    content.includes('async') ||
    content.includes('core/') ||
    content.includes('service')
  ) {
    fail(`UI tidak boleh punya logic / service / core: ${uiFile}`)
  }
}

pass('UI bersih & render-only')

/* -------------------------------------------------- */
/* 4. STORE HARUS MINIMAL                             */
/* -------------------------------------------------- */

for (const mod of moduleNames) {
  const storeFile = path.join(MODULES, mod, 'store.ts')
  const content = read(storeFile)

  if (
    content.includes('async') ||
    content.includes('fetch') ||
    content.includes('then(') ||
    content.includes('core/') ||
    content.includes('service')
  ) {
    fail(`Store Phase 1 harus tanpa async / service: ${storeFile}`)
  }
}

pass('Store hanya state minimal')

/* -------------------------------------------------- */
/* 5. SERVICE HARUS DUMMY                             */
/* -------------------------------------------------- */

for (const mod of moduleNames) {
  const serviceFile = path.join(MODULES, mod, 'service.ts')
  const content = read(serviceFile)

  if (
    content.includes('fetch(') ||
    content.includes('axios') ||
    content.includes('rpc') ||
    content.includes('core/')
  ) {
    fail(`Service Phase 1 tidak boleh pakai API real: ${serviceFile}`)
  }
}

pass('Service hanya placeholder')

/* -------------------------------------------------- */
/* 6. INDEX.TS HANYA BOLEH EXPOSE PUBLIK               */
/* -------------------------------------------------- */

for (const mod of moduleNames) {
  const indexFile = path.join(MODULES, mod, 'index.ts')
  const content = read(indexFile)

  if (
    content.includes('./store') ||
    content.includes('./service')
  ) {
    fail(`index.ts tidak boleh expose store/service: ${indexFile}`)
  }
}

pass('Public API module aman')

/* -------------------------------------------------- */
/* FINAL RESULT                                      */
/* -------------------------------------------------- */

if (hasError) {
  console.error('\n🚨 AUDIT PHASE 1 — FAILED')
  console.error('Phase 1 harus BERSIH sebelum lanjut.')
  process.exit(1)
} else {
  console.log('\n🏁 AUDIT PHASE 1 — PASS')
  console.log('Feature skeleton aman & siap lanjut Phase 2.')
}
