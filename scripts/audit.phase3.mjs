#!/usr/bin/env node
/**
 * AUDIT PHASE 3 — CORE & API INTEGRATION
 *
 * Phase 3 = plumbing & boundary
 * ❌ NO business semantics
 * ❌ NO UI touching core
 * ❌ NO store logic enrichment
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
/* 1. CORE TEMPO HARUS ADA & BERSIH                    */
/* -------------------------------------------------- */

const CORE_TEMPO = path.join(SRC, 'core', 'tempo')

if (!exists(CORE_TEMPO)) {
  fail('src/core/tempo tidak ditemukan')
} else {
  pass('Core tempo directory ada')
}

function scanCoreViolations(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanCoreViolations(full)
    }

    if (file.endsWith('.ts')) {
      const content = read(full)

      if (content.includes('modules/')) {
        fail(`Core mengimpor modules: ${full}`)
      }

      if (content.match(/use(State|Store)|zustand|redux/)) {
        fail(`Core mengandung state management: ${full}`)
      }

      if (
        content.includes('fee') ||
        content.includes('balance') ||
        content.includes('orderbook') ||
        content.includes('dex_')
      ) {
        // Allowed as typing / endpoint name, not logic
        if (content.match(/if\s*\(|Math\.|for\s*\(|while\s*\(/)) {
          fail(`Core mengandung business logic: ${full}`)
        }
      }
    }
  }
}

scanCoreViolations(CORE_TEMPO)
pass('Core tempo bebas pelanggaran boundary')

/* -------------------------------------------------- */
/* 2. SERVICE HANYA BOLEH JADI PLUMBING                */
/* -------------------------------------------------- */

function scanService(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanService(full)
    }

    if (file === 'service.ts') {
      const content = read(full)

      if (content.includes('Math.random')) {
        fail(`Mock / randomness masih ada di service: ${full}`)
      }

      if (
        content.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/)
      ) {
        fail(`Business logic ditemukan di service: ${full}`)
      }

      if (content.includes('eth_getBalance')) {
        fail(`Service memakai Ethereum mindset (eth_getBalance): ${full}`)
      }
    }
  }
}

scanService(path.join(SRC, 'modules'))
pass('Service hanya berfungsi sebagai plumbing')

/* -------------------------------------------------- */
/* 3. STORE TIDAK BOLEH TAHU CORE DETAIL               */
/* -------------------------------------------------- */

function scanStore(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanStore(full)
    }

    if (file === 'store.ts') {
      const content = read(full)

      if (content.includes('core/tempo')) {
        fail(`Store mengimpor core langsung: ${full}`)
      }

      if (
        content.includes('fee') ||
        content.includes('dex') ||
        content.includes('order')
      ) {
        fail(`Store mengandung business semantics: ${full}`)
      }
    }
  }
}

scanStore(path.join(SRC, 'modules'))
pass('Store tetap netral & bodoh')

/* -------------------------------------------------- */
/* 4. UI TIDAK BOLEH SENTUH CORE / SERVICE             */
/* -------------------------------------------------- */

function scanUI(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanUI(full)
    }

    if (file.endsWith('.tsx')) {
      const content = read(full)

      if (
        content.includes('core/tempo') ||
        content.includes('service.ts')
      ) {
        fail(`UI mengimpor core / service: ${full}`)
      }
    }
  }
}

scanUI(path.join(SRC, 'modules'))
pass('UI tidak tahu dunia luar')

/* -------------------------------------------------- */
/* 5. TIDAK ADA MOCK TERSISA                           */
/* -------------------------------------------------- */

function scanMock(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      scanMock(full)
    }

    if (file.endsWith('.ts')) {
      const content = read(full)

      if (
        content.includes('mock') ||
        content.includes('FAKE') ||
        content.includes('DUMMY')
      ) {
        fail(`Mock tersisa di Phase 3: ${full}`)
      }
    }
  }
}

scanMock(SRC)
pass('Tidak ada mock tersisa')

/* -------------------------------------------------- */
/* FINAL RESULT                                      */
/* -------------------------------------------------- */

if (hasError) {
  console.error('\n🚨 AUDIT PHASE 3 — FAILED')
  process.exit(1)
} else {
  console.log('\n🏁 AUDIT PHASE 3 — PASS')
  console.log('Phase 3 bersih: plumbing siap, business logic belum bocor.')
}
