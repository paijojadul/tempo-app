#!/usr/bin/env node
/**
 * AUDIT PHASE 5 — SCALE READINESS
 *
 * Tujuan:
 * - Pastikan dokumentasi WAJIB ada
 * - Pastikan guard & audit phase sebelumnya aktif
 * - Pastikan tidak ada bypass disiplin (any, ts-ignore, dll)
 *
 * Phase 5 = manusia boleh salah, sistem tidak
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

let hasError = false

function fail(msg) {
  console.error(`❌ ${msg}`)
  hasError = true
}

function pass(msg) {
  console.log(`✅ ${msg}`)
}

function mustExist(relPath, label) {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) {
    fail(`${label} MISSING → ${relPath}`)
  } else {
    pass(`${label} OK`)
  }
}

function scanFiles(dir, predicate, description) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      scanFiles(full, predicate, description)
    } else if (e.isFile() && e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8')
      if (predicate(content)) {
        fail(`${description} → ${path.relative(ROOT, full)}`)
      }
    }
  }
}

console.log('\n🔍 AUDIT PHASE 5 — SCALE READINESS\n')

/* ======================================================
 * 1. DOCUMENTATION WAJIB
 * ====================================================== */

mustExist('README.md', 'README')
mustExist('docs/ARCHITECTURE.md', 'ARCHITECTURE DOC')
mustExist('docs/ROADMAP.md', 'ROADMAP DOC')
mustExist('docs/ANTI_PATTERNS.md', 'ANTI-PATTERN DOC')
mustExist('docs/CONTRIBUTING.md', 'CONTRIBUTING DOC')

/* ======================================================
 * 2. AUDIT SCRIPT SEBELUMNYA HARUS ADA
 * ====================================================== */

mustExist('scripts/healthcheck.mjs', 'Healthcheck')
mustExist('scripts/audit.phase2.mjs', 'Audit Phase 2')
mustExist('scripts/audit.phase3.mjs', 'Audit Phase 3')
mustExist('scripts/audit.phase4.mjs', 'Audit Phase 4')

/* ======================================================
 * 3. ANTI BYPASS DISCIPLINE
 * ====================================================== */

console.log('\n🔎 Scanning forbidden patterns...\n')

// as any
scanFiles(
  path.join(ROOT, 'src'),
  (c) => c.includes('as any'),
  'Forbidden cast "as any"'
)

// @ts-ignore
scanFiles(
  path.join(ROOT, 'src'),
  (c) => c.includes('@ts-ignore'),
  'Forbidden @ts-ignore'
)

// eslint-disable (global)
scanFiles(
  path.join(ROOT, 'src'),
  (c) => c.includes('eslint-disable'),
  'ESLint bypass detected'
)

/* ======================================================
 * FINAL RESULT
 * ====================================================== */

if (hasError) {
  console.error('\n🟥 PHASE 5 AUDIT FAILED')
  console.error('➡️ Project NOT ready for scale / multi-dev\n')
  process.exit(1)
} else {
  console.log('\n🟢 PHASE 5 AUDIT PASSED')
  console.log('🏗️ Scale-ready, rule-driven, chaos-resistant\n')
}
