#!/usr/bin/env node
/**
 * ============================================================
 * PHASE 3 ARCHITECTURE AUDIT
 * ------------------------------------------------------------
 * Rule enforced:
 * - UI & store MUST NOT call API / fetch
 * - Service = adapter only (no logic, no fetch)
 * - Core = only API gateway
 * - No mock usage in Phase 3
 * ============================================================
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')

let violations = []

/* ============================================================
 * Helpers
 * ========================================================== */

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, cb)
    else cb(full)
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function fail(file, reason) {
  violations.push({ file, reason })
}

/* ============================================================
 * RULE 1 — UI & STORE MUST NOT CALL API
 * ========================================================== */

walk(path.join(SRC, 'modules'), file => {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return
  if (file.includes('/service.ts')) return

  const code = read(file)

  if (
    code.includes('fetch(') ||
    code.includes('tempoRequest(') ||
    code.match(/dex_get|eth_call|eth_send/)
  ) {
    fail(file, 'UI / store calling API or RPC (FORBIDDEN in Phase 3)')
  }
})

/* ============================================================
 * RULE 2 — SERVICE MUST NOT CONTAIN BUSINESS LOGIC
 * ========================================================== */

walk(path.join(SRC, 'modules'), file => {
  if (!file.endsWith('/service.ts')) return

  const code = read(file)

  if (
    code.match(/if\s*\(|for\s*\(|while\s*\(/) ||
    code.includes('map(') ||
    code.includes('reduce(') ||
    code.includes('filter(')
  ) {
    fail(file, 'Business logic detected in service.ts (adapter only!)')
  }

  if (code.includes('fetch(')) {
    fail(file, 'Service calling fetch directly (must go via core)')
  }
})

/* ============================================================
 * RULE 3 — CORE MUST NOT IMPORT MODULE / UI / STORE
 * ========================================================== */

walk(path.join(SRC, 'core'), file => {
  if (!file.endsWith('.ts')) return

  const code = read(file)

  if (
    code.includes('/modules/') ||
    code.includes('/store') ||
    code.includes('.tsx')
  ) {
    fail(file, 'Core importing module / UI / store (HARD VIOLATION)')
  }
})

/* ============================================================
 * RULE 4 — MOCK MUST NOT BE USED (DAY 3 SAFE)
 * ========================================================== */

walk(path.join(SRC, 'modules'), file => {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return
  const code = read(file)

  if (code.includes('/mocks/') || code.includes('mock')) {
    fail(file, 'Module using mock in Phase 3 (FORBIDDEN)')
  }
})

walk(path.join(SRC, 'core'), file => {
  if (!file.endsWith('.ts')) return
  const code = read(file)

  if (
    code.includes('from \'./mocks\'') ||
    code.includes('from "./mocks"')
  ) {
    fail(file, 'Core importing mocks in Phase 3')
  }
})

/* ============================================================
 * REPORT
 * ========================================================== */

if (violations.length === 0) {
  console.log('✅ PHASE 3 AUDIT PASSED')
  console.log('Architecture is CLEAN & ROADMAP-ALIGNED')
  process.exit(0)
}

console.error('❌ PHASE 3 AUDIT FAILED\n')

violations.forEach((v, i) => {
  console.error(`${i + 1}. ${v.file}`)
  console.error(`   → ${v.reason}\n`)
})

process.exit(1)
