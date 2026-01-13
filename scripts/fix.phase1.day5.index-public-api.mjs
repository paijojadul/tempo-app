#!/usr/bin/env node
/**
 * FIX SCRIPT — PHASE 1 DAY 5
 * Lock module public API (index.ts)
 */

import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

console.log('🛠️ FIX DAY 5 — MODULE PUBLIC API\n')

const modules = fs
  .readdirSync(MODULES_DIR)
  .filter((name) =>
    fs.statSync(path.join(MODULES_DIR, name)).isDirectory()
  )

for (const moduleName of modules) {
  const indexPath = path.join(
    MODULES_DIR,
    moduleName,
    'index.ts'
  )

  if (!fs.existsSync(indexPath)) {
    console.log(`⚠️  ${moduleName}: index.ts not found`)
    continue
  }

  const Pascal =
    moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const content = `// Public API — Phase 1
// ❌ Do not export store
// ❌ Do not export service
// ✅ UI only

export { ${Pascal}UI } from './ui'
`

  fs.writeFileSync(indexPath, content, 'utf8')
  console.log(`🔒 ${moduleName}: index.ts locked`)
}

console.log('\n🎉 DAY 5 PUBLIC API LOCKED')
