#!/usr/bin/env node
/**
 * PHASE 4 — DAY 1
 * ESLINT HARDENING AUDIT (FLAT CONFIG)
 *
 * Validasi:
 * - eslint.config.js dipakai
 * - no-restricted-imports aktif
 * - pattern arsitektur WAJIB ada
 */

import fs from 'fs'
import path from 'path'
import url from 'url'

const ROOT = process.cwd()
const ESLINT_CONFIG = path.join(ROOT, 'eslint.config.js')

function fail(message) {
  console.error(`\n❌ [PHASE 4 – DAY 1 FAILED]\n${message}\n`)
  process.exit(1)
}

function pass(message) {
  console.log(`✅ ${message}`)
}

async function loadFlatConfig() {
  if (!fs.existsSync(ESLINT_CONFIG)) {
    fail('eslint.config.js tidak ditemukan')
  }

  try {
    const fileUrl = url.pathToFileURL(ESLINT_CONFIG).href
    const config = await import(fileUrl)

    if (!Array.isArray(config.default)) {
      fail('eslint.config.js harus export array (Flat Config)')
    }

    return config.default
  } catch (err) {
    fail(`Gagal load eslint.config.js: ${err.message}`)
  }
}

function auditNoRestrictedImports(configArray) {
  const requiredPatterns = [
    '@/core/*',
    '@/modules/*/*',
  ]

  let foundRule = false
  let collectedPatterns = []

  for (const block of configArray) {
    if (!block.rules) continue

    const rule = block.rules['no-restricted-imports']
    if (!rule) continue

    foundRule = true

    const [, options] = rule
    if (!options || !Array.isArray(options.patterns)) {
      fail(
        '"no-restricted-imports" harus menggunakan "patterns" (Flat Config)'
      )
    }

    collectedPatterns.push(...options.patterns)
  }

  if (!foundRule) {
    fail('Rule "no-restricted-imports" BELUM dipasang di eslint.config.js')
  }

  const missing = requiredPatterns.filter(
    (p) => !collectedPatterns.includes(p)
  )

  if (missing.length > 0) {
    fail(
      `Pattern larangan import BELUM LENGKAP.
Kurang:
${missing.map((p) => `- ${p}`).join('\n')}`
    )
  }

  pass('Rule no-restricted-imports terpasang & lengkap (Flat Config)')
}

async function main() {
  console.log('\n🧪 PHASE 4 — DAY 1: ESLINT HARDENING AUDIT (FLAT CONFIG)\n')

  const configArray = await loadFlatConfig()
  auditNoRestrictedImports(configArray)

  console.log('\n🟢 PHASE 4 — DAY 1 AUDIT PASSED')
  console.log('ESLint Flat Config sudah jadi pagar arsitektur.\n')
}

main()
