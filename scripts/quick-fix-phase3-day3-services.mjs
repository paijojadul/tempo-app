// scripts/quick-fix-phase3-day3-services.mjs
// Phase 3 Day 3 — Service Switch (Mock → Core)
// RULES:
// - Service = adapter only
// - No business logic
// - No DTO mapping
// - Signature MUST stay the same

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MODULES_DIR = path.resolve(__dirname, '../src/modules')
const CORE_IMPORT = "import * as core from '@/core/tempo'"

function pascalToCamel(str) {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function buildService(moduleName) {
  const entity = moduleName.slice(0, -1) // accounts → account (heuristic)
  const plural = moduleName
  const fnName = `fetch${plural.charAt(0).toUpperCase()}${plural.slice(1)}`
  const coreFn = `get${plural.charAt(0).toUpperCase()}${plural.slice(1)}`

  return `// Service — Phase 3 Day 3
// ✅ Adapter only
// ❌ No business logic
// ❌ No state
// ❌ No mock
// ❌ No DTO mapping

${CORE_IMPORT}

export async function ${fnName}() {
  return core.${coreFn}()
}
`
}

console.log('🔧 Phase 3 Day 3 — Fixing module services...\n')

const modules = fs.readdirSync(MODULES_DIR)

for (const moduleName of modules) {
  const servicePath = path.join(MODULES_DIR, moduleName, 'service.ts')

  if (!fs.existsSync(servicePath)) continue

  const content = fs.readFileSync(servicePath, 'utf8')

  if (content.includes('core.') || content.includes("from '@/core/tempo'")) {
    console.log(`⚠️  Skipped (already core-wired): ${moduleName}`)
    continue
  }

  const next = buildService(moduleName)
  fs.writeFileSync(servicePath, next, 'utf8')

  console.log(`✅ Updated service: ${moduleName}/service.ts`)
}

console.log('\n🎉 DONE — Phase 3 Day 3 services are now core-wired')
console.log('👉 Next: run healthcheck')
console.log('   node scripts/healthcheck.mjs')
