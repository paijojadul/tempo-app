#!/usr/bin/env node
/**
 * AUDIT PHASE 6 — PRODUCT EVOLUTION
 *
 * Guard terakhir sebelum sistem jadi liar.
 * Phase 6 boleh eksperimen, TAPI:
 * - Tidak boleh merusak Phase 0–5
 * - Tidak boleh ada eksperimen yatim
 * - Tidak boleh ada logic bocor ke UI
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')

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
/* 1. CORE FLAGS SYSTEM                               */
/* -------------------------------------------------- */

const FLAGS_DIR = path.join(SRC, 'core', 'flags')

if (!exists(FLAGS_DIR)) {
  fail('core/flags tidak ditemukan (Phase 6 wajib punya feature flags)')
} else {
  pass('Feature flags directory ada')
}

const FLAGS_FILE = path.join(FLAGS_DIR, 'flags.ts')

if (!exists(FLAGS_FILE)) {
  fail('flags.ts tidak ditemukan')
} else {
  const content = read(FLAGS_FILE)

  if (!content.includes('export const flags')) {
    fail('flags.ts tidak mendefinisikan `export const flags`')
  } else {
    pass('flags.ts valid')
  }
}

/* -------------------------------------------------- */
/* 2. FLAG TIDAK BOLEH MENGUBAH STRUKTUR STORE         */
/* -------------------------------------------------- */

function scanForDangerousFlagUsage(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanForDangerousFlagUsage(full)
    }

    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = read(full)

      if (
        content.includes('flags.') &&
        content.match(/create\(|setState\(|useStore\(/)
      ) {
        fail(`Feature flag memodifikasi store structure di ${full}`)
      }
    }
  }
}

scanForDangerousFlagUsage(path.join(SRC, 'modules'))

pass('Tidak ada flag yang mengubah struktur store')

/* -------------------------------------------------- */
/* 3. CACHE HANYA BOLEH DI CORE                       */
/* -------------------------------------------------- */

function scanCacheMisuse(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanCacheMisuse(full)
    }

    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = read(full)

      if (
        content.includes('cache.') &&
        !full.includes('/core/')
      ) {
        fail(`Cache digunakan di luar core: ${full}`)
      }
    }
  }
}

scanCacheMisuse(SRC)
pass('Cache hanya digunakan di core')

/* -------------------------------------------------- */
/* 4. TIDAK ADA DEAD / EXPERIMENT FLAG                */
/* -------------------------------------------------- */

if (exists(FLAGS_FILE)) {
  const content = read(FLAGS_FILE)

  const unusedFlags = content
    .split('\n')
    .filter(line => line.includes(': false'))
    .map(line => line.trim())

  if (unusedFlags.length > 5) {
    fail('Terlalu banyak feature flag mati — bersihkan eksperimen gagal')
  } else {
    pass('Feature flag terkendali')
  }
}

/* -------------------------------------------------- */
/* 5. UI TIDAK BOLEH IMPOR CORE LANGSUNG               */
/* -------------------------------------------------- */

function scanUIViolation(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanUIViolation(full)
    }

    if (file.endsWith('.tsx')) {
      const content = read(full)

      if (content.includes("from '@/core'")) {
        fail(`UI mengimpor core langsung: ${full}`)
      }
    }
  }
}

scanUIViolation(path.join(SRC, 'modules'))
pass('UI tidak melanggar boundary')

/* -------------------------------------------------- */
/* FINAL RESULT                                      */
/* -------------------------------------------------- */

if (hasError) {
  console.error('\n🚨 AUDIT PHASE 6 — FAILED')
  process.exit(1)
} else {
  console.log('\n🏁 AUDIT PHASE 6 — PASS')
  console.log('Phase 6 aman: eksperimen terkendali, arsitektur tetap utuh.')
}
