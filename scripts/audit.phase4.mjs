#!/usr/bin/env node
/**
 * PHASE 4 AUDIT — QUALITY HARDENING (FINAL)
 *
 * Prinsip:
 * - TIDAK menjalankan lint / tsc sendiri
 * - HANYA memverifikasi bahwa aturan Phase 4 SUDAH DIKUNCI
 * - Single Source of Truth tetap: scripts/healthcheck.mjs
 *
 * Phase 4 = mengunci, bukan mengulang tooling
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

let FAILED = false
const fail = (msg) => {
  FAILED = true
  console.error('❌', msg)
}
const pass = (msg) => console.log('✅', msg)

/* -------------------------------------------------- */
/* Utils                                              */
/* -------------------------------------------------- */
function fileExists(p) {
  return fs.existsSync(path.join(ROOT, p))
}

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf-8')
}

function scanFiles(dir, matcher, hits = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) {
      scanFiles(full, matcher, hits)
    } else if (matcher(full)) {
      hits.push(full)
    }
  }
  return hits
}

/* -------------------------------------------------- */
/* 1. ESLINT CONFIG HARDENED                           */
/* -------------------------------------------------- */
console.log('\n🔍 ESLINT HARDENING')

if (!fileExists('eslint.config.js') && !fileExists('eslint.config.ts')) {
  fail('ESLint config tidak ditemukan')
} else {
  const eslintConfig =
    fileExists('eslint.config.ts')
      ? read('eslint.config.ts')
      : read('eslint.config.js')

  if (!eslintConfig.includes('no-restricted-imports')) {
    fail('no-restricted-imports belum dikunci')
  } else {
    pass('no-restricted-imports aktif')
  }
}

/* -------------------------------------------------- */
/* 2. TYPESCRIPT STRICT FLAGS                          */
/* -------------------------------------------------- */
console.log('\n🔍 TYPESCRIPT STRICTNESS')

if (!fileExists('tsconfig.json')) {
  fail('tsconfig.json tidak ditemukan')
} else {
  const tsconfig = read('tsconfig.json')

  const REQUIRED_FLAGS = [
    'noUncheckedIndexedAccess',
    'noImplicitOverride',
    'exactOptionalPropertyTypes',
  ]

  for (const flag of REQUIRED_FLAGS) {
    if (!tsconfig.includes(flag)) {
      fail(`TS flag belum aktif: ${flag}`)
    } else {
      pass(`TS flag aktif: ${flag}`)
    }
  }
}

/* -------------------------------------------------- */
/* 3. TYPE & LINT BYPASS SCAN                          */
/* -------------------------------------------------- */
console.log('\n🔍 BYPASS SCAN')

const SOURCE_DIRS = ['src']
const FORBIDDEN_PATTERNS = [
  '@ts-ignore',
  '@ts-nocheck',
  ' as any',
]

for (const dir of SOURCE_DIRS) {
  const files = scanFiles(
    path.join(ROOT, dir),
    (f) => f.endsWith('.ts') || f.endsWith('.tsx')
  )

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.includes(pattern)) {
        fail(`Bypass ditemukan (${pattern}) di ${path.relative(ROOT, file)}`)
      }
    }
  }
}

if (!FAILED) pass('Tidak ada bypass type / lint')

/* -------------------------------------------------- */
/* 4. ILLEGAL IMPORT PATTERN SCAN                      */
/* -------------------------------------------------- */
console.log('\n🔍 ILLEGAL IMPORT SCAN')

const ILLEGAL_IMPORTS = [
  '@/core/',
  '@/modules/',
]

const tsFiles = scanFiles(
  path.join(ROOT, 'src'),
  (f) => f.endsWith('.ts') || f.endsWith('.tsx')
)

for (const file of tsFiles) {
  const content = fs.readFileSync(file, 'utf-8')

  for (const illegal of ILLEGAL_IMPORTS) {
    if (
      content.includes(`from '${illegal}`) ||
      content.includes(`from "${illegal}`)
    ) {
      // App layer boleh import modules lewat public API
      if (file.includes('/app/') && illegal === '@/modules/') continue

      fail(`Import ilegal ${illegal} di ${path.relative(ROOT, file)}`)
    }
  }
}

if (!FAILED) pass('Tidak ada import ilegal')

/* -------------------------------------------------- */
/* FINAL RESULT                                       */
/* -------------------------------------------------- */
console.log('\n════════════════════════════════════')
if (FAILED) {
  console.error('🔴 PHASE 4 AUDIT FAILED')
  process.exit(1)
} else {
  console.log('🟢 PHASE 4 AUDIT PASSED')
  console.log('QUALITY HARDENING LOCKED')
}
