#!/usr/bin/env node
/**
 * FIX SCRIPT — PHASE 1 DAY 4
 * Service Placeholder (Safe, Dummy, Idempotent)
 */

import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

if (!fs.existsSync(MODULES_DIR)) {
  console.error('❌ src/modules not found')
  process.exit(1)
}

const modules = fs
  .readdirSync(MODULES_DIR)
  .filter((name) =>
    fs.statSync(path.join(MODULES_DIR, name)).isDirectory()
  )

console.log('🛠️ FIX DAY 4 — SERVICE PLACEHOLDER\n')

for (const moduleName of modules) {
  const servicePath = path.join(
    MODULES_DIR,
    moduleName,
    'service.ts'
  )

  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️  ${moduleName}: service.ts not found, skipped`)
    continue
  }

  const existing = fs.readFileSync(servicePath, 'utf8')

  // Kalau sudah ada dummy async → jangan sentuh
  if (existing.includes('Promise.resolve')) {
    console.log(`✅ ${moduleName}: service placeholder already OK`)
    continue
  }

  const Pascal =
    moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const content = `// Service Placeholder — Phase 1
// ❌ No real API
// ❌ No logic
// ✅ Safe dummy

export async function fetch${Pascal}() {
  return Promise.resolve([])
}
`

  fs.writeFileSync(servicePath, content, 'utf8')
  console.log(`🔧 ${moduleName}: service.ts fixed`)
}

console.log('\n🎉 DAY 4 SERVICE PLACEHOLDER DONE')
