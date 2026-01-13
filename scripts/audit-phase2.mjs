#!/usr/bin/env node
/**
 * ============================================================
 * PHASE 2 AUDIT — MODULE & FEATURE BOUNDARY
 * ============================================================
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const MODULES = path.join(SRC, 'modules')

let failed = false
const violations = []

function fail(file, reason) {
  failed = true
  violations.push({ file, reason })
}

function read(file) {
  return fs.readFileSync(file, 'utf-8')
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) walk(full, cb)
    else cb(full)
  }
}

function isTS(file) {
  return file.endsWith('.ts') || file.endsWith('.tsx')
}

/* ============================================================
 * RULE 1 — MODULE MUST NOT IMPORT CORE (PHASE 2)
 * ========================================================== */

walk(MODULES, file => {
  if (!isTS(file)) return
  const code = read(file)

  if (code.includes('core/')) {
    fail(file, 'Module importing core/* (FORBIDDEN in Phase 2)')
  }
})

/* ============================================================
 * RULE 2 — NO CROSS-MODULE IMPORT
 * ========================================================== */

const moduleNames = fs.readdirSync(MODULES)

walk(MODULES, file => {
  if (!isTS(file)) return
  const code = read(file)

  for (const name of moduleNames) {
    if (!file.includes(`/modules/${name}/`)) {
      if (code.includes(`/modules/${name}`)) {
        fail(file, `Cross-module import detected (${name})`)
      }
    }
  }
})

/* ============================================================
 * RULE 3 — UI MUST NOT CALL SERVICE DIRECTLY
 * ========================================================== */

walk(MODULES, file => {
  if (!file.endsWith('ui.tsx')) return
  const code = read(file)

  if (code.includes('service') || code.includes('fetch')) {
    fail(file, 'UI calling service directly (must use store)')
  }
})

/* ============================================================
 * RULE 4 — STORE MUST NOT CALL API / FETCH
 * ========================================================== */

walk(MODULES, file => {
  if (!file.endsWith('store.ts')) return
  const code = read(file)

  if (
    code.includes('fetch(') ||
    code.includes('axios') ||
    code.includes('tempoRequest')
  ) {
    fail(file, 'Store performing API call (FORBIDDEN)')
  }
})

/* ============================================================
 * RULE 5 — SERVICE MUST NOT HAVE STATE OR UI LOGIC
 * ========================================================== */

walk(MODULES, file => {
  if (!file.endsWith('service.ts')) return
  const code = read(file)

  if (
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('createContext')
  ) {
    fail(file, 'Service contains UI/state logic')
  }
})

/* ============================================================
 * RESULT
 * ========================================================== */

if (failed) {
  console.error('\n❌ PHASE 2 AUDIT FAILED\n')
  for (const v of violations) {
    console.error(`- ${v.file}`)
    console.error(`  → ${v.reason}\n`)
  }
  process.exit(1)
} else {
  console.log('✅ PHASE 2 AUDIT PASSED')
  console.log('Modules, Service, Store, UI boundaries are CLEAN')
}
