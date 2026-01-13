#!/usr/bin/env node
/**
 * 🧪 PHASE 4 — DAY 2
 * TypeScript Strictness Audit (READ-ONLY)
 *
 * FIXED:
 * - Aman untuk JSONC kompleks (paths, multiline, dsb)
 * - Tidak pakai regex sembrono
 */

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = process.cwd()

const TSCONFIG_CANDIDATES = [
  'tsconfig.json',
  'tsconfig.app.json',
]

const TARGET_FLAGS = [
  'noUncheckedIndexedAccess',
  'noImplicitOverride',
  'exactOptionalPropertyTypes',
]

function findTsconfig() {
  for (const name of TSCONFIG_CANDIDATES) {
    const fullPath = path.join(ROOT, name)
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
  }
  return null
}

function loadTsconfig(tsconfigPath) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)

  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  }

  return configFile.config
}

function main() {
  console.log('\n🧪 PHASE 4 — DAY 2: TYPESCRIPT STRICTNESS AUDIT\n')

  const tsconfigPath = findTsconfig()

  if (!tsconfigPath) {
    console.error('❌ Tidak menemukan tsconfig.json atau tsconfig.app.json')
    process.exit(1)
  }

  console.log(`📄 Tsconfig digunakan: ${path.basename(tsconfigPath)}\n`)

  let config
  try {
    config = loadTsconfig(tsconfigPath)
  } catch (err) {
    console.error('❌ Gagal membaca tsconfig:')
    console.error(err.message)
    process.exit(1)
  }

  const compilerOptions = config.compilerOptions || {}

  console.log('🔍 STATUS STRICTNESS FLAG TARGET:\n')

  let enabledCount = 0

  for (const flag of TARGET_FLAGS) {
    const value = compilerOptions[flag]

    if (value === true) {
      console.log(`✅ ${flag}: ON`)
      enabledCount++
    } else {
      console.log(`⚪ ${flag}: OFF`)
    }
  }

  console.log('\n📊 RINGKASAN:')
  console.log(`- Flag aktif: ${enabledCount}/${TARGET_FLAGS.length}`)
  console.log('- Mode audit: READ-ONLY')
  console.log('- Parsing: TypeScript official API')
  console.log('- Tidak ada perubahan dilakukan')

  if (enabledCount > 1) {
    console.log('\n⚠️ PERINGATAN PHASE 4')
    console.log('Lebih dari 1 strictness flag aktif.')
    console.log('Pastikan ini dilakukan BERTAHAP & DISADARI.')
  }

  console.log('\n🟢 DAY 2 AUDIT SELESAI')
  console.log('Siap masuk tahap ENABLE FLAG PERTAMA (manual & terkontrol)\n')
}

main()
